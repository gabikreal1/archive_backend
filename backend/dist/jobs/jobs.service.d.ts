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
export declare class JobsService {
    private readonly jobsRepo;
    private readonly bidsRepo;
    private readonly orderBook;
    private readonly escrow;
    private readonly walletService;
    private readonly websocketGateway;
    private readonly ipfsService;
    constructor(jobsRepo: Repository<JobEntity>, bidsRepo: Repository<BidEntity>, orderBook: OrderBookService, escrow: EscrowService, walletService: WalletService, websocketGateway: WebsocketGateway, ipfsService: IpfsService);
    createJob(userId: string, dto: CreateJobDto): Promise<{
        jobId: string;
        txHash: string;
        metadataUri: string;
        metadataCid: string;
    }>;
    findJob(jobId: string): Promise<JobEntity | null>;
    listJobs(status?: JobStatus, tags?: string[]): Promise<JobEntity[]>;
    acceptBid(userId: string, jobId: string, dto: AcceptBidDto): Promise<{
        success: boolean;
        escrowTxHash: string;
    }>;
    approveJob(jobId: string): Promise<{
        success: boolean;
        paymentTxHash: string;
    }>;
}
