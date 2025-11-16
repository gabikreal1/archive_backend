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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const job_entity_1 = require("../entities/job.entity");
const bid_entity_1 = require("../entities/bid.entity");
const create_job_dto_1 = require("./dto/create-job.dto");
const job_orchestration_service_1 = require("./job-orchestration.service");
const order_book_service_1 = require("../blockchain/order-book/order-book.service");
const wallet_service_1 = require("../circle/wallet/wallet.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
const metadata_service_1 = require("../blockchain/ipfs/metadata.service");
const escrow_service_1 = require("../blockchain/escrow/escrow.service");
const ethers_1 = require("ethers");
let JobsService = class JobsService {
    jobsRepo;
    bidsRepo;
    orderBook;
    walletService;
    websocketGateway;
    metadataService;
    jobOrchestration;
    escrow;
    constructor(jobsRepo, bidsRepo, orderBook, walletService, websocketGateway, metadataService, jobOrchestration, escrow) {
        this.jobsRepo = jobsRepo;
        this.bidsRepo = bidsRepo;
        this.orderBook = orderBook;
        this.walletService = walletService;
        this.websocketGateway = websocketGateway;
        this.metadataService = metadataService;
        this.jobOrchestration = jobOrchestration;
        this.escrow = escrow;
    }
    async createJob(userId, dto, extra) {
        const posterWallet = await this.walletService.getOrCreateUserWallet(userId);
        const metadataUpload = await this.metadataService.publishJobMetadata({
            title: dto.title,
            description: dto.description,
            tags: dto.tags ?? [],
            deadline: dto.deadline ?? null,
            posterWallet,
            createdBy: userId,
            requirements: (dto.requirements ?? []).map((requirement) => ({
                requirement: requirement.requirement,
                mandatory: requirement.mandatory ?? false,
            })),
            deliverableFormat: dto.deliverableFormat ?? create_job_dto_1.JobDeliverableFormat.JSON,
            additionalContext: dto.additionalContext,
            referenceLinks: dto.referenceLinks ?? [],
            attachments: dto.attachments ?? [],
            pinName: `job-${Date.now()}`,
        });
        const { jobId, txHash } = await this.orderBook.postJob({
            description: dto.description,
            metadataUri: metadataUpload.uri,
            tags: dto.tags ?? [],
            deadline: dto.deadline
                ? Math.floor(new Date(dto.deadline).getTime() / 1000)
                : 0,
        });
        const job = this.jobsRepo.create({
            id: jobId,
            posterWallet,
            description: dto.description,
            tags: dto.tags ?? null,
            deadline: dto.deadline ? new Date(dto.deadline) : null,
            metadataUri: metadataUpload.uri,
            status: job_entity_1.JobStatus.OPEN,
            createdAt: new Date(),
            createdByUserId: userId,
            conversationId: extra?.conversationId ?? null,
        });
        await this.jobsRepo.save(job);
        this.websocketGateway.broadcastNewJob(job);
        void this.jobOrchestration.launchAuction(job);
        return {
            jobId,
            txHash,
            metadataUri: metadataUpload.uri,
            metadataCid: metadataUpload.cid,
        };
    }
    async findJob(jobId) {
        const job = await this.jobsRepo.findOne({
            where: { id: jobId },
            relations: ['bids'],
        });
        return job;
    }
    async listJobs(status, tags) {
        const qb = this.jobsRepo.createQueryBuilder('job');
        if (status) {
            qb.andWhere('job.status = :status', { status });
        }
        if (tags && tags.length > 0) {
            qb.andWhere('job.tags && :tags', { tags });
        }
        qb.orderBy('job.created_at', 'DESC');
        return qb.getMany();
    }
    async acceptBid(userId, jobId, dto) {
        const job = await this.jobsRepo.findOne({ where: { id: jobId } });
        if (!job) {
            throw new Error('Job not found');
        }
        const userWallet = await this.walletService.getOrCreateUserWallet(userId);
        const onchainJob = await this.orderBook.getJob(job.id);
        const onchainBid = onchainJob.bids.find((b) => b.id === dto.bidId);
        if (!onchainBid) {
            throw new Error('Bid not found');
        }
        const priceHuman = ethers_1.ethers.formatUnits(onchainBid.price, 6);
        await this.walletService.approveEscrowSpend(userId, priceHuman);
        await this.escrow.ensureOnchainAllowance(priceHuman);
        job.status = job_entity_1.JobStatus.IN_PROGRESS;
        await this.jobsRepo.save(job);
        this.websocketGateway.notifyJobAwarded(job, {
            id: onchainBid.id,
            jobId: job.id,
            bidderWallet: onchainBid.bidder,
            price: priceHuman,
            deliveryTime: onchainBid.deliveryTime,
            reputation: onchainBid.reputation,
            accepted: true,
        });
        const shouldPublishResponse = (dto.answers && dto.answers.length > 0) ||
            !!dto.additionalNotes ||
            !!dto.contactPreference;
        let responseMetadataInput;
        if (shouldPublishResponse) {
            const answersArray = dto.answers ?? [];
            const answersRecord = answersArray.reduce((acc, answer) => {
                acc[answer.id] = {
                    question: answer.question,
                    answer: answer.answer,
                };
                return acc;
            }, {});
            responseMetadataInput = {
                answeredBy: userWallet,
                answers: answersRecord,
                additionalNotes: dto.additionalNotes,
                contactPreference: dto.contactPreference,
                answeredAt: dto.answeredAt,
                pinName: `bid-response-${Date.now()}`,
            };
        }
        const { txHash: acceptBidTxHash, responseUri, responseCid } = await this.orderBook.acceptBid({
            jobId: job.id,
            bidId: dto.bidId,
            responseMetadata: responseMetadataInput,
        });
        void this.jobOrchestration
            .triggerExecutionForAcceptedBid(job.id, dto.bidId)
            .catch(() => {
        });
        return {
            success: true,
            escrowTxHash: null,
            acceptBidTxHash,
            bidResponseMetadataUri: responseUri,
            bidResponseMetadataCid: responseCid,
        };
    }
    async approveJob(jobId) {
        const job = await this.jobsRepo.findOne({
            where: { id: jobId },
        });
        if (!job) {
            throw new Error('Job not found');
        }
        const onchainJob = await this.orderBook.getJob(job.id);
        if (!onchainJob.acceptedBidId || onchainJob.acceptedBidId === '0') {
            throw new Error('No accepted bid for this job');
        }
        const winningBid = onchainJob.bids.find((b) => b.id === onchainJob.acceptedBidId);
        if (!winningBid) {
            throw new Error('Accepted bid not found onchain');
        }
        const priceHuman = ethers_1.ethers.formatUnits(winningBid.price, 6);
        const { txHash: paymentTxHash } = await this.orderBook.approveDelivery(job.id);
        job.status = job_entity_1.JobStatus.COMPLETED;
        await this.jobsRepo.save(job);
        this.websocketGateway.notifyPaymentReleased(job, {
            id: winningBid.id,
            jobId: job.id,
            bidderWallet: winningBid.bidder,
            price: priceHuman,
            deliveryTime: winningBid.deliveryTime,
            reputation: winningBid.reputation,
            accepted: true,
        });
        return { success: true, paymentTxHash };
    }
    async selectExecutor(jobId, dto) {
        return this.jobOrchestration.selectExecutor(jobId, dto.candidateId);
    }
    async submitRating(jobId, dto) {
        return this.jobOrchestration.submitRating(jobId, dto);
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(job_entity_1.JobEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(bid_entity_1.BidEntity)),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => websocket_gateway_1.WebsocketGateway))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        order_book_service_1.OrderBookService,
        wallet_service_1.WalletService,
        websocket_gateway_1.WebsocketGateway,
        metadata_service_1.IpfsMetadataService,
        job_orchestration_service_1.JobOrchestrationService,
        escrow_service_1.EscrowService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map