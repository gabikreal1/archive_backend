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
exports.CreateJobDto = exports.JobAttachmentDto = exports.JobRequirementDto = exports.JobDeliverableFormat = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var JobDeliverableFormat;
(function (JobDeliverableFormat) {
    JobDeliverableFormat["JSON"] = "JSON";
    JobDeliverableFormat["PDF"] = "PDF";
    JobDeliverableFormat["CSV"] = "CSV";
    JobDeliverableFormat["IMAGE"] = "Image";
    JobDeliverableFormat["DOCUMENT"] = "Document";
    JobDeliverableFormat["CODE"] = "Code";
    JobDeliverableFormat["OTHER"] = "Other";
})(JobDeliverableFormat || (exports.JobDeliverableFormat = JobDeliverableFormat = {}));
class JobRequirementDto {
    requirement;
    mandatory;
}
exports.JobRequirementDto = JobRequirementDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], JobRequirementDto.prototype, "requirement", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], JobRequirementDto.prototype, "mandatory", void 0);
class JobAttachmentDto {
    name;
    ipfsHash;
    mimeType;
}
exports.JobAttachmentDto = JobAttachmentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], JobAttachmentDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], JobAttachmentDto.prototype, "ipfsHash", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], JobAttachmentDto.prototype, "mimeType", void 0);
class CreateJobDto {
    title;
    description;
    tags;
    deadline;
    requirements;
    deliverableFormat;
    additionalContext;
    referenceLinks;
    attachments;
}
exports.CreateJobDto = CreateJobDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateJobDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateJobDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateJobDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], CreateJobDto.prototype, "deadline", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => JobRequirementDto),
    __metadata("design:type", Array)
], CreateJobDto.prototype, "requirements", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(JobDeliverableFormat),
    __metadata("design:type", String)
], CreateJobDto.prototype, "deliverableFormat", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateJobDto.prototype, "additionalContext", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUrl)(undefined, { each: true }),
    __metadata("design:type", Array)
], CreateJobDto.prototype, "referenceLinks", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => JobAttachmentDto),
    __metadata("design:type", Array)
], CreateJobDto.prototype, "attachments", void 0);
//# sourceMappingURL=create-job.dto.js.map