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
exports.ExecutorAgentsController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const agent_entity_1 = require("../../entities/agent.entity");
const jwt_1 = require("@nestjs/jwt");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
class CreateExecutorAgentDto {
    name;
    description;
    capabilities;
    model;
    systemPrompt;
    inputGuidelines;
    refusalPolicy;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CreateExecutorAgentDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExecutorAgentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateExecutorAgentDto.prototype, "capabilities", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CreateExecutorAgentDto.prototype, "model", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    __metadata("design:type", String)
], CreateExecutorAgentDto.prototype, "systemPrompt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExecutorAgentDto.prototype, "inputGuidelines", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExecutorAgentDto.prototype, "refusalPolicy", void 0);
let ExecutorAgentsController = class ExecutorAgentsController {
    agentsRepo;
    jwtService;
    constructor(agentsRepo, jwtService) {
        this.agentsRepo = agentsRepo;
        this.jwtService = jwtService;
    }
    async createExecutorAgent(dto) {
        const id = `agent_${Date.now()}`;
        const agent = this.agentsRepo.create({
            id,
            name: dto.name,
            walletAddress: null,
            capabilities: dto.capabilities ?? null,
            description: dto.description ?? null,
            status: 'ACTIVE',
            llmConfig: {
                model: dto.model,
                systemPrompt: dto.systemPrompt,
                inputGuidelines: dto.inputGuidelines,
                refusalPolicy: dto.refusalPolicy,
            },
        });
        await this.agentsRepo.save(agent);
        return {
            id: agent.id,
            name: agent.name,
            capabilities: agent.capabilities,
            description: agent.description,
            llmConfig: agent.llmConfig,
            status: agent.status,
        };
    }
};
exports.ExecutorAgentsController = ExecutorAgentsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateExecutorAgentDto]),
    __metadata("design:returntype", Promise)
], ExecutorAgentsController.prototype, "createExecutorAgent", null);
exports.ExecutorAgentsController = ExecutorAgentsController = __decorate([
    (0, common_1.Controller)('executor-agents'),
    __param(0, (0, typeorm_1.InjectRepository)(agent_entity_1.AgentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], ExecutorAgentsController);
//# sourceMappingURL=agents.controller.js.map