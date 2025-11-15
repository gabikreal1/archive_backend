"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const blockchain_module_1 = require("./blockchain/blockchain.module");
const circle_module_1 = require("./circle/circle.module");
const agents_module_1 = require("./agents/agents.module");
const jobs_module_1 = require("./jobs/jobs.module");
const websocket_module_1 = require("./websocket/websocket.module");
const job_entity_1 = require("./entities/job.entity");
const bid_entity_1 = require("./entities/bid.entity");
const agent_entity_1 = require("./entities/agent.entity");
const delivery_entity_1 = require("./entities/delivery.entity");
const wallet_mapping_entity_1 = require("./entities/wallet-mapping.entity");
const wallet_controller_1 = require("./wallet/wallet.controller");
const auth_module_1 = require("./auth/auth.module");
const dev_module_1 = require("./dev/dev.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST ?? 'localhost',
                port: Number(process.env.DB_PORT ?? 5432),
                username: process.env.DB_USER ?? 'postgres',
                password: process.env.DB_PASSWORD ?? 'postgres',
                database: process.env.DB_NAME ?? 'a2a_marketplace',
                entities: [job_entity_1.JobEntity, bid_entity_1.BidEntity, agent_entity_1.AgentEntity, delivery_entity_1.DeliveryEntity, wallet_mapping_entity_1.WalletMappingEntity],
                synchronize: true,
            }),
            blockchain_module_1.BlockchainModule,
            circle_module_1.CircleModule,
            agents_module_1.AgentsModule,
            jobs_module_1.JobsModule,
            websocket_module_1.WebsocketModule,
            auth_module_1.AuthModule,
            dev_module_1.DevModule,
        ],
        controllers: [app_controller_1.AppController, wallet_controller_1.WalletController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map