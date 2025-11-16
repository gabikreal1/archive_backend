import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JobEntity, JobStatus } from '../entities/job.entity';
import { DeliveryEntity } from '../entities/delivery.entity';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import {
  AutopilotBidCandidate,
  ExecutorAutopilotService,
  JobExecutionOutput,
} from '../agents/executor/executor-autopilot.service';
import { SubmitRatingDto } from './dto/submit-rating.dto';
import { OrderBookService } from '../blockchain/order-book/order-book.service';

interface AuctionRecommendations {
  premium?: AutopilotBidCandidate;
  economy?: AutopilotBidCandidate;
}

interface AuctionState {
  jobId: string;
  status: 'collecting' | 'finalized' | 'executing' | 'closed';
  bids: Map<string, AutopilotBidCandidate>;
  recommendations?: AuctionRecommendations;
  startedAt: number;
  deadline: number;
  timer?: NodeJS.Timeout | null;
  selection?: {
    candidateId: string;
    agentId: string;
    deliveryId?: string;
    selectedAt: number;
  };
  execution?: JobExecutionOutput;
}

@Injectable()
export class JobOrchestrationService implements OnModuleDestroy {
  private readonly logger = new Logger(JobOrchestrationService.name);
  private readonly auctions = new Map<string, AuctionState>();
  private readonly bidWindowMs: number;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(JobEntity)
    private readonly jobsRepo: Repository<JobEntity>,
    @InjectRepository(DeliveryEntity)
    private readonly deliveriesRepo: Repository<DeliveryEntity>,
    @Inject(forwardRef(() => WebsocketGateway))
    private readonly websocketGateway: WebsocketGateway,
    @Inject(forwardRef(() => ExecutorAutopilotService))
    private readonly executorAutopilot: ExecutorAutopilotService,
    private readonly orderBook: OrderBookService,
  ) {
    this.bidWindowMs = Number(
      this.configService.get<string>('JOB_BID_WINDOW_MS') ?? 10_000,
    );
  }

  onModuleDestroy() {
    for (const state of this.auctions.values()) {
      if (state.timer) {
        clearTimeout(state.timer);
      }
    }
    this.auctions.clear();
  }

  async launchAuction(jobOrId: JobEntity | string): Promise<void> {
    const job =
      typeof jobOrId === 'string'
        ? await this.jobsRepo.findOne({ where: { id: jobOrId } })
        : jobOrId;

    if (!job) {
      this.logger.warn(
        `Cannot launch auction: job ${
          typeof jobOrId === 'string' ? jobOrId : jobOrId.id
        } not found`,
      );
      return;
    }

    if (this.auctions.has(job.id)) {
      return;
    }

    const state: AuctionState = {
      jobId: job.id,
      status: 'collecting',
      bids: new Map(),
      startedAt: Date.now(),
      deadline: Date.now() + this.bidWindowMs,
      timer: null,
    };
    state.timer = setTimeout(() => {
      this.finalizeAuction(job.id).catch((error) => {
        this.logger.error(
          `Failed to finalize auction for job ${job.id}: ${error.message}`,
        );
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
          this.logger.warn(
            `Executor ${agentId} failed to bid on job ${job.id}: ${error.message}`,
          );
        },
      })
      .catch((error) => {
        this.logger.error(
          `Executor autopilot failed for job ${job.id}: ${error.message}`,
        );
      });
  }

  registerBid(jobId: string, bid: AutopilotBidCandidate) {
    const state = this.auctions.get(jobId);
    if (!state || state.status !== 'collecting') {
      return;
    }

    state.bids.set(bid.id, bid);
    this.websocketGateway.broadcastJobBid(jobId, bid);
  }

  async finalizeAuction(jobId: string): Promise<AuctionRecommendations> {
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

  async selectExecutor(jobId: string, candidateId: string) {
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

    job.status = JobStatus.IN_PROGRESS;
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

    // Fire on-chain DeliverySubmitted via OrderBook.submitDelivery so that
    // the usual blockchain listener / wallet-based flows keep working.
    const onchainBidId =
      ((candidate.metadata ?? {}) as Record<string, unknown>)
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
          notes:
            'Autonomously submitted by executor autopilot after job acceptance.',
        } as any,
      })
      .catch((error) => {
        this.logger.warn(
          `Failed to submit onchain delivery for job ${jobId}, bid ${onchainBidId}: ${
            (error as Error).message
          }`,
        );
    });

    return {
      deliveryId: delivery.id,
      result: execution,
    };
  }

  /**
   * Trigger offchain execution for an already accepted onchain bid.
   *
   * This is used when the user accepts a bid via REST (`POST /jobs/:jobId/accept`)
   * and we want executors to produce a deliverable even if the frontend never
   * calls `/jobs/:jobId/select-executor` directly.
   *
   * If we cannot map the onchain bid to an existing Autopilot candidate or
   * execution fails, we fall back to a stub delivery so that the client still
   * receives a structured result.
   */
  async triggerExecutionForAcceptedBid(
    jobId: string,
    onchainBidId: string,
  ): Promise<void> {
    const job = await this.jobsRepo.findOne({ where: { id: jobId } });
    if (!job) {
      this.logger.warn(
        `triggerExecutionForAcceptedBid: job ${jobId} not found`,
      );
      return;
    }

    const state = this.auctions.get(jobId);

    // Try to map onchain bidId to an existing Autopilot candidate.
    let candidateId: string | undefined;
    if (state) {
      const candidate = Array.from(state.bids.values()).find((bid) => {
        const meta = (bid.metadata ?? {}) as Record<string, unknown>;
        const metaOnchainBidId = meta.onchainBidId as string | undefined;
        return metaOnchainBidId === onchainBidId || bid.id === onchainBidId;
      });
      candidateId = candidate?.id;
    }

    if (candidateId) {
      try {
        await this.selectExecutor(jobId, candidateId);
        return;
      } catch (error) {
        this.logger.warn(
          `triggerExecutionForAcceptedBid: selectExecutor failed for job ${jobId}, candidate ${candidateId}: ${
            (error as Error).message
          }`,
        );
      }
    } else {
      this.logger.warn(
        `triggerExecutionForAcceptedBid: no Autopilot candidate matched onchain bid ${onchainBidId} for job ${jobId}; using stub delivery.`,
      );
    }

    // Fallback: create a stub delivery so the client still receives something.
    const stub: JobExecutionOutput = {
      agentId: 'stub_executor',
      jobId: job.id,
      deliverable: `Stub deliverable for job ${job.id}.\n\nDescription:\n${job.description}`,
      keyFindings: [
        'This is a fallback result because no executor delivery was available.',
        'Configure executor agents and OpenAI to enable real autonomous execution.',
      ],
      methodology:
        'Generated by backend stub flow after bid acceptance when no executor could be matched or execution failed.',
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

    // Also try to submit a stub proof on-chain so wallets / explorers can
    // still see a DeliverySubmitted event, even if the executor path failed.
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
          notes:
            'Stub delivery created because no executor candidate matched or execution failed.',
        } as any,
      })
      .catch((error) => {
        this.logger.warn(
          `Failed to submit stub onchain delivery for job ${jobId}, bid ${onchainBidId}: ${
            (error as Error).message
          }`,
        );
      });
  }

  async submitRating(jobId: string, dto: SubmitRatingDto) {
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
      job.status = JobStatus.COMPLETED;
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

  private pickRecommendations(
    bids: AutopilotBidCandidate[],
  ): AuctionRecommendations {
    if (bids.length === 0) {
      return {};
    }

    const premiumSorted = [...bids].sort((a, b) => {
      const tierBoost =
        (b.tierHint === 'PREMIUM' ? 0.1 : 0) -
        (a.tierHint === 'PREMIUM' ? 0.1 : 0);
      return (
        b.confidence - a.confidence ||
        tierBoost ||
        b.priceUsd - a.priceUsd ||
        a.etaMinutes - b.etaMinutes
      );
    });
    const premium = premiumSorted[0];

    const economySorted = [...bids].sort((a, b) => {
      const tierBoost =
        (a.tierHint === 'ECONOMY' ? 0.1 : 0) -
        (b.tierHint === 'ECONOMY' ? 0.1 : 0);
      return (
        a.priceUsd - b.priceUsd ||
        tierBoost ||
        a.etaMinutes - b.etaMinutes ||
        b.confidence - a.confidence
      );
    });
    let economy: AutopilotBidCandidate | undefined = economySorted[0];

    if (economy && premium && economy.agentId === premium.agentId) {
      economy = economySorted.find((bid) => bid.agentId !== premium.agentId);
    }

    return {
      premium: premium ?? undefined,
      economy: economy ?? undefined,
    };
  }
}

