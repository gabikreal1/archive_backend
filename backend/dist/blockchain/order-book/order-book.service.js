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
var OrderBookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderBookService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ethers_1 = require("ethers");
const metadata_service_1 = require("../ipfs/metadata.service");
const web3_service_1 = require("../web3.service");
let OrderBookService = OrderBookService_1 = class OrderBookService {
    web3Service;
    metadataService;
    configService;
    logger = new common_1.Logger(OrderBookService_1.name);
    minWriteIntervalMs;
    lastWriteAt = 0;
    constructor(web3Service, metadataService, configService) {
        this.web3Service = web3Service;
        this.metadataService = metadataService;
        this.configService = configService;
        this.minWriteIntervalMs = Number(this.configService.get('WEB3_WRITE_INTERVAL_MS') ?? 15000);
    }
    get orderBookContract() {
        return this.web3Service.orderBook;
    }
    get orderBookRead() {
        return this.orderBookContract.read;
    }
    get orderBookWrite() {
        return this.orderBookContract.write;
    }
    async postJob(params) {
        await this.rateLimitWrite();
        const contract = this.orderBookContract;
        const writer = this.orderBookWrite;
        const deadline = BigInt(params.deadline ?? 0);
        const tags = params.tags ?? [];
        const tx = await writer.postJob(params.description, params.metadataUri, tags, deadline);
        const receipt = await tx.wait();
        const parsed = this.web3Service.parseEvent(contract, receipt, 'JobPosted');
        const jobPostedArgs = parsed?.args;
        const jobId = jobPostedArgs?.jobId?.toString();
        if (!jobId) {
            throw new Error('Unable to determine jobId from JobPosted event.');
        }
        return { jobId, txHash: tx.hash };
    }
    async getJob(jobId) {
        const id = this.toBigInt(jobId);
        const [jobState, bids] = await this.orderBookRead.getJob(id);
        return {
            jobId: jobId.toString(),
            poster: jobState.poster,
            status: Number(jobState.status),
            acceptedBidId: jobState.acceptedBidId?.toString() ?? '0',
            deliveryProof: jobState.deliveryProof,
            hasDispute: jobState.hasDispute,
            bids: bids.map((bid) => ({
                id: bid.id.toString(),
                jobId: bid.jobId.toString(),
                bidder: bid.bidder,
                price: bid.price.toString(),
                deliveryTime: bid.deliveryTime.toString(),
                reputation: bid.reputation.toString(),
                metadataURI: bid.metadataURI,
                accepted: bid.accepted,
                createdAt: bid.createdAt.toString(),
            })),
        };
    }
    async getJobWithBidMetadata(jobId) {
        const baseJob = await this.getJob(jobId);
        const enrichedBids = await Promise.all(baseJob.bids.map(async (bid) => {
            if (!bid.metadataURI) {
                return { ...bid };
            }
            try {
                const metadata = await this.metadataService.fetchBidMetadata(bid.metadataURI);
                return { ...bid, metadata };
            }
            catch (error) {
                this.logger.warn(`Failed to fetch bid metadata from ${bid.metadataURI} for bid ${bid.id}: ${error.message}`);
                return { ...bid };
            }
        }));
        return {
            ...baseJob,
            bids: enrichedBids,
        };
    }
    async placeBid(params) {
        await this.rateLimitWrite();
        const contract = this.orderBookContract;
        const tx = await this.orderBookWrite.placeBid(this.toBigInt(params.jobId), this.parsePrice(params.price), this.toBigInt(params.deliveryTimeSeconds), params.metadataUri);
        const receipt = await tx.wait();
        const parsed = this.web3Service.parseEvent(contract, receipt, 'BidPlaced');
        const bidPlacedArgs = parsed?.args;
        const bidId = bidPlacedArgs?.bidId?.toString();
        if (!bidId) {
            throw new Error('Unable to determine bidId from BidPlaced event.');
        }
        return { bidId, txHash: tx.hash, metadataUri: params.metadataUri };
    }
    async placeBidWithMetadata(params) {
        const metadataUpload = await this.metadataService.publishBidMetadata({
            ...params.metadata,
            jobId: this.toBigInt(params.jobId).toString(),
            pinName: params.metadata.pinName ?? `bid-${Date.now()}`,
        });
        const { bidId, txHash } = await this.placeBid({
            jobId: params.jobId,
            price: params.price,
            deliveryTimeSeconds: params.deliveryTimeSeconds,
            metadataUri: metadataUpload.uri,
        });
        return {
            bidId,
            txHash,
            metadataUri: metadataUpload.uri,
            metadataCid: metadataUpload.cid,
        };
    }
    async acceptBid(params) {
        const jobId = this.toBigInt(params.jobId);
        const bidId = this.toBigInt(params.bidId);
        let responseUpload = null;
        if (params.responseMetadata) {
            responseUpload = await this.metadataService.publishBidResponse({
                ...params.responseMetadata,
                jobId: jobId.toString(),
                bidId: bidId.toString(),
                pinName: params.responseMetadata.pinName ??
                    `bid-response-${jobId.toString()}-${bidId.toString()}-${Date.now()}`,
            });
        }
        const finalResponseUri = params.responseUri ?? responseUpload?.uri ?? '';
        const tx = await this.orderBookWrite.acceptBid(jobId, bidId, finalResponseUri);
        await tx.wait();
        return {
            txHash: tx.hash,
            ...(finalResponseUri && { responseUri: finalResponseUri }),
            ...(responseUpload && { responseCid: responseUpload.cid }),
        };
    }
    async submitDelivery(params) {
        const contract = this.orderBookContract;
        const jobId = this.toBigInt(params.jobId);
        let metadataUpload = null;
        if (params.deliveryMetadata) {
            metadataUpload = await this.metadataService.publishDeliveryProof({
                ...params.deliveryMetadata,
                jobId: jobId.toString(),
                pinName: params.deliveryMetadata.pinName ??
                    `delivery-${jobId.toString()}-${Date.now()}`,
            });
        }
        let proofHash = params.proofHash;
        if (!proofHash && metadataUpload) {
            proofHash = this.hashUri(metadataUpload.uri);
        }
        if (!proofHash) {
            throw new Error('submitDelivery requires either a proofHash or deliveryMetadata.');
        }
        const tx = await this.orderBookWrite.submitDelivery(jobId, proofHash);
        const receipt = await tx.wait();
        const parsed = this.web3Service.parseEvent(contract, receipt, 'DeliverySubmitted');
        const deliveryArgs = parsed?.args;
        const finalProofHash = deliveryArgs?.proofHash ?? proofHash;
        return {
            txHash: tx.hash,
            proofHash: finalProofHash,
            ...(metadataUpload && {
                metadataUri: metadataUpload.uri,
                metadataCid: metadataUpload.cid,
            }),
        };
    }
    async approveDelivery(jobId) {
        await this.rateLimitWrite();
        const tx = await this.orderBookWrite.approveDelivery(this.toBigInt(jobId));
        await tx.wait();
        return { txHash: tx.hash };
    }
    async raiseDispute(params) {
        const contract = this.orderBookContract;
        await this.rateLimitWrite();
        const tx = await this.orderBookWrite.raiseDispute(this.toBigInt(params.jobId), params.reasonUri, params.evidenceUri);
        const receipt = await tx.wait();
        const parsed = this.web3Service.parseEvent(contract, receipt, 'DisputeRaised');
        const disputeArgs = parsed?.args;
        const disputeId = disputeArgs?.disputeId?.toString();
        if (!disputeId) {
            throw new Error('Unable to parse DisputeRaised event.');
        }
        return { disputeId, txHash: tx.hash };
    }
    async submitEvidence(params) {
        await this.rateLimitWrite();
        const tx = await this.orderBookWrite.submitEvidence(this.toBigInt(params.disputeId), params.evidenceUri);
        await tx.wait();
        return { txHash: tx.hash };
    }
    async resolveDispute(params) {
        await this.rateLimitWrite();
        const tx = await this.orderBookWrite.resolveDispute(this.toBigInt(params.disputeId), params.resolution, params.messageUri);
        await tx.wait();
        return { txHash: tx.hash };
    }
    async refundJob(jobId) {
        await this.rateLimitWrite();
        const tx = await this.orderBookWrite.refundJob(this.toBigInt(jobId));
        await tx.wait();
        return { txHash: tx.hash };
    }
    async getDispute(disputeId) {
        const dispute = await this.orderBookRead.getDispute(this.toBigInt(disputeId));
        return this.formatDispute(dispute);
    }
    async getJobDispute(jobId) {
        const dispute = await this.orderBookRead.getJobDispute(this.toBigInt(jobId));
        const formatted = this.formatDispute(dispute);
        if (formatted.disputeId === '0') {
            return null;
        }
        return formatted;
    }
    toBigInt(value) {
        if (typeof value === 'bigint') {
            return value;
        }
        if (typeof value === 'number') {
            return BigInt(value);
        }
        if (/^0x/i.test(value)) {
            return BigInt(value);
        }
        if (!/^\d+$/.test(value)) {
            throw new Error(`Value ${value} is not a valid uint256.`);
        }
        return BigInt(value);
    }
    parsePrice(value) {
        if (typeof value === 'bigint') {
            return value;
        }
        if (typeof value === 'number') {
            return ethers_1.ethers.parseUnits(value.toString(), 6);
        }
        if (/^0x/i.test(value)) {
            return BigInt(value);
        }
        if (value.includes('.')) {
            return ethers_1.ethers.parseUnits(value, 6);
        }
        return ethers_1.ethers.parseUnits(value, 6);
    }
    formatDispute(dispute) {
        return {
            disputeId: dispute.disputeId?.toString?.() ?? '0',
            jobId: dispute.jobId?.toString?.() ?? '0',
            initiator: dispute.initiator ?? ethers_1.ethers.ZeroAddress,
            reason: dispute.reason ?? '',
            evidence: Array.isArray(dispute.evidence) ? dispute.evidence : [],
            status: typeof dispute.status === 'number'
                ? dispute.status
                : Number(dispute.status ?? 0),
            resolutionMessage: dispute.resolutionMessage ?? '',
            createdAt: dispute.createdAt?.toString?.() ?? '0',
            resolvedAt: dispute.resolvedAt?.toString?.() ?? '0',
        };
    }
    hashUri(uri) {
        return ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(uri));
    }
    async rateLimitWrite() {
        if (this.minWriteIntervalMs <= 0 || this.web3Service.isStubProvider) {
            return;
        }
        const now = Date.now();
        const earliest = this.lastWriteAt + this.minWriteIntervalMs;
        if (earliest > now) {
            await new Promise((resolve) => setTimeout(resolve, earliest - now));
        }
        this.lastWriteAt = Date.now();
    }
};
exports.OrderBookService = OrderBookService;
exports.OrderBookService = OrderBookService = OrderBookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [web3_service_1.Web3Service,
        metadata_service_1.IpfsMetadataService,
        config_1.ConfigService])
], OrderBookService);
//# sourceMappingURL=order-book.service.js.map