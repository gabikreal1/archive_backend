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
const order_book_service_1 = require("../blockchain/order-book/order-book.service");
const escrow_service_1 = require("../blockchain/escrow/escrow.service");
const wallet_service_1 = require("../circle/wallet/wallet.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
let JobsService = class JobsService {
    jobsRepo;
    bidsRepo;
    orderBook;
    escrow;
    walletService;
    websocketGateway;
    constructor(jobsRepo, bidsRepo, orderBook, escrow, walletService, websocketGateway) {
        this.jobsRepo = jobsRepo;
        this.bidsRepo = bidsRepo;
        this.orderBook = orderBook;
        this.escrow = escrow;
        this.walletService = walletService;
        this.websocketGateway = websocketGateway;
    }
    async createJob(userId, dto) {
        const posterWallet = await this.walletService.getOrCreateUserWallet(userId);
        const { jobId, txHash } = await this.orderBook.postJob({
            poster: posterWallet,
            description: dto.description,
            tags: dto.tags ?? [],
            deadline: dto.deadline ? new Date(dto.deadline).getTime() : undefined,
        });
        const job = this.jobsRepo.create({
            id: jobId,
            posterWallet,
            description: dto.description,
            tags: dto.tags ?? null,
            deadline: dto.deadline ? new Date(dto.deadline) : null,
            status: job_entity_1.JobStatus.OPEN,
        });
        await this.jobsRepo.save(job);
        this.websocketGateway.broadcastNewJob(job);
        return { jobId, txHash };
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
        const bid = await this.bidsRepo.findOne({ where: { id: dto.bidId } });
        if (!bid) {
            throw new Error('Bid not found');
        }
        const userWallet = await this.walletService.getOrCreateUserWallet(userId);
        await this.walletService.approveEscrowSpend(userId, bid.price);
        const { escrowTxHash } = await this.escrow.createEscrow({
            jobId: job.id,
            poster: userWallet,
            agent: bid.bidderWallet,
            amount: bid.price,
        });
        bid.accepted = true;
        await this.bidsRepo.save(bid);
        job.status = job_entity_1.JobStatus.IN_PROGRESS;
        await this.jobsRepo.save(job);
        this.websocketGateway.notifyJobAwarded(job, bid);
        return { success: true, escrowTxHash };
    }
    async approveJob(jobId) {
        const job = await this.jobsRepo.findOne({
            where: { id: jobId },
            relations: ['bids'],
        });
        if (!job) {
            throw new Error('Job not found');
        }
        const winningBid = job.bids?.find((b) => b.accepted);
        if (!winningBid) {
            throw new Error('No accepted bid for this job');
        }
        const { paymentTxHash } = await this.escrow.releasePayment({
            jobId: job.id,
            agent: winningBid.bidderWallet,
            amount: winningBid.price,
        });
        job.status = job_entity_1.JobStatus.COMPLETED;
        await this.jobsRepo.save(job);
        this.websocketGateway.notifyPaymentReleased(job, winningBid);
        return { success: true, paymentTxHash };
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(job_entity_1.JobEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(bid_entity_1.BidEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        order_book_service_1.OrderBookService,
        escrow_service_1.EscrowService,
        wallet_service_1.WalletService,
        websocket_gateway_1.WebsocketGateway])
], JobsService);
//# sourceMappingURL=jobs.service.js.map