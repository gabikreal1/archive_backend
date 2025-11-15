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
exports.AgentAuthController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const agent_auth_service_1 = require("./agent-auth.service");
class AgentRegisterDto {
    email;
    password;
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], AgentRegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], AgentRegisterDto.prototype, "password", void 0);
class AgentLoginDto {
    email;
    password;
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], AgentLoginDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], AgentLoginDto.prototype, "password", void 0);
let AgentAuthController = class AgentAuthController {
    agentAuthService;
    constructor(agentAuthService) {
        this.agentAuthService = agentAuthService;
    }
    async register(dto) {
        await this.agentAuthService.register(dto.email, dto.password);
        return { success: true };
    }
    async login(dto) {
        return this.agentAuthService.login(dto.email, dto.password);
    }
};
exports.AgentAuthController = AgentAuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AgentRegisterDto]),
    __metadata("design:returntype", Promise)
], AgentAuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AgentLoginDto]),
    __metadata("design:returntype", Promise)
], AgentAuthController.prototype, "login", null);
exports.AgentAuthController = AgentAuthController = __decorate([
    (0, common_1.Controller)('agent-auth'),
    __metadata("design:paramtypes", [agent_auth_service_1.AgentAuthService])
], AgentAuthController);
//# sourceMappingURL=agent-auth.controller.js.map