import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobEntity, JobStatus } from '../entities/job.entity';
import { BidEntity } from '../entities/bid.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { AcceptBidDto } from './dto/accept-bid.dto';
import { OrderBookService } from '../blockchain/order-book/order-book.service';
import { EscrowService } from '../blockchain/escrow/escrow.service';
import { WalletService } from '../circle/wallet/wallet.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { IpfsService } from '../blockchain/ipfs/ipfs.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(JobEntity)
    private readonly jobsRepo: Repository<JobEntity>,
    @InjectRepository(BidEntity)
    private readonly bidsRepo: Repository<BidEntity>,
    private readonly orderBook: OrderBookService,
    private readonly escrow: EscrowService,
    private readonly walletService: WalletService,
    private readonly websocketGateway: WebsocketGateway,
    private readonly ipfsService: IpfsService,
  ) {}

  async createJob(userId: string, dto: CreateJobDto) {
    // 1) Resolve user wallet (Circle) and onchain address
    const posterWallet = await this.walletService.getOrCreateUserWallet(userId);

    const jobMetadata = {
      version: 1,
      description: dto.description,
      tags: dto.tags ?? [],
      deadline: dto.deadline ?? null,
      posterWallet,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };

    const metadataUpload = await this.ipfsService.uploadJson(
      jobMetadata,
      `job-${Date.now()}`,
    );

    // 2) Create job onchain (OrderBook.postJob)
    const { jobId, txHash } = await this.orderBook.postJob({
      description: dto.description,
      metadataUri: metadataUpload.uri,
      tags: dto.tags ?? [],
      deadline: dto.deadline
        ? Math.floor(new Date(dto.deadline).getTime() / 1000)
        : 0,
    });

    // 3) Persist to Postgres cache
    const job = this.jobsRepo.create({
      id: jobId,
      posterWallet,
      description: dto.description,
      tags: dto.tags ?? null,
      deadline: dto.deadline ? new Date(dto.deadline) : null,
      metadataUri: metadataUpload.uri,
      status: JobStatus.OPEN,
    });
    await this.jobsRepo.save(job);

    // 4) Notify agents via WebSocket (backend-side)
    this.websocketGateway.broadcastNewJob(job);

    return {
      jobId,
      txHash,
      metadataUri: metadataUpload.uri,
      metadataCid: metadataUpload.cid,
    };
  }

  async findJob(jobId: string) {
    const job = await this.jobsRepo.findOne({
      where: { id: jobId },
      relations: ['bids'],
    });
    return job;
  }

  async listJobs(status?: JobStatus, tags?: string[]) {
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

  async acceptBid(userId: string, jobId: string, dto: AcceptBidDto) {
    const job = await this.jobsRepo.findOne({ where: { id: jobId } });
    if (!job) {
      throw new Error('Job not found');
    }
    const bid = await this.bidsRepo.findOne({ where: { id: dto.bidId } });
    if (!bid) {
      throw new Error('Bid not found');
    }

    const userWallet = await this.walletService.getOrCreateUserWallet(userId);

    // 1) Approve USDC spending via Circle
    await this.walletService.approveEscrowSpend(userId, bid.price);

    // 2) Create escrow onchain
    const { escrowTxHash } = await this.escrow.createEscrow({
      jobId: job.id,
      poster: userWallet,
      agent: bid.bidderWallet,
      amount: bid.price,
    });

    // 3) Update local cache
    bid.accepted = true;
    await this.bidsRepo.save(bid);
    job.status = JobStatus.IN_PROGRESS;
    await this.jobsRepo.save(job);

    // 4) Notify winning agent via WebSocket
    this.websocketGateway.notifyJobAwarded(job, bid);

    return { success: true, escrowTxHash };
  }

  async approveJob(jobId: string) {
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

    job.status = JobStatus.COMPLETED;
    await this.jobsRepo.save(job);

    this.websocketGateway.notifyPaymentReleased(job, winningBid);

    return { success: true, paymentTxHash };
  }
}
