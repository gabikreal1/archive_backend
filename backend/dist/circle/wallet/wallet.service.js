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
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wallet_mapping_entity_1 = require("../../entities/wallet-mapping.entity");
const circle_service_1 = require("../circle/circle.service");
let WalletService = class WalletService {
    walletRepo;
    circleService;
    constructor(walletRepo, circleService) {
        this.walletRepo = walletRepo;
        this.circleService = circleService;
    }
    async getOrCreateUserWallet(userId) {
        let mapping = await this.walletRepo.findOne({ where: { userId } });
        if (!mapping) {
            const { circleWalletId, walletAddress } = await this.circleService.createWalletForUser(userId);
            mapping = this.walletRepo.create({
                userId,
                circleWalletId,
                walletAddress,
            });
            await this.walletRepo.save(mapping);
        }
        return mapping.walletAddress;
    }
    async getOrCreateMapping(userId) {
        let mapping = await this.walletRepo.findOne({ where: { userId } });
        if (!mapping) {
            const { circleWalletId, walletAddress } = await this.circleService.createWalletForUser(userId);
            mapping = this.walletRepo.create({
                userId,
                circleWalletId,
                walletAddress,
            });
            await this.walletRepo.save(mapping);
        }
        return mapping;
    }
    async getUserBalance(userId) {
        const mapping = await this.getOrCreateMapping(userId);
        const usdcBalance = await this.circleService.getWalletBalance(mapping.circleWalletId);
        return {
            walletAddress: mapping.walletAddress,
            usdcBalance,
        };
    }
    async createDepositSession(params) {
        const { userId, amount, paymentMethod } = params;
        const mapping = await this.getOrCreateMapping(userId);
        const depositUrl = await this.circleService.createDepositSession({
            circleWalletId: mapping.circleWalletId,
            amount,
            paymentMethod,
        });
        return { depositUrl };
    }
    async approveEscrowSpend(userId, amount) {
        const mapping = await this.getOrCreateMapping(userId);
        await this.circleService.approveEscrowSpend({
            circleWalletId: mapping.circleWalletId,
            amount,
        });
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wallet_mapping_entity_1.WalletMappingEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        circle_service_1.CircleService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map