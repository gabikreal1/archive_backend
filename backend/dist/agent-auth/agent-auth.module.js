"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentAuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const agent_user_entity_1 = require("./agent-user.entity");
const agent_auth_service_1 = require("./agent-auth.service");
const agent_auth_controller_1 = require("./agent-auth.controller");
let AgentAuthModule = class AgentAuthModule {
};
exports.AgentAuthModule = AgentAuthModule;
exports.AgentAuthModule = AgentAuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([agent_user_entity_1.AgentUserEntity]),
            jwt_1.JwtModule.registerAsync({
                useFactory: () => ({
                    secret: process.env.AGENT_JWT_SECRET ?? 'agent-dev-secret-change-me',
                }),
            }),
        ],
        controllers: [agent_auth_controller_1.AgentAuthController],
        providers: [agent_auth_service_1.AgentAuthService],
        exports: [agent_auth_service_1.AgentAuthService],
    })
], AgentAuthModule);
//# sourceMappingURL=agent-auth.module.js.map