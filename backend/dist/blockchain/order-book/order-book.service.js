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
const web3_service_1 = require("../web3.service");
let OrderBookService = OrderBookService_1 = class OrderBookService {
    web3Service;
    logger = new common_1.Logger(OrderBookService_1.name);
    constructor(web3Service) {
        this.web3Service = web3Service;
    }
    async postJob(params) {
        const contract = this.web3Service.orderBook;
        const deadline = BigInt(params.deadline ?? 0);
        const tags = params.tags ?? [];
        const tx = await contract.write.postJob(params.description, params.metadataUri, tags, deadline);
        const receipt = await tx.wait();
        const parsed = this.web3Service.parseEvent(contract, receipt, 'JobPosted');
        const jobId = parsed?.args?.jobId?.toString();
        if (!jobId) {
            throw new Error('Unable to determine jobId from JobPosted event.');
        }
        return { jobId, txHash: tx.hash };
    }
    async getJob(jobId) {
        const contract = this.web3Service.orderBook;
        const id = this.toBigInt(jobId);
        const [jobState, bids] = await contract.read.getJob(id);
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
};
exports.OrderBookService = OrderBookService;
exports.OrderBookService = OrderBookService = OrderBookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [web3_service_1.Web3Service])
], OrderBookService);
//# sourceMappingURL=order-book.service.js.map