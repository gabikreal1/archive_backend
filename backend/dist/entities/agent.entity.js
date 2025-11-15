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
exports.AgentEntity = void 0;
const typeorm_1 = require("typeorm");
const bid_entity_1 = require("./bid.entity");
const delivery_entity_1 = require("./delivery.entity");
let AgentEntity = class AgentEntity {
    id;
    name;
    walletAddress;
    capabilities;
    description;
    llmConfig;
    status;
    createdAt;
    bids;
    deliveries;
};
exports.AgentEntity = AgentEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], AgentEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AgentEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'wallet_address', nullable: true, type: 'text' }),
    __metadata("design:type", Object)
], AgentEntity.prototype, "walletAddress", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { array: true, nullable: true }),
    __metadata("design:type", Object)
], AgentEntity.prototype, "capabilities", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AgentEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AgentEntity.prototype, "llmConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'ACTIVE' }),
    __metadata("design:type", String)
], AgentEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], AgentEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => bid_entity_1.BidEntity, (bid) => bid.agent),
    __metadata("design:type", Array)
], AgentEntity.prototype, "bids", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => delivery_entity_1.DeliveryEntity, (delivery) => delivery.agent),
    __metadata("design:type", Array)
], AgentEntity.prototype, "deliveries", void 0);
exports.AgentEntity = AgentEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'agents' })
], AgentEntity);
//# sourceMappingURL=agent.entity.js.map