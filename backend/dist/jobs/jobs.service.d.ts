import { Repository } from 'typeorm';
import { JobEntity, JobStatus } from '../entities/job.entity';
import { BidEntity } from '../entities/bid.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { AcceptBidDto } from './dto/accept-bid.dto';
import { SelectExecutorDto } from './dto/select-executor.dto';
import { SubmitRatingDto } from './dto/submit-rating.dto';
import { JobOrchestrationService } from './job-orchestration.service';
import { OrderBookService } from '../blockchain/order-book/order-book.service';
import { WalletService } from '../circle/wallet/wallet.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { IpfsMetadataService } from '../blockchain/ipfs/metadata.service';
import { EscrowService } from '../blockchain/escrow/escrow.service';
export declare class JobsService {
    private readonly jobsRepo;
    private readonly bidsRepo;
    private readonly orderBook;
    private readonly walletService;
    private readonly websocketGateway;
    private readonly metadataService;
    private readonly jobOrchestration;
    private readonly escrow;
    constructor(jobsRepo: Repository<JobEntity>, bidsRepo: Repository<BidEntity>, orderBook: OrderBookService, walletService: WalletService, websocketGateway: WebsocketGateway, metadataService: IpfsMetadataService, jobOrchestration: JobOrchestrationService, escrow: EscrowService);
    createJob(userId: string, dto: CreateJobDto, extra?: {
        conversationId?: string;
    }): Promise<{
        jobId: string;
        txHash: string;
        metadataUri: string;
        metadataCid: string;
    }>;
    findJob(jobId: string): Promise<JobEntity | null>;
    listJobs(status?: JobStatus, tags?: string[]): Promise<JobEntity[]>;
    acceptBid(userId: string, jobId: string, dto: AcceptBidDto): Promise<{
        success: boolean;
        escrowTxHash: null;
        acceptBidTxHash: string;
        bidResponseMetadataUri: string | undefined;
        bidResponseMetadataCid: string | undefined;
    }>;
    approveJob(jobId: string): Promise<{
        success: boolean;
        paymentTxHash: string;
    }>;
    selectExecutor(jobId: string, dto: SelectExecutorDto): Promise<{
        deliveryId: string;
        result: import("../agents/executor/executor-autopilot.service").JobExecutionOutput;
    }>;
    submitRating(jobId: string, dto: SubmitRatingDto): Promise<{
        success: boolean;
    }>;
}
