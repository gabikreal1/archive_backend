import { IpfsMetadataService } from './metadata.service';
import type { AgentProfileMetadataInput, BidMetadataInput, BidResponseMetadataInput, DeliveryProofMetadataInput, DisputeEvidenceMetadataInput, DisputeResolutionMetadataInput, JobMetadataInput } from './metadata.types';
export declare class MetadataController {
    private readonly metadataService;
    constructor(metadataService: IpfsMetadataService);
    private decodeCid;
    publishJob(body: JobMetadataInput): Promise<import("./ipfs.service").IpfsUploadResult & {
        metadata: import("./metadata.types").JobMetadata;
    }>;
    fetchJob(cid: string): Promise<{
        title: string;
        description: string;
        requirements: {
            requirement: string;
            mandatory: boolean;
        }[];
        deliverableFormat: "JSON" | "PDF" | "CSV" | "Image" | "Document" | "Code" | "Other";
        referenceLinks: string[];
        attachments: {
            name: string;
            ipfsHash: string;
            mimeType: string;
        }[];
        posterWallet: string;
        createdAt: string;
        tags: string[];
        deadline: string | null;
        schemaVersion: "1.0";
        additionalContext?: string | undefined;
        createdBy?: string | undefined;
    }>;
    publishBid(body: BidMetadataInput): Promise<import("./ipfs.service").IpfsUploadResult & {
        metadata: import("./metadata.types").BidMetadata;
    }>;
    fetchBid(cid: string): Promise<{
        attachments: {
            name: string;
            ipfsHash: string;
            mimeType: string;
        }[];
        createdAt: string;
        schemaVersion: "1.0";
        jobId: string;
        bidder: {
            name: string;
            walletAddress: string;
            specialization: string[];
        };
        price: {
            total: number;
            breakdown?: Record<string, number> | undefined;
        };
        deliveryTime: {
            estimatedSeconds: number;
            estimatedHumanReadable?: string | undefined;
        };
        methodology: string;
        questions: {
            type: "number" | "boolean" | "date" | "text" | "datetime" | "select" | "multiselect";
            id: string;
            question: string;
            required: boolean;
            options?: string[] | undefined;
            placeholder?: string | undefined;
            helpText?: string | undefined;
        }[];
        previousWork: {
            description?: string | undefined;
            jobId?: number | undefined;
            deliveryProof?: string | undefined;
        }[];
        termsAndConditions?: string | undefined;
    }>;
    publishBidResponse(body: BidResponseMetadataInput): Promise<import("./ipfs.service").IpfsUploadResult & {
        metadata: import("./metadata.types").BidResponseMetadata;
    }>;
    fetchBidResponse(cid: string): Promise<{
        schemaVersion: "1.0";
        jobId: string;
        bidId: string;
        answeredBy: string;
        answeredAt: string;
        answers: Record<string, {
            question: string;
            answer?: any;
        }>;
        additionalNotes?: string | undefined;
        contactPreference?: {
            value: string;
            method: "email" | "phone" | "wallet" | "offchain";
        } | undefined;
    }>;
    publishDelivery(body: DeliveryProofMetadataInput): Promise<import("./ipfs.service").IpfsUploadResult & {
        metadata: import("./metadata.types").DeliveryProofMetadata;
    }>;
    fetchDelivery(cid: string): Promise<{
        schemaVersion: "1.0";
        jobId: string;
        bidId: string;
        deliveredBy: string;
        deliveredAt: string;
        deliverable: {
            attachments: {
                name: string;
                ipfsHash: string;
                mimeType: string;
            }[];
            format: "JSON" | "PDF" | "CSV" | "Image" | "Document" | "Code" | "Other";
            data?: any;
        };
        verificationProof: {
            step: string;
            evidence: string;
            timestamp: string;
        }[];
        executionLog: {
            timestamp: string;
            action: string;
            result: string;
        }[];
        notes?: string | undefined;
    }>;
    publishDisputeEvidence(body: DisputeEvidenceMetadataInput): Promise<import("./ipfs.service").IpfsUploadResult & {
        metadata: import("./metadata.types").DisputeEvidenceMetadata;
    }>;
    fetchDisputeEvidence(cid: string): Promise<{
        title: string;
        description: string;
        attachments: {
            name: string;
            ipfsHash: string;
            mimeType: string;
        }[];
        schemaVersion: "1.0";
        jobId: string;
        disputeId: string;
        submittedBy: string;
        submittedByRole: "poster" | "agent";
        submittedAt: string;
        evidenceType: "initial_complaint" | "counter_evidence" | "supporting_document" | "screenshot" | "communication_log";
        claims: {
            claim: string;
            supportingEvidence?: string | undefined;
        }[];
        requestedResolution?: "full_refund" | "partial_refund" | "redelivery" | "payment_release" | undefined;
    }>;
    publishDisputeResolution(body: DisputeResolutionMetadataInput): Promise<import("./ipfs.service").IpfsUploadResult & {
        metadata: import("./metadata.types").DisputeResolutionMetadata;
    }>;
    fetchDisputeResolution(cid: string): Promise<{
        schemaVersion: "1.0";
        jobId: string;
        disputeId: string;
        resolvedBy: string;
        resolvedAt: string;
        decision: "RESOLVED_USER" | "RESOLVED_AGENT" | "DISMISSED";
        reasoning: string;
        evidenceReviewed: {
            submittedBy?: string | undefined;
            evidenceId?: string | undefined;
            summary?: string | undefined;
        }[];
        findings: {
            finding: string;
            favoredParty: "agent" | "user" | "neutral";
        }[];
        decisionLabel?: string | undefined;
        actionTaken?: {
            type: "full_refund" | "partial_refund" | "payment_release" | "no_action";
            amount?: number | undefined;
            reputationImpact?: {
                agent?: string | undefined;
                user?: string | undefined;
            } | undefined;
        } | undefined;
        recommendations?: string | undefined;
    }>;
    publishAgentProfile(body: AgentProfileMetadataInput): Promise<import("./ipfs.service").IpfsUploadResult & {
        metadata: import("./metadata.types").AgentProfileMetadata;
    }>;
    fetchAgentProfile(cid: string): Promise<{
        name: string;
        description: string;
        createdAt: string;
        schemaVersion: "1.0";
        capabilities: string[];
        specializations: {
            category: string;
            description?: string | undefined;
            experienceYears?: number | undefined;
        }[];
        portfolio: {
            title?: string | undefined;
            description?: string | undefined;
            jobId?: number | undefined;
            deliveryProof?: string | undefined;
            rating?: number | undefined;
        }[];
        languages: string[];
        avatar?: string | undefined;
        pricingGuidelines?: {
            factors: string[];
            typical?: string | undefined;
        } | undefined;
        availability?: {
            timezone?: string | undefined;
            typicalResponseTime?: string | undefined;
            workingHours?: string | undefined;
        } | undefined;
        contactPreferences?: {
            methods: string[];
            offchainContact?: boolean | undefined;
        } | undefined;
        policies?: {
            refundPolicy?: string | undefined;
            revisionPolicy?: string | undefined;
            communicationPolicy?: string | undefined;
        } | undefined;
    }>;
}
