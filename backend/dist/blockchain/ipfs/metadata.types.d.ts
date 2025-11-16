import { z } from 'zod';
import { agentProfileSchema, bidMetadataSchema, bidResponseSchema, deliveryProofSchema, disputeEvidenceSchema, disputeResolutionSchema, jobMetadataSchema, verificationQuestionSchema } from './metadata.schemas';
export type JobMetadata = z.infer<typeof jobMetadataSchema>;
export type BidMetadata = z.infer<typeof bidMetadataSchema>;
export type BidResponseMetadata = z.infer<typeof bidResponseSchema>;
export type DeliveryProofMetadata = z.infer<typeof deliveryProofSchema>;
export type DisputeEvidenceMetadata = z.infer<typeof disputeEvidenceSchema>;
export type DisputeResolutionMetadata = z.infer<typeof disputeResolutionSchema>;
export type AgentProfileMetadata = z.infer<typeof agentProfileSchema>;
export type VerificationQuestion = z.infer<typeof verificationQuestionSchema>;
type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type WithoutSchemaVersion<T> = Omit<T, 'schemaVersion'>;
type BaseInput<T, K extends keyof WithoutSchemaVersion<T> = never> = OptionalFields<WithoutSchemaVersion<T>, K> & {
    pinName?: string;
};
export type JobMetadataInput = BaseInput<JobMetadata, 'createdAt' | 'requirements' | 'referenceLinks' | 'attachments' | 'tags'>;
export type BidMetadataInput = BaseInput<BidMetadata, 'createdAt' | 'questions' | 'previousWork' | 'attachments'> & {
    jobId: string | number | bigint;
    bidder: BidMetadata['bidder'] & {
        walletAddress: string | number | bigint;
    };
};
export type BidResponseMetadataInput = BaseInput<BidResponseMetadata, 'answeredAt'> & {
    jobId: string | number;
    bidId: string | number;
};
export type DeliveryProofMetadataInput = BaseInput<DeliveryProofMetadata, 'deliveredAt' | 'verificationProof' | 'executionLog'> & {
    jobId: string | number;
    bidId: string | number;
};
export type DisputeEvidenceMetadataInput = BaseInput<DisputeEvidenceMetadata, 'submittedAt' | 'claims' | 'attachments'> & {
    jobId: string | number;
    disputeId: string | number;
};
export type DisputeResolutionMetadataInput = BaseInput<DisputeResolutionMetadata, 'resolvedAt' | 'findings' | 'evidenceReviewed'> & {
    jobId: string | number;
    disputeId: string | number;
};
export type AgentProfileMetadataInput = BaseInput<AgentProfileMetadata, 'createdAt' | 'capabilities' | 'specializations' | 'portfolio' | 'languages'>;
export {};
