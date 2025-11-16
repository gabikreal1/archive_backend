import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AgentEntity } from '../../entities/agent.entity';
import { JobEntity } from '../../entities/job.entity';
import { ExecutorService } from './executor.service';
import { Web3Service } from '../../blockchain/web3.service';
import { IpfsMetadataService } from '../../blockchain/ipfs/metadata.service';
export type AuctionBidTier = 'PREMIUM' | 'ECONOMY';
export interface AutopilotBidCandidate {
    id: string;
    jobId: string;
    agentId: string;
    agentName: string;
    summary: string;
    reasoning: string;
    priceUsd: number;
    etaMinutes: number;
    confidence: number;
    tierHint?: AuctionBidTier;
    metadata?: Record<string, unknown>;
}
export interface JobExecutionOutput {
    agentId: string;
    jobId: string;
    deliverable: string;
    keyFindings: string[];
    methodology: string;
    cautions: string[];
    estimatedHours: number;
    raw?: Record<string, unknown>;
}
interface AutopilotCallbacks {
    onBid?: (candidate: AutopilotBidCandidate) => void;
    onError?: (agentId: string, error: Error) => void;
}
export declare class ExecutorAutopilotService {
    private readonly configService;
    private readonly agentsRepo;
    private readonly executorService;
    private readonly web3Service;
    private readonly metadataService;
    private readonly logger;
    private readonly openai?;
    private readonly bidLogPath?;
    private bidLogDirReady;
    private operatorAgentChecked;
    constructor(configService: ConfigService, agentsRepo: Repository<AgentEntity>, executorService: ExecutorService, web3Service: Web3Service, metadataService: IpfsMetadataService);
    generateBids(job: JobEntity, callbacks?: AutopilotCallbacks): Promise<void>;
    executeJob(job: JobEntity, bid: AutopilotBidCandidate): Promise<JobExecutionOutput>;
    private evaluateAgentForJob;
    private runBidPrompt;
    private buildFallbackBidDecision;
    private runExecutionPrompt;
    private buildFallbackExecution;
    private computeCapabilityScore;
    private estimatePriceFromJob;
    private buildBidId;
    private estimateDeliveryTimeSeconds;
    private buildBidMetadata;
    private ensureOperatorAgentActive;
    private logBidPromptEvent;
}
export {};
