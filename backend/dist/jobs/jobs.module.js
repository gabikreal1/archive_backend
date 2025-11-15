"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jobs_service_1 = require("./jobs.service");
const jobs_controller_1 = require("./jobs.controller");
const job_entity_1 = require("../entities/job.entity");
const bid_entity_1 = require("../entities/bid.entity");
const blockchain_module_1 = require("../blockchain/blockchain.module");
const circle_module_1 = require("../circle/circle.module");
const websocket_module_1 = require("../websocket/websocket.module");
const auth_module_1 = require("../auth/auth.module");
let JobsModule = class JobsModule {
};
exports.JobsModule = JobsModule;
exports.JobsModule = JobsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([job_entity_1.JobEntity, bid_entity_1.BidEntity]),
            blockchain_module_1.BlockchainModule,
            circle_module_1.CircleModule,
            websocket_module_1.WebsocketModule,
            auth_module_1.AuthModule,
        ],
        providers: [jobs_service_1.JobsService],
        controllers: [jobs_controller_1.JobsController],
    })
], JobsModule);
//# sourceMappingURL=jobs.module.js.map