"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpfsMetadataService = void 0;
const common_1 = require("@nestjs/common");
const ipfs_service_1 = require("./ipfs.service");
const metadata_schemas_1 = require("./metadata.schemas");
let IpfsMetadataService = class IpfsMetadataService {
    ipfs;
    constructor(ipfs) {
        this.ipfs = ipfs;
    }
    now() {
        return new Date().toISOString();
    }
    asString(value) {
        return typeof value === 'string' ? value : value.toString();
    }
    async uploadParsed(schema, payload, pinName) {
        const metadata = schema.parse(payload);
        const upload = await this.ipfs.uploadJson(metadata, pinName);
        return { ...upload, metadata };
    }
    async publishJobMetadata(input) {
        return this.uploadParsed(metadata_schemas_1.jobMetadataSchema, {
            schemaVersion: '1.0',
            ...input,
            createdAt: input.createdAt ?? this.now(),
            tags: input.tags ?? [],
            requirements: input.requirements ?? [],
            referenceLinks: input.referenceLinks ?? [],
            attachments: input.attachments ?? [],
        }, input.pinName);
    }
    async publishBidMetadata(input) {
        return this.uploadParsed(metadata_schemas_1.bidMetadataSchema, {
            schemaVersion: '1.0',
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
        }, input.pinName);
    }
    async publishBidResponse(input) {
        return this.uploadParsed(metadata_schemas_1.bidResponseSchema, {
            schemaVersion: '1.0',
            ...input,
            jobId: this.asString(input.jobId),
            bidId: this.asString(input.bidId),
            answeredAt: input.answeredAt ?? this.now(),
        }, input.pinName);
    }
    async publishDeliveryProof(input) {
        return this.uploadParsed(metadata_schemas_1.deliveryProofSchema, {
            schemaVersion: '1.0',
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
        }, input.pinName);
    }
    async publishDisputeEvidence(input) {
        return this.uploadParsed(metadata_schemas_1.disputeEvidenceSchema, {
            schemaVersion: '1.0',
            ...input,
            disputeId: this.asString(input.disputeId),
            jobId: this.asString(input.jobId),
            submittedAt: input.submittedAt ?? this.now(),
            claims: input.claims ?? [],
            attachments: input.attachments ?? [],
        }, input.pinName);
    }
    async publishDisputeResolution(input) {
        return this.uploadParsed(metadata_schemas_1.disputeResolutionSchema, {
            schemaVersion: '1.0',
            ...input,
            disputeId: this.asString(input.disputeId),
            jobId: this.asString(input.jobId),
            resolvedAt: input.resolvedAt ?? this.now(),
            findings: input.findings ?? [],
            evidenceReviewed: input.evidenceReviewed ?? [],
        }, input.pinName);
    }
    async publishAgentProfile(input) {
        return this.uploadParsed(metadata_schemas_1.agentProfileSchema, {
            schemaVersion: '1.0',
            ...input,
            createdAt: input.createdAt ?? this.now(),
            capabilities: input.capabilities ?? [],
            specializations: input.specializations ?? [],
            portfolio: input.portfolio ?? [],
            languages: input.languages ?? [],
        }, input.pinName);
    }
    fetchJobMetadata(uri) {
        return this.ipfs.fetchJson(uri);
    }
    fetchBidMetadata(uri) {
        return this.ipfs.fetchJson(uri);
    }
    fetchBidResponseMetadata(uri) {
        return this.ipfs.fetchJson(uri);
    }
    fetchDeliveryProof(uri) {
        return this.ipfs.fetchJson(uri);
    }
    fetchDisputeEvidence(uri) {
        return this.ipfs.fetchJson(uri);
    }
    fetchDisputeResolution(uri) {
        return this.ipfs.fetchJson(uri);
    }
    fetchAgentProfile(uri) {
        return this.ipfs.fetchJson(uri);
    }
};
exports.IpfsMetadataService = IpfsMetadataService;
exports.IpfsMetadataService = IpfsMetadataService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ipfs_service_1.IpfsService])
], IpfsMetadataService);
//# sourceMappingURL=metadata.service.js.map