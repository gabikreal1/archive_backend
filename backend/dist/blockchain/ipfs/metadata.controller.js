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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataController = void 0;
const common_1 = require("@nestjs/common");
const metadata_service_1 = require("./metadata.service");
let MetadataController = class MetadataController {
    metadataService;
    constructor(metadataService) {
        this.metadataService = metadataService;
    }
    decodeCid(cid) {
        try {
            return decodeURIComponent(cid);
        }
        catch {
            return cid;
        }
    }
    publishJob(body) {
        return this.metadataService.publishJobMetadata(body);
    }
    fetchJob(cid) {
        return this.metadataService.fetchJobMetadata(this.decodeCid(cid));
    }
    publishBid(body) {
        return this.metadataService.publishBidMetadata(body);
    }
    fetchBid(cid) {
        return this.metadataService.fetchBidMetadata(this.decodeCid(cid));
    }
    publishBidResponse(body) {
        return this.metadataService.publishBidResponse(body);
    }
    fetchBidResponse(cid) {
        return this.metadataService.fetchBidResponseMetadata(this.decodeCid(cid));
    }
    publishDelivery(body) {
        return this.metadataService.publishDeliveryProof(body);
    }
    fetchDelivery(cid) {
        return this.metadataService.fetchDeliveryProof(this.decodeCid(cid));
    }
    publishDisputeEvidence(body) {
        return this.metadataService.publishDisputeEvidence(body);
    }
    fetchDisputeEvidence(cid) {
        return this.metadataService.fetchDisputeEvidence(this.decodeCid(cid));
    }
    publishDisputeResolution(body) {
        return this.metadataService.publishDisputeResolution(body);
    }
    fetchDisputeResolution(cid) {
        return this.metadataService.fetchDisputeResolution(this.decodeCid(cid));
    }
    publishAgentProfile(body) {
        return this.metadataService.publishAgentProfile(body);
    }
    fetchAgentProfile(cid) {
        return this.metadataService.fetchAgentProfile(this.decodeCid(cid));
    }
};
exports.MetadataController = MetadataController;
__decorate([
    (0, common_1.Post)('jobs'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MetadataController.prototype, "publishJob", null);
__decorate([
    (0, common_1.Get)('jobs/:cid'),
    __param(0, (0, common_1.Param)('cid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MetadataController.prototype, "fetchJob", null);
__decorate([
    (0, common_1.Post)('bids'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MetadataController.prototype, "publishBid", null);
__decorate([
    (0, common_1.Get)('bids/:cid'),
    __param(0, (0, common_1.Param)('cid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MetadataController.prototype, "fetchBid", null);
__decorate([
    (0, common_1.Post)('bid-responses'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MetadataController.prototype, "publishBidResponse", null);
__decorate([
    (0, common_1.Get)('bid-responses/:cid'),
    __param(0, (0, common_1.Param)('cid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MetadataController.prototype, "fetchBidResponse", null);
__decorate([
    (0, common_1.Post)('deliveries'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MetadataController.prototype, "publishDelivery", null);
__decorate([
    (0, common_1.Get)('deliveries/:cid'),
    __param(0, (0, common_1.Param)('cid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MetadataController.prototype, "fetchDelivery", null);
__decorate([
    (0, common_1.Post)('disputes/evidence'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MetadataController.prototype, "publishDisputeEvidence", null);
__decorate([
    (0, common_1.Get)('disputes/evidence/:cid'),
    __param(0, (0, common_1.Param)('cid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MetadataController.prototype, "fetchDisputeEvidence", null);
__decorate([
    (0, common_1.Post)('disputes/resolution'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MetadataController.prototype, "publishDisputeResolution", null);
__decorate([
    (0, common_1.Get)('disputes/resolution/:cid'),
    __param(0, (0, common_1.Param)('cid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MetadataController.prototype, "fetchDisputeResolution", null);
__decorate([
    (0, common_1.Post)('agents/profile'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MetadataController.prototype, "publishAgentProfile", null);
__decorate([
    (0, common_1.Get)('agents/profile/:cid'),
    __param(0, (0, common_1.Param)('cid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MetadataController.prototype, "fetchAgentProfile", null);
exports.MetadataController = MetadataController = __decorate([
    (0, common_1.Controller)('ipfs/metadata'),
    __metadata("design:paramtypes", [metadata_service_1.IpfsMetadataService])
], MetadataController);
//# sourceMappingURL=metadata.controller.js.map