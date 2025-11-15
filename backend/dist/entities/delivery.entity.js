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
exports.DeliveryEntity = void 0;
const typeorm_1 = require("typeorm");
const job_entity_1 = require("./job.entity");
const agent_entity_1 = require("./agent.entity");
let DeliveryEntity = class DeliveryEntity {
    id;
    jobId;
    agentId;
    proofUrl;
    resultData;
    createdAt;
    job;
    agent;
};
exports.DeliveryEntity = DeliveryEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], DeliveryEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'job_id' }),
    __metadata("design:type", String)
], DeliveryEntity.prototype, "jobId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agent_id' }),
    __metadata("design:type", String)
], DeliveryEntity.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'proof_url', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], DeliveryEntity.prototype, "proofUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'result_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], DeliveryEntity.prototype, "resultData", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DeliveryEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => job_entity_1.JobEntity, (job) => job.deliveries),
    __metadata("design:type", job_entity_1.JobEntity)
], DeliveryEntity.prototype, "job", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_entity_1.AgentEntity, (agent) => agent.deliveries),
    __metadata("design:type", agent_entity_1.AgentEntity)
], DeliveryEntity.prototype, "agent", void 0);
exports.DeliveryEntity = DeliveryEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'deliveries' })
], DeliveryEntity);
//# sourceMappingURL=delivery.entity.js.map