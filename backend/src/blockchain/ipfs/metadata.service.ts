import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { IpfsService, IpfsUploadResult } from './ipfs.service';
import {
  agentProfileSchema,
  bidMetadataSchema,
  bidResponseSchema,
  deliveryProofSchema,
  disputeEvidenceSchema,
  disputeResolutionSchema,
  jobMetadataSchema,
} from './metadata.schemas';
import {
  AgentProfileMetadata,
  AgentProfileMetadataInput,
  BidMetadata,
  BidMetadataInput,
  BidResponseMetadata,
  BidResponseMetadataInput,
  DeliveryProofMetadata,
  DeliveryProofMetadataInput,
  DisputeEvidenceMetadata,
  DisputeEvidenceMetadataInput,
  DisputeResolutionMetadata,
  DisputeResolutionMetadataInput,
  JobMetadata,
  JobMetadataInput,
} from './metadata.types';

@Injectable()
export class IpfsMetadataService {
  constructor(private readonly ipfs: IpfsService) {}

  private now(): string {
    return new Date().toISOString();
  }

  private asString(value: string | number | bigint): string {
    return typeof value === 'string' ? value : value.toString();
  }

  private async uploadParsed<T extends z.ZodTypeAny>(
    schema: T,
    payload: unknown,
    pinName?: string,
  ): Promise<IpfsUploadResult & { metadata: z.infer<T> }> {
    const metadata = schema.parse(payload);
    const upload = await this.ipfs.uploadJson(metadata, pinName);
    return { ...upload, metadata };
  }

  async publishJobMetadata(
    input: JobMetadataInput,
  ): Promise<IpfsUploadResult & { metadata: JobMetadata }> {
    return this.uploadParsed(
      jobMetadataSchema,
      {
        schemaVersion: '1.0' as const,
        ...input,
        createdAt: input.createdAt ?? this.now(),
        tags: input.tags ?? [],
        requirements: input.requirements ?? [],
        referenceLinks: input.referenceLinks ?? [],
        attachments: input.attachments ?? [],
      },
      input.pinName,
    );
  }

  async publishBidMetadata(
    input: BidMetadataInput,
  ): Promise<IpfsUploadResult & { metadata: BidMetadata }> {
    return this.uploadParsed(
      bidMetadataSchema,
      {
        schemaVersion: '1.0' as const,
        ...input,
        jobId: this.asString(input.jobId),
        createdAt: input.createdAt ?? this.now(),
        questions: input.questions ?? [],
        attachments: input.attachments ?? [],
        previousWork: input.previousWork ?? [],
        bidder: {
          ...input.bidder,
          walletAddress: this.asString(input.bidder.walletAddress),
          specialization: input.bidder.specialization ?? [],
        },
      },
      input.pinName,
    );
  }

  async publishBidResponse(
    input: BidResponseMetadataInput,
  ): Promise<IpfsUploadResult & { metadata: BidResponseMetadata }> {
    return this.uploadParsed(
      bidResponseSchema,
      {
        schemaVersion: '1.0' as const,
        ...input,
        jobId: this.asString(input.jobId),
        bidId: this.asString(input.bidId),
        answeredAt: input.answeredAt ?? this.now(),
      },
      input.pinName,
    );
  }

  async publishDeliveryProof(
    input: DeliveryProofMetadataInput,
  ): Promise<IpfsUploadResult & { metadata: DeliveryProofMetadata }> {
    return this.uploadParsed(
      deliveryProofSchema,
      {
        schemaVersion: '1.0' as const,
        ...input,
        jobId: this.asString(input.jobId),
        bidId: this.asString(input.bidId),
        deliveredAt: input.deliveredAt ?? this.now(),
        verificationProof: input.verificationProof ?? [],
        executionLog: input.executionLog ?? [],
        deliverable: {
          ...input.deliverable,
          attachments: input.deliverable.attachments ?? [],
        },
      },
      input.pinName,
    );
  }

  async publishDisputeEvidence(
    input: DisputeEvidenceMetadataInput,
  ): Promise<IpfsUploadResult & { metadata: DisputeEvidenceMetadata }> {
    return this.uploadParsed(
      disputeEvidenceSchema,
      {
        schemaVersion: '1.0' as const,
        ...input,
        disputeId: this.asString(input.disputeId),
        jobId: this.asString(input.jobId),
        submittedAt: input.submittedAt ?? this.now(),
        claims: input.claims ?? [],
        attachments: input.attachments ?? [],
      },
      input.pinName,
    );
  }

  async publishDisputeResolution(
    input: DisputeResolutionMetadataInput,
  ): Promise<IpfsUploadResult & { metadata: DisputeResolutionMetadata }> {
    return this.uploadParsed(
      disputeResolutionSchema,
      {
        schemaVersion: '1.0' as const,
        ...input,
        disputeId: this.asString(input.disputeId),
        jobId: this.asString(input.jobId),
        resolvedAt: input.resolvedAt ?? this.now(),
        findings: input.findings ?? [],
        evidenceReviewed: input.evidenceReviewed ?? [],
      },
      input.pinName,
    );
  }

  async publishAgentProfile(
    input: AgentProfileMetadataInput,
  ): Promise<IpfsUploadResult & { metadata: AgentProfileMetadata }> {
    return this.uploadParsed(
      agentProfileSchema,
      {
        schemaVersion: '1.0' as const,
        ...input,
        createdAt: input.createdAt ?? this.now(),
        capabilities: input.capabilities ?? [],
        specializations: input.specializations ?? [],
        portfolio: input.portfolio ?? [],
        languages: input.languages ?? [],
      },
      input.pinName,
    );
  }

  fetchJobMetadata(uri: string): Promise<JobMetadata> {
    return this.ipfs.fetchJson<JobMetadata>(uri);
  }

  fetchBidMetadata(uri: string): Promise<BidMetadata> {
    return this.ipfs.fetchJson<BidMetadata>(uri);
  }

  fetchBidResponseMetadata(uri: string): Promise<BidResponseMetadata> {
    return this.ipfs.fetchJson<BidResponseMetadata>(uri);
  }

  fetchDeliveryProof(uri: string): Promise<DeliveryProofMetadata> {
    return this.ipfs.fetchJson<DeliveryProofMetadata>(uri);
  }

  fetchDisputeEvidence(uri: string): Promise<DisputeEvidenceMetadata> {
    return this.ipfs.fetchJson<DisputeEvidenceMetadata>(uri);
  }

  fetchDisputeResolution(uri: string): Promise<DisputeResolutionMetadata> {
    return this.ipfs.fetchJson<DisputeResolutionMetadata>(uri);
  }

  fetchAgentProfile(uri: string): Promise<AgentProfileMetadata> {
    return this.ipfs.fetchJson<AgentProfileMetadata>(uri);
  }
}
