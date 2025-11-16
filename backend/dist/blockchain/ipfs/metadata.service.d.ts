import { IpfsService, IpfsUploadResult } from './ipfs.service';
import { AgentProfileMetadata, AgentProfileMetadataInput, BidMetadata, BidMetadataInput, BidResponseMetadata, BidResponseMetadataInput, DeliveryProofMetadata, DeliveryProofMetadataInput, DisputeEvidenceMetadata, DisputeEvidenceMetadataInput, DisputeResolutionMetadata, DisputeResolutionMetadataInput, JobMetadata, JobMetadataInput } from './metadata.types';
export declare class IpfsMetadataService {
    private readonly ipfs;
    constructor(ipfs: IpfsService);
    private now;
    private asString;
    private uploadParsed;
    publishJobMetadata(input: JobMetadataInput): Promise<IpfsUploadResult & {
        metadata: JobMetadata;
    }>;
    publishBidMetadata(input: BidMetadataInput): Promise<IpfsUploadResult & {
        metadata: BidMetadata;
    }>;
    publishBidResponse(input: BidResponseMetadataInput): Promise<IpfsUploadResult & {
        metadata: BidResponseMetadata;
    }>;
    publishDeliveryProof(input: DeliveryProofMetadataInput): Promise<IpfsUploadResult & {
        metadata: DeliveryProofMetadata;
    }>;
    publishDisputeEvidence(input: DisputeEvidenceMetadataInput): Promise<IpfsUploadResult & {
        metadata: DisputeEvidenceMetadata;
    }>;
    publishDisputeResolution(input: DisputeResolutionMetadataInput): Promise<IpfsUploadResult & {
        metadata: DisputeResolutionMetadata;
    }>;
    publishAgentProfile(input: AgentProfileMetadataInput): Promise<IpfsUploadResult & {
        metadata: AgentProfileMetadata;
    }>;
    fetchJobMetadata(uri: string): Promise<JobMetadata>;
    fetchBidMetadata(uri: string): Promise<BidMetadata>;
    fetchBidResponseMetadata(uri: string): Promise<BidResponseMetadata>;
    fetchDeliveryProof(uri: string): Promise<DeliveryProofMetadata>;
    fetchDisputeEvidence(uri: string): Promise<DisputeEvidenceMetadata>;
    fetchDisputeResolution(uri: string): Promise<DisputeResolutionMetadata>;
    fetchAgentProfile(uri: string): Promise<AgentProfileMetadata>;
}
