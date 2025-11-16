import { ConfigService } from '@nestjs/config';
import { IpfsMetadataService } from '../ipfs/metadata.service';
import type { BidMetadataInput, BidResponseMetadataInput, DeliveryProofMetadataInput } from '../ipfs/metadata.types';
import { Web3Service } from '../web3.service';
export interface PostJobParams {
    description: string;
    metadataUri: string;
    tags: string[];
    deadline?: number;
}
export interface OnchainBid {
    id: string;
    jobId: string;
    bidder: string;
    price: string;
    deliveryTime: string;
    reputation: string;
    metadataURI: string;
    accepted: boolean;
    createdAt: string;
}
export interface OnchainJobState {
    jobId: string;
    poster: string;
    status: number;
    acceptedBidId: string;
    deliveryProof: string;
    hasDispute: boolean;
    bids: OnchainBid[];
}
export interface EnrichedOnchainBid extends OnchainBid {
    metadata?: import('../ipfs/metadata.types').BidMetadata;
}
export interface OnchainJobStateWithBidMetadata extends Omit<OnchainJobState, 'bids'> {
    bids: EnrichedOnchainBid[];
}
export interface OnchainDispute {
    disputeId: string;
    jobId: string;
    initiator: string;
    reason: string;
    evidence: string[];
    status: number;
    resolutionMessage: string;
    createdAt: string;
    resolvedAt: string;
}
export interface PlaceBidParams {
    jobId: string | number | bigint;
    price: string | number | bigint;
    deliveryTimeSeconds: string | number | bigint;
    metadataUri: string;
}
export interface PlaceBidWithMetadataParams {
    jobId: string | number | bigint;
    price: string | number | bigint;
    deliveryTimeSeconds: string | number | bigint;
    metadata: Omit<BidMetadataInput, 'jobId'>;
}
export interface AcceptBidParams {
    jobId: string | number | bigint;
    bidId: string | number | bigint;
    responseUri?: string;
    responseMetadata?: Omit<BidResponseMetadataInput, 'jobId' | 'bidId'>;
}
export interface SubmitDeliveryParams {
    jobId: string | number | bigint;
    proofHash?: string;
    deliveryMetadata?: Omit<DeliveryProofMetadataInput, 'jobId'>;
}
export interface RaiseDisputeParams {
    jobId: string | number | bigint;
    reasonUri: string;
    evidenceUri: string;
}
export interface SubmitEvidenceParams {
    disputeId: string | number | bigint;
    evidenceUri: string;
}
export interface ResolveDisputeParams {
    disputeId: string | number | bigint;
    resolution: number;
    messageUri: string;
}
export declare class OrderBookService {
    private readonly web3Service;
    private readonly metadataService;
    private readonly configService;
    private readonly logger;
    private readonly minWriteIntervalMs;
    private lastWriteAt;
    constructor(web3Service: Web3Service, metadataService: IpfsMetadataService, configService: ConfigService);
    private get orderBookContract();
    private get orderBookRead();
    private get orderBookWrite();
    postJob(params: PostJobParams): Promise<{
        jobId: string;
        txHash: string;
    }>;
    getJob(jobId: string): Promise<OnchainJobState>;
    getJobWithBidMetadata(jobId: string): Promise<OnchainJobStateWithBidMetadata>;
    placeBid(params: PlaceBidParams): Promise<{
        bidId: string;
        txHash: string;
        metadataUri: string;
    }>;
    placeBidWithMetadata(params: PlaceBidWithMetadataParams): Promise<{
        bidId: string;
        txHash: string;
    } & {
        metadataUri: string;
        metadataCid: string;
    }>;
    acceptBid(params: AcceptBidParams): Promise<{
        txHash: string;
        responseUri?: string;
        responseCid?: string;
    }>;
    submitDelivery(params: SubmitDeliveryParams): Promise<{
        txHash: string;
        proofHash: string;
        metadataUri?: string;
        metadataCid?: string;
    }>;
    approveDelivery(jobId: string | number | bigint): Promise<{
        txHash: string;
    }>;
    raiseDispute(params: RaiseDisputeParams): Promise<{
        disputeId: string;
        txHash: string;
    }>;
    submitEvidence(params: SubmitEvidenceParams): Promise<{
        txHash: string;
    }>;
    resolveDispute(params: ResolveDisputeParams): Promise<{
        txHash: string;
    }>;
    refundJob(jobId: string | number | bigint): Promise<{
        txHash: string;
    }>;
    getDispute(disputeId: string | number | bigint): Promise<OnchainDispute>;
    getJobDispute(jobId: string | number | bigint): Promise<OnchainDispute | null>;
    private toBigInt;
    private parsePrice;
    private formatDispute;
    private hashUri;
    private rateLimitWrite;
}
