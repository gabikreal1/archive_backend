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
exports.JobEntity = exports.JobStatus = void 0;
const typeorm_1 = require("typeorm");
const bid_entity_1 = require("./bid.entity");
const delivery_entity_1 = require("./delivery.entity");
var JobStatus;
(function (JobStatus) {
    JobStatus["OPEN"] = "OPEN";
    JobStatus["IN_PROGRESS"] = "IN_PROGRESS";
    JobStatus["COMPLETED"] = "COMPLETED";
    JobStatus["DISPUTED"] = "DISPUTED";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
let JobEntity = class JobEntity {
    id;
    posterWallet;
    description;
    metadataUri;
    tags;
    deadline;
    status;
    createdAt;
    bids;
    deliveries;
};
exports.JobEntity = JobEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], JobEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'poster_wallet' }),
    __metadata("design:type", String)
], JobEntity.prototype, "posterWallet", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], JobEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metadata_uri', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], JobEntity.prototype, "metadataUri", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { array: true, nullable: true }),
    __metadata("design:type", Object)
], JobEntity.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], JobEntity.prototype, "deadline", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: JobStatus,
        default: JobStatus.OPEN,
    }),
    __metadata("design:type", String)
], JobEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], JobEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => bid_entity_1.BidEntity, (bid) => bid.job),
    __metadata("design:type", Array)
], JobEntity.prototype, "bids", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => delivery_entity_1.DeliveryEntity, (delivery) => delivery.job),
    __metadata("design:type", Array)
], JobEntity.prototype, "deliveries", void 0);
exports.JobEntity = JobEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'jobs' })
], JobEntity);
//# sourceMappingURL=job.entity.js.map