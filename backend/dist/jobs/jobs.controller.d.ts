import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { AcceptBidDto } from './dto/accept-bid.dto';
import { SelectExecutorDto } from './dto/select-executor.dto';
import { SubmitRatingDto } from './dto/submit-rating.dto';
import { JobStatus } from '../entities/job.entity';
import type { Request } from 'express';
export declare class JobsController {
    private readonly jobsService;
    constructor(jobsService: JobsService);
    createJob(req: Request, dto: CreateJobDto): Promise<{
        jobId: string;
        txHash: string;
        metadataUri: string;
        metadataCid: string;
    }>;
    getJob(jobId: string): Promise<import("../entities/job.entity").JobEntity | null>;
    listJobs(status?: JobStatus, tagsRaw?: string): Promise<import("../entities/job.entity").JobEntity[]>;
    acceptBid(req: Request, jobId: string, dto: AcceptBidDto): Promise<{
        success: boolean;
        escrowTxHash: null;
        acceptBidTxHash: string;
        bidResponseMetadataUri: string | undefined;
        bidResponseMetadataCid: string | undefined;
    }>;
    selectExecutor(jobId: string, dto: SelectExecutorDto): Promise<{
        deliveryId: string;
        result: import("../agents/executor/executor-autopilot.service").JobExecutionOutput;
    }>;
    submitRating(jobId: string, dto: SubmitRatingDto): Promise<{
        success: boolean;
    }>;
    approveJob(jobId: string): Promise<{
        success: boolean;
        paymentTxHash: string;
    }>;
}
