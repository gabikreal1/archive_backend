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
exports.JobsController = void 0;
const common_1 = require("@nestjs/common");
const jobs_service_1 = require("./jobs.service");
const create_job_dto_1 = require("./dto/create-job.dto");
const accept_bid_dto_1 = require("./dto/accept-bid.dto");
const select_executor_dto_1 = require("./dto/select-executor.dto");
const submit_rating_dto_1 = require("./dto/submit-rating.dto");
const job_entity_1 = require("../entities/job.entity");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let JobsController = class JobsController {
    jobsService;
    constructor(jobsService) {
        this.jobsService = jobsService;
    }
    createJob(req, dto) {
        const userId = req.user.userId;
        return this.jobsService.createJob(userId, dto);
    }
    getJob(jobId) {
        return this.jobsService.findJob(jobId);
    }
    listJobs(status, tagsRaw) {
        const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()) : undefined;
        return this.jobsService.listJobs(status, tags);
    }
    acceptBid(req, jobId, dto) {
        const userId = req.user.userId;
        return this.jobsService.acceptBid(userId, jobId, dto);
    }
    selectExecutor(jobId, dto) {
        return this.jobsService.selectExecutor(jobId, dto);
    }
    submitRating(jobId, dto) {
        return this.jobsService.submitRating(jobId, dto);
    }
    approveJob(jobId) {
        return this.jobsService.approveJob(jobId);
    }
};
exports.JobsController = JobsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_job_dto_1.CreateJobDto]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "createJob", null);
__decorate([
    (0, common_1.Get)(':jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "getJob", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('tags')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "listJobs", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':jobId/accept'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, accept_bid_dto_1.AcceptBidDto]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "acceptBid", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':jobId/select-executor'),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, select_executor_dto_1.SelectExecutorDto]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "selectExecutor", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':jobId/rating'),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submit_rating_dto_1.SubmitRatingDto]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "submitRating", null);
__decorate([
    (0, common_1.Post)(':jobId/approve'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "approveJob", null);
exports.JobsController = JobsController = __decorate([
    (0, common_1.Controller)('jobs'),
    __metadata("design:paramtypes", [jobs_service_1.JobsService])
], JobsController);
//# sourceMappingURL=jobs.controller.js.map