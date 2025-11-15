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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircleService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const developer_controlled_wallets_1 = require("@circle-fin/developer-controlled-wallets");
let CircleService = class CircleService {
    configService;
    apiKey;
    client;
    entitySecret;
    walletSetId;
    constructor(configService) {
        this.configService = configService;
        this.apiKey = this.configService.get('CIRCLE_API_KEY');
        if (!this.apiKey) {
            throw new Error('CIRCLE_API_KEY is not configured');
        }
        this.entitySecret = this.configService.get('CIRCLE_ENTITY_SECRET');
        this.walletSetId = this.configService.get('CIRCLE_WALLET_SET_ID');
        this.client = (0, developer_controlled_wallets_1.initiateDeveloperControlledWalletsClient)({
            apiKey: this.apiKey,
            entitySecret: this.entitySecret ?? '',
            baseUrl: this.configService.get('CIRCLE_BASE_URL') ??
                'https://api-sandbox.circle.com',
        });
    }
    async createWalletForUser(userId) {
        if (!this.entitySecret) {
            throw new Error('CIRCLE_ENTITY_SECRET is not configured');
        }
        if (!this.walletSetId) {
            throw new Error('CIRCLE_WALLET_SET_ID is not configured');
        }
        try {
            const entitySecretCiphertext = await (0, developer_controlled_wallets_1.generateEntitySecretCiphertext)({
                apiKey: this.apiKey,
                entitySecret: this.entitySecret,
            });
            const idempotencyKey = (0, crypto_1.randomUUID)();
            const blockchains = ['ARC-TESTNET'];
            const walletsResponse = await this.client.createWallets({
                idempotencyKey,
                walletSetId: this.walletSetId,
                blockchains,
                count: 1,
                accountType: 'SCA',
            });
            const walletsData = walletsResponse.data;
            const createdWallet = walletsData?.wallets?.[0] ?? walletsData?.data?.wallets?.[0];
            const circleWalletId = createdWallet?.id ?? createdWallet?.walletId;
            const walletAddress = createdWallet?.address ??
                createdWallet?.addressOnNetwork ??
                createdWallet?.addresses?.[0]?.address;
            if (!circleWalletId || !walletAddress) {
                throw new Error(`Unexpected Circle create wallet response: ${JSON.stringify(walletsData)}`);
            }
            return { circleWalletId, walletAddress };
        }
        catch (err) {
            console.error('[Circle] createWalletForUser error', err);
            throw err;
        }
    }
    async getWalletBalance(_circleWalletId) {
        try {
            return '0.0';
        }
        catch (err) {
            console.error('[Circle] getWalletBalance error', err);
            return '0.0';
        }
    }
    async createDepositSession(params) {
        console.warn('[Circle] createDepositSession is using a stub URL; integrate Circle Payments for real deposits');
        return `https://pay.circle.com/checkout/mock?walletId=${encodeURIComponent(params.circleWalletId)}&amount=${encodeURIComponent(params.amount)}`;
    }
    async approveEscrowSpend(params) {
        console.warn('[Circle] approveEscrowSpend is a no-op stub; integrate real escrow approval flow later');
        return;
    }
};
exports.CircleService = CircleService;
exports.CircleService = CircleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CircleService);
//# sourceMappingURL=circle.service.js.map