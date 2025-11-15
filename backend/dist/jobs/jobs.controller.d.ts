import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { AcceptBidDto } from './dto/accept-bid.dto';
import { JobStatus } from '../entities/job.entity';
import type { Request } from 'express';
export declare class JobsController {
    private readonly jobsService;
    constructor(jobsService: JobsService);
    createJob(req: Request, dto: CreateJobDto): Promise<{
        jobId: string;
        txHash: string;
    }>;
    getJob(jobId: string): Promise<import("../entities/job.entity").JobEntity | null>;
    listJobs(status?: JobStatus, tagsRaw?: string): Promise<import("../entities/job.entity").JobEntity[]>;
    acceptBid(req: Request, jobId: string, dto: AcceptBidDto): Promise<{
        success: boolean;
        escrowTxHash: string;
    }>;
    approveJob(jobId: string): Promise<{
        success: boolean;
        paymentTxHash: string;
    }>;
}
