import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobEntity, JobStatus } from '../entities/job.entity';
import { BidEntity } from '../entities/bid.entity';
import { CreateJobDto, JobDeliverableFormat } from './dto/create-job.dto';
import { AcceptBidDto } from './dto/accept-bid.dto';
import { SelectExecutorDto } from './dto/select-executor.dto';
import { SubmitRatingDto } from './dto/submit-rating.dto';
import { JobOrchestrationService } from './job-orchestration.service';
import {
  OrderBookService,
  AcceptBidParams,
} from '../blockchain/order-book/order-book.service';
import { WalletService } from '../circle/wallet/wallet.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { IpfsMetadataService } from '../blockchain/ipfs/metadata.service';
import { BidResponseMetadata } from '../blockchain/ipfs/metadata.types';
import { EscrowService } from '../blockchain/escrow/escrow.service';
import { ethers } from 'ethers';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(JobEntity)
    private readonly jobsRepo: Repository<JobEntity>,
    @InjectRepository(BidEntity)
    private readonly bidsRepo: Repository<BidEntity>,
    private readonly orderBook: OrderBookService,
    private readonly walletService: WalletService,
    @Inject(forwardRef(() => WebsocketGateway))
    private readonly websocketGateway: WebsocketGateway,
    private readonly metadataService: IpfsMetadataService,
    private readonly jobOrchestration: JobOrchestrationService,
    private readonly escrow: EscrowService,
  ) {}

  async createJob(
    userId: string,
    dto: CreateJobDto,
    extra?: { conversationId?: string },
  ) {
    // 1) Resolve user wallet (Circle) and onchain address
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
      deliverableFormat: dto.deliverableFormat ?? JobDeliverableFormat.JSON,
      additionalContext: dto.additionalContext,
      referenceLinks: dto.referenceLinks ?? [],
      attachments: dto.attachments ?? [],
      pinName: `job-${Date.now()}`,
    });

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

    const userWallet = await this.walletService.getOrCreateUserWallet(userId);

    // Load onchain job state and bids instead of relying on Postgres bids cache.
    const onchainJob = await this.orderBook.getJob(job.id);
    const onchainBid = onchainJob.bids.find((b) => b.id === dto.bidId);
    if (!onchainBid) {
      throw new Error('Bid not found');
    }

    const priceHuman = ethers.formatUnits(onchainBid.price, 6);

    // 1) Ensure on-chain USDC allowance from the shared operator wallet to Escrow.
    //    Circle is no longer used for DEV spends; funds are pulled directly from
    //    the WEB3 operator wallet.
    await this.escrow.ensureOnchainAllowance(priceHuman);

    // 2) Local job status cache (escrow is managed by the protocol / order book)
    job.status = JobStatus.IN_PROGRESS;
    await this.jobsRepo.save(job);

    // 4) Notify winning agent via WebSocket
    this.websocketGateway.notifyJobAwarded(
      job,
      {
        id: onchainBid.id,
        jobId: job.id,
        bidderWallet: onchainBid.bidder,
        price: priceHuman,
        deliveryTime: onchainBid.deliveryTime,
        reputation: onchainBid.reputation,
        accepted: true,
      } as unknown as BidEntity,
    );

    const shouldPublishResponse =
      (dto.answers && dto.answers.length > 0) ||
      !!dto.additionalNotes ||
      !!dto.contactPreference;

    let responseMetadataInput: AcceptBidParams['responseMetadata'];

    if (shouldPublishResponse) {
      const answersArray = dto.answers ?? [];
      const answersRecord = answersArray.reduce<BidResponseMetadata['answers']>(
        (acc, answer) => {
          acc[answer.id] = {
            question: answer.question,
            answer: answer.answer,
          };
          return acc;
        },
        {},
      );

      responseMetadataInput = {
        answeredBy: userWallet,
        answers: answersRecord,
        additionalNotes: dto.additionalNotes,
        contactPreference: dto.contactPreference,
        answeredAt: dto.answeredAt,
        pinName: `bid-response-${Date.now()}`,
      };
    }

    const { txHash: acceptBidTxHash, responseUri, responseCid } =
      await this.orderBook.acceptBid({
        jobId: job.id,
        bidId: dto.bidId,
        responseMetadata: responseMetadataInput,
      });

    // Kick off offchain execution for the accepted bid. Any errors and
    // mapping issues are handled inside JobOrchestrationService; in the
    // worst case it will emit a stub delivery so the client still sees
    // a structured result.
    void this.jobOrchestration
      .triggerExecutionForAcceptedBid(job.id, dto.bidId)
      .catch(() => {
        // Errors are already logged inside the orchestration service; we
        // deliberately do not fail the HTTP response here.
      });

    return {
      success: true,
      escrowTxHash: null,
      acceptBidTxHash,
      bidResponseMetadataUri: responseUri,
      bidResponseMetadataCid: responseCid,
    };
  }

  async approveJob(jobId: string) {
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

    const winningBid = onchainJob.bids.find(
      (b) => b.id === onchainJob.acceptedBidId,
    );
    if (!winningBid) {
      throw new Error('Accepted bid not found onchain');
    }

    const priceHuman = ethers.formatUnits(winningBid.price, 6);

    const { txHash: paymentTxHash } = await this.orderBook.approveDelivery(
      job.id,
    );

    job.status = JobStatus.COMPLETED;
    await this.jobsRepo.save(job);

    this.websocketGateway.notifyPaymentReleased(
      job,
      {
        id: winningBid.id,
        jobId: job.id,
        bidderWallet: winningBid.bidder,
        price: priceHuman,
        deliveryTime: winningBid.deliveryTime,
        reputation: winningBid.reputation,
        accepted: true,
      } as unknown as BidEntity,
    );

    return { success: true, paymentTxHash };
  }

  async selectExecutor(jobId: string, dto: SelectExecutorDto) {
    return this.jobOrchestration.selectExecutor(jobId, dto.candidateId);
  }

  async submitRating(jobId: string, dto: SubmitRatingDto) {
    return this.jobOrchestration.submitRating(jobId, dto);
  }
}

