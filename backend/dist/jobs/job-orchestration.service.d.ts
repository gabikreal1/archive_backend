import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { JobEntity } from '../entities/job.entity';
import { DeliveryEntity } from '../entities/delivery.entity';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { AutopilotBidCandidate, ExecutorAutopilotService, JobExecutionOutput } from '../agents/executor/executor-autopilot.service';
import { SubmitRatingDto } from './dto/submit-rating.dto';
import { OrderBookService } from '../blockchain/order-book/order-book.service';
interface AuctionRecommendations {
    premium?: AutopilotBidCandidate;
    economy?: AutopilotBidCandidate;
}
export declare class JobOrchestrationService implements OnModuleDestroy {
    private readonly configService;
    private readonly jobsRepo;
    private readonly deliveriesRepo;
    private readonly websocketGateway;
    private readonly executorAutopilot;
    private readonly orderBook;
    private readonly logger;
    private readonly auctions;
    private readonly bidWindowMs;
    constructor(configService: ConfigService, jobsRepo: Repository<JobEntity>, deliveriesRepo: Repository<DeliveryEntity>, websocketGateway: WebsocketGateway, executorAutopilot: ExecutorAutopilotService, orderBook: OrderBookService);
    onModuleDestroy(): void;
    launchAuction(jobOrId: JobEntity | string): Promise<void>;
    registerBid(jobId: string, bid: AutopilotBidCandidate): void;
    finalizeAuction(jobId: string): Promise<AuctionRecommendations>;
    selectExecutor(jobId: string, candidateId: string): Promise<{
        deliveryId: string;
        result: JobExecutionOutput;
    }>;
    triggerExecutionForAcceptedBid(jobId: string, onchainBidId: string): Promise<void>;
    submitRating(jobId: string, dto: SubmitRatingDto): Promise<{
        success: boolean;
    }>;
    private pickRecommendations;
}
export {};
