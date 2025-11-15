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
exports.BidEntity = void 0;
const typeorm_1 = require("typeorm");
const job_entity_1 = require("./job.entity");
const agent_entity_1 = require("./agent.entity");
let BidEntity = class BidEntity {
    id;
    jobId;
    bidderWallet;
    price;
    deliveryTime;
    reputation;
    accepted;
    createdAt;
    job;
    agent;
};
exports.BidEntity = BidEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], BidEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'job_id' }),
    __metadata("design:type", String)
], BidEntity.prototype, "jobId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bidder_wallet' }),
    __metadata("design:type", String)
], BidEntity.prototype, "bidderWallet", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 30, scale: 6 }),
    __metadata("design:type", String)
], BidEntity.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivery_time', type: 'bigint' }),
    __metadata("design:type", String)
], BidEntity.prototype, "deliveryTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", String)
], BidEntity.prototype, "reputation", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], BidEntity.prototype, "accepted", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BidEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => job_entity_1.JobEntity, (job) => job.bids),
    __metadata("design:type", job_entity_1.JobEntity)
], BidEntity.prototype, "job", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_entity_1.AgentEntity, (agent) => agent.bids, {
        nullable: true,
    }),
    __metadata("design:type", Object)
], BidEntity.prototype, "agent", void 0);
exports.BidEntity = BidEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'bids' })
], BidEntity);
//# sourceMappingURL=bid.entity.js.map