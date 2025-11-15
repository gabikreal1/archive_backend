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
exports.DevController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wallet_mapping_entity_1 = require("../entities/wallet-mapping.entity");
const job_entity_1 = require("../entities/job.entity");
const bid_entity_1 = require("../entities/bid.entity");
const agent_entity_1 = require("../entities/agent.entity");
const delivery_entity_1 = require("../entities/delivery.entity");
let DevController = class DevController {
    walletRepo;
    jobsRepo;
    bidsRepo;
    agentsRepo;
    deliveriesRepo;
    constructor(walletRepo, jobsRepo, bidsRepo, agentsRepo, deliveriesRepo) {
        this.walletRepo = walletRepo;
        this.jobsRepo = jobsRepo;
        this.bidsRepo = bidsRepo;
        this.agentsRepo = agentsRepo;
        this.deliveriesRepo = deliveriesRepo;
    }
    async resetAll() {
        await this.deliveriesRepo
            .createQueryBuilder()
            .delete()
            .where('1=1')
            .execute();
        await this.bidsRepo
            .createQueryBuilder()
            .delete()
            .where('1=1')
            .execute();
        await this.jobsRepo
            .createQueryBuilder()
            .delete()
            .where('1=1')
            .execute();
        await this.agentsRepo
            .createQueryBuilder()
            .delete()
            .where('1=1')
            .execute();
        await this.walletRepo
            .createQueryBuilder()
            .delete()
            .where('1=1')
            .execute();
        return { success: true };
    }
};
exports.DevController = DevController;
__decorate([
    (0, common_1.Delete)('reset'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DevController.prototype, "resetAll", null);
exports.DevController = DevController = __decorate([
    (0, common_1.Controller)('dev'),
    __param(0, (0, typeorm_1.InjectRepository)(wallet_mapping_entity_1.WalletMappingEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(job_entity_1.JobEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(bid_entity_1.BidEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(agent_entity_1.AgentEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(delivery_entity_1.DeliveryEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DevController);
//# sourceMappingURL=dev.controller.js.map