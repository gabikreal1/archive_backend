"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var JobOrchestrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobOrchestrationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const job_entity_1 = require("../entities/job.entity");
const delivery_entity_1 = require("../entities/delivery.entity");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
const executor_autopilot_service_1 = require("../agents/executor/executor-autopilot.service");
const order_book_service_1 = require("../blockchain/order-book/order-book.service");
let JobOrchestrationService = JobOrchestrationService_1 = class JobOrchestrationService {
    configService;
    jobsRepo;
    deliveriesRepo;
    websocketGateway;
    executorAutopilot;
    orderBook;
    logger = new common_1.Logger(JobOrchestrationService_1.name);
    auctions = new Map();
    bidWindowMs;
    constructor(configService, jobsRepo, deliveriesRepo, websocketGateway, executorAutopilot, orderBook) {
        this.configService = configService;
        this.jobsRepo = jobsRepo;
        this.deliveriesRepo = deliveriesRepo;
        this.websocketGateway = websocketGateway;
        this.executorAutopilot = executorAutopilot;
        this.orderBook = orderBook;
        this.bidWindowMs = Number(this.configService.get('JOB_BID_WINDOW_MS') ?? 10_000);
    }
    onModuleDestroy() {
        for (const state of this.auctions.values()) {
            if (state.timer) {
                clearTimeout(state.timer);
            }
        }
        this.auctions.clear();
    }
    async launchAuction(jobOrId) {
        const job = typeof jobOrId === 'string'
            ? await this.jobsRepo.findOne({ where: { id: jobOrId } })
            : jobOrId;
        if (!job) {
            this.logger.warn(`Cannot launch auction: job ${typeof jobOrId === 'string' ? jobOrId : jobOrId.id} not found`);
            return;
        }
        if (this.auctions.has(job.id)) {
            return;
        }
        const state = {
            jobId: job.id,
            status: 'collecting',
            bids: new Map(),
            startedAt: Date.now(),
            deadline: Date.now() + this.bidWindowMs,
            timer: null,
        };
        state.timer = setTimeout(() => {
            this.finalizeAuction(job.id).catch((error) => {
                this.logger.error(`Failed to finalize auction for job ${job.id}: ${error.message}`);
            });
        }, this.bidWindowMs);
        this.auctions.set(job.id, state);
        this.websocketGateway.broadcastJobAuctionStarted(job.id, {
            deadline: state.deadline,
        });
        void this.executorAutopilot
            .generateBids(job, {
            onBid: (candidate) => this.registerBid(job.id, candidate),
            onError: (agentId, error) => {
                this.logger.warn(`Executor ${agentId} failed to bid on job ${job.id}: ${error.message}`);
            },
        })
            .catch((error) => {
            this.logger.error(`Executor autopilot failed for job ${job.id}: ${error.message}`);
        });
    }
    registerBid(jobId, bid) {
        const state = this.auctions.get(jobId);
        if (!state || state.status !== 'collecting') {
            return;
        }
        state.bids.set(bid.id, bid);
        this.websocketGateway.broadcastJobBid(jobId, bid);
    }
    async finalizeAuction(jobId) {
        const state = this.auctions.get(jobId);
        if (!state) {
            throw new Error(`Auction for job ${jobId} is not tracked`);
        }
        if (state.status !== 'collecting') {
            return state.recommendations ?? {};
        }
        if (state.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }
        const bids = Array.from(state.bids.values());
        const recommendations = this.pickRecommendations(bids);
        state.recommendations = recommendations;
        state.status = 'finalized';
        this.websocketGateway.broadcastJobRecommendations(jobId, {
            totalBids: bids.length,
            recommendations,
        });
        return recommendations;
    }
    async selectExecutor(jobId, candidateId) {
        const job = await this.jobsRepo.findOne({ where: { id: jobId } });
        if (!job) {
            throw new Error('Job not found');
        }
        const state = this.auctions.get(jobId);
        if (!state) {
            throw new Error('Auction not initialized for this job');
        }
        if (state.status === 'collecting') {
            await this.finalizeAuction(jobId);
        }
        if (state.selection) {
            throw new Error('Executor already selected for this job');
        }
        const candidate = state.bids.get(candidateId);
        if (!candidate) {
            throw new Error('Candidate not found in bid set');
        }
        job.status = job_entity_1.JobStatus.IN_PROGRESS;
        await this.jobsRepo.save(job);
        state.selection = {
            candidateId,
            agentId: candidate.agentId,
            selectedAt: Date.now(),
        };
        state.status = 'executing';
        this.websocketGateway.broadcastExecutorSelection(jobId, {
            jobId,
            candidate,
        });
        const execution = await this.executorAutopilot.executeJob(job, candidate);
        state.execution = execution;
        const delivery = this.deliveriesRepo.create({
            id: `delivery_${Date.now()}`,
            jobId,
            agentId: candidate.agentId,
            proofUrl: null,
            resultData: execution,
        });
        await this.deliveriesRepo.save(delivery);
        state.selection.deliveryId = delivery.id;
        this.websocketGateway.notifyDeliverySubmitted(job, {
            deliveryId: delivery.id,
            deliverable: execution.deliverable,
            keyFindings: execution.keyFindings,
        });
        this.websocketGateway.broadcastExecutionResult(jobId, {
            jobId,
            deliveryId: delivery.id,
            result: execution,
        });
        const onchainBidId = (candidate.metadata ?? {})
            .onchainBidId ?? candidate.id;
        void this.orderBook
            .submitDelivery({
            jobId,
            deliveryMetadata: {
                bidId: onchainBidId,
                deliveredBy: candidate.agentId,
                deliveredAt: new Date().toISOString(),
                deliverable: {
                    format: 'JSON',
                    data: execution,
                    attachments: [],
                },
                notes: 'Autonomously submitted by executor autopilot after job acceptance.',
            },
        })
            .catch((error) => {
            this.logger.warn(`Failed to submit onchain delivery for job ${jobId}, bid ${onchainBidId}: ${error.message}`);
        });
        return {
            deliveryId: delivery.id,
            result: execution,
        };
    }
    async triggerExecutionForAcceptedBid(jobId, onchainBidId) {
        const job = await this.jobsRepo.findOne({ where: { id: jobId } });
        if (!job) {
            this.logger.warn(`triggerExecutionForAcceptedBid: job ${jobId} not found`);
            return;
        }
        const state = this.auctions.get(jobId);
        let candidateId;
        if (state) {
            const candidate = Array.from(state.bids.values()).find((bid) => {
                const meta = (bid.metadata ?? {});
                const metaOnchainBidId = meta.onchainBidId;
                return metaOnchainBidId === onchainBidId || bid.id === onchainBidId;
            });
            candidateId = candidate?.id;
        }
        if (candidateId) {
            try {
                await this.selectExecutor(jobId, candidateId);
                return;
            }
            catch (error) {
                this.logger.warn(`triggerExecutionForAcceptedBid: selectExecutor failed for job ${jobId}, candidate ${candidateId}: ${error.message}`);
            }
        }
        else {
            this.logger.warn(`triggerExecutionForAcceptedBid: no Autopilot candidate matched onchain bid ${onchainBidId} for job ${jobId}; using stub delivery.`);
        }
        const stub = {
            agentId: 'stub_executor',
            jobId: job.id,
            deliverable: `Stub deliverable for job ${job.id}.\n\nDescription:\n${job.description}`,
            keyFindings: [
                'This is a fallback result because no executor delivery was available.',
                'Configure executor agents and OpenAI to enable real autonomous execution.',
            ],
            methodology: 'Generated by backend stub flow after bid acceptance when no executor could be matched or execution failed.',
            cautions: [
                'Do not treat this as production-grade output.',
                'Use only for demo purposes.',
            ],
            estimatedHours: 0,
            raw: {
                fallback: true,
            },
        };
        const delivery = this.deliveriesRepo.create({
            id: `delivery_stub_${Date.now()}`,
            jobId,
            agentId: stub.agentId,
            proofUrl: null,
            resultData: stub,
        });
        await this.deliveriesRepo.save(delivery);
        this.websocketGateway.notifyDeliverySubmitted(job, {
            deliveryId: delivery.id,
            deliverable: stub.deliverable,
            keyFindings: stub.keyFindings,
        });
        this.websocketGateway.broadcastExecutionResult(jobId, {
            jobId,
            deliveryId: delivery.id,
            result: stub,
        });
        void this.orderBook
            .submitDelivery({
            jobId,
            deliveryMetadata: {
                bidId: onchainBidId,
                deliveredBy: stub.agentId,
                deliveredAt: new Date().toISOString(),
                deliverable: {
                    format: 'JSON',
                    data: stub,
                    attachments: [],
                },
                notes: 'Stub delivery created because no executor candidate matched or execution failed.',
            },
        })
            .catch((error) => {
            this.logger.warn(`Failed to submit stub onchain delivery for job ${jobId}, bid ${onchainBidId}: ${error.message}`);
        });
    }
    async submitRating(jobId, dto) {
        const delivery = await this.deliveriesRepo.findOne({
            where: { id: dto.deliveryId, jobId },
        });
        if (!delivery) {
            throw new Error('Delivery not found');
        }
        delivery.rating = dto.rating;
        delivery.feedback = dto.feedback ?? null;
        await this.deliveriesRepo.save(delivery);
        const job = await this.jobsRepo.findOne({ where: { id: jobId } });
        if (job) {
            job.status = job_entity_1.JobStatus.COMPLETED;
            await this.jobsRepo.save(job);
        }
        const state = this.auctions.get(jobId);
        if (state) {
            state.status = 'closed';
            if (state.timer) {
                clearTimeout(state.timer);
                state.timer = null;
            }
            this.auctions.delete(jobId);
        }
        this.websocketGateway.broadcastJobRating(jobId, {
            rating: dto.rating,
            feedback: dto.feedback,
        });
        return { success: true };
    }
    pickRecommendations(bids) {
        if (bids.length === 0) {
            return {};
        }
        const premiumSorted = [...bids].sort((a, b) => {
            const tierBoost = (b.tierHint === 'PREMIUM' ? 0.1 : 0) -
                (a.tierHint === 'PREMIUM' ? 0.1 : 0);
            return (b.confidence - a.confidence ||
                tierBoost ||
                b.priceUsd - a.priceUsd ||
                a.etaMinutes - b.etaMinutes);
        });
        const premium = premiumSorted[0];
        const economySorted = [...bids].sort((a, b) => {
            const tierBoost = (a.tierHint === 'ECONOMY' ? 0.1 : 0) -
                (b.tierHint === 'ECONOMY' ? 0.1 : 0);
            return (a.priceUsd - b.priceUsd ||
                tierBoost ||
                a.etaMinutes - b.etaMinutes ||
                b.confidence - a.confidence);
        });
        let economy = economySorted[0];
        if (economy && premium && economy.agentId === premium.agentId) {
            economy = economySorted.find((bid) => bid.agentId !== premium.agentId);
        }
        return {
            premium: premium ?? undefined,
            economy: economy ?? undefined,
        };
    }
};
exports.JobOrchestrationService = JobOrchestrationService;
exports.JobOrchestrationService = JobOrchestrationService = JobOrchestrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(job_entity_1.JobEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(delivery_entity_1.DeliveryEntity)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => websocket_gateway_1.WebsocketGateway))),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => executor_autopilot_service_1.ExecutorAutopilotService))),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        websocket_gateway_1.WebsocketGateway,
        executor_autopilot_service_1.ExecutorAutopilotService,
        order_book_service_1.OrderBookService])
], JobOrchestrationService);
//# sourceMappingURL=job-orchestration.service.js.map