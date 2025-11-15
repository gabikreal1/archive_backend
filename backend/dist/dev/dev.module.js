"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const dev_controller_1 = require("./dev.controller");
const wallet_mapping_entity_1 = require("../entities/wallet-mapping.entity");
const job_entity_1 = require("../entities/job.entity");
const bid_entity_1 = require("../entities/bid.entity");
const agent_entity_1 = require("../entities/agent.entity");
const delivery_entity_1 = require("../entities/delivery.entity");
let DevModule = class DevModule {
};
exports.DevModule = DevModule;
exports.DevModule = DevModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                wallet_mapping_entity_1.WalletMappingEntity,
                job_entity_1.JobEntity,
                bid_entity_1.BidEntity,
                agent_entity_1.AgentEntity,
                delivery_entity_1.DeliveryEntity,
            ]),
        ],
        controllers: [dev_controller_1.DevController],
    })
], DevModule);
//# sourceMappingURL=dev.module.js.map