"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const agents_service_1 = require("./agents/agents.service");
const executor_service_1 = require("./executor/executor.service");
const agents_controller_1 = require("./agents/agents.controller");
const agent_entity_1 = require("../entities/agent.entity");
const sergbot_task_entity_1 = require("../entities/sergbot-task.entity");
const auth_module_1 = require("../auth/auth.module");
let AgentsModule = class AgentsModule {
};
exports.AgentsModule = AgentsModule;
exports.AgentsModule = AgentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([agent_entity_1.AgentEntity, sergbot_task_entity_1.SergbotTaskEntity]),
            jwt_1.JwtModule.registerAsync({
                useFactory: () => ({
                    secret: process.env.AGENT_JWT_SECRET ?? 'agent-dev-secret-change-me',
                }),
            }),
            auth_module_1.AuthModule,
        ],
        controllers: [agents_controller_1.ExecutorAgentsController],
        providers: [agents_service_1.AgentsService, executor_service_1.ExecutorService],
        exports: [agents_service_1.AgentsService, executor_service_1.ExecutorService],
    })
], AgentsModule);
//# sourceMappingURL=agents.module.js.map