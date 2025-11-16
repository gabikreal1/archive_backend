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
var WalletService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ethers_1 = require("ethers");
const typeorm_2 = require("typeorm");
const wallet_mapping_entity_1 = require("../../entities/wallet-mapping.entity");
const circle_service_1 = require("../circle/circle.service");
const web3_service_1 = require("../../blockchain/web3.service");
let WalletService = WalletService_1 = class WalletService {
    walletRepo;
    circleService;
    web3Service;
    agentKeyPrefix = 'agent:';
    logger = new common_1.Logger(WalletService_1.name);
    devAgentWalletAddress;
    devAgentCircleWalletId;
    constructor(walletRepo, circleService, web3Service) {
        this.walletRepo = walletRepo;
        this.circleService = circleService;
        this.web3Service = web3Service;
        this.devAgentCircleWalletId =
            process.env.DEV_AGENT_CIRCLE_WALLET_ID ?? 'dev-agent-circle-wallet';
        this.devAgentWalletAddress = this.deriveDevAgentWalletAddress();
        if (this.devAgentWalletAddress) {
            this.logger.warn(`DEV agent wallet override is ON – all executors share ${this.devAgentWalletAddress}`);
        }
    }
    async getOrCreateUserWallet(userId) {
        return this.web3Service.signer.address;
    }
    async getOrCreateMapping(userId) {
        let mapping = await this.walletRepo.findOne({ where: { userId } });
        if (mapping) {
            return mapping;
        }
        if (this.shouldUseDevAgentWallet(userId)) {
            mapping = this.walletRepo.create({
                userId,
                circleWalletId: this.devAgentCircleWalletId,
                walletAddress: this.devAgentWalletAddress,
            });
            return this.walletRepo.save(mapping);
        }
        const { circleWalletId, walletAddress } = await this.circleService.createWalletForUser(userId);
        mapping = this.walletRepo.create({
            userId,
            circleWalletId,
            walletAddress,
        });
        await this.walletRepo.save(mapping);
        return mapping;
    }
    buildAgentOwner(agentId) {
        return `${this.agentKeyPrefix}${agentId}`;
    }
    async getOrCreateAgentWallet(agentId) {
        const ownerId = this.buildAgentOwner(agentId);
        const mapping = await this.getOrCreateMapping(ownerId);
        return mapping.walletAddress;
    }
    async getAgentMapping(agentId) {
        return this.getOrCreateMapping(this.buildAgentOwner(agentId));
    }
    async getUserBalance(userId) {
        const walletAddress = this.web3Service.signer.address;
        const usdc = this.web3Service.usdc;
        const raw = await usdc.read.balanceOf(walletAddress);
        const usdcBalance = ethers_1.ethers.formatUnits(raw, 6);
        return {
            walletAddress,
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
        this.logger.debug(`approveEscrowSpend(${userId}, ${amount}) noop – using operator onchain allowance instead`);
    }
    shouldUseDevAgentWallet(userId) {
        return (!!this.devAgentWalletAddress && userId.startsWith(this.agentKeyPrefix));
    }
    deriveDevAgentWalletAddress() {
        const explicit = process.env.DEV_AGENT_WALLET_ADDRESS;
        if (explicit?.trim()) {
            return explicit.trim();
        }
        const privateKey = process.env.DEV_AGENT_WALLET_PRIVATE_KEY ??
            process.env.WEB3_OPERATOR_PRIVATE_KEY;
        if (privateKey?.trim()) {
            try {
                return new ethers_1.Wallet(privateKey.trim()).address;
            }
            catch (error) {
                this.logger.warn('Failed to derive DEV agent wallet address from private key', error);
            }
        }
        return undefined;
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = WalletService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wallet_mapping_entity_1.WalletMappingEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        circle_service_1.CircleService,
        web3_service_1.Web3Service])
], WalletService);
//# sourceMappingURL=wallet.service.js.map