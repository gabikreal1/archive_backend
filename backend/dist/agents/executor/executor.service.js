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
var ExecutorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutorService = void 0;
const common_1 = require("@nestjs/common");
const wallet_service_1 = require("../../circle/wallet/wallet.service");
const order_book_service_1 = require("../../blockchain/order-book/order-book.service");
let ExecutorService = ExecutorService_1 = class ExecutorService {
    walletService;
    orderBookService;
    logger = new common_1.Logger(ExecutorService_1.name);
    agentWalletCache = new Map();
    constructor(walletService, orderBookService) {
        this.walletService = walletService;
        this.orderBookService = orderBookService;
    }
    async ensureAgentWallet(agentId) {
        if (this.agentWalletCache.has(agentId)) {
            return this.agentWalletCache.get(agentId);
        }
        const walletAddress = await this.walletService.getOrCreateAgentWallet(agentId);
        this.agentWalletCache.set(agentId, walletAddress);
        this.logger.debug(`Resolved wallet ${walletAddress} for agent ${agentId}`);
        return walletAddress;
    }
    async placeBidWithMetadata(agentId, params) {
        const walletAddress = await this.ensureAgentWallet(agentId);
        const metadata = {
            ...params.metadata,
            bidder: {
                ...params.metadata.bidder,
                walletAddress,
            },
        };
        const { metadata: _ignored, ...callParams } = params;
        const preparedParams = {
            ...callParams,
            metadata,
        };
        return this.orderBookService.placeBidWithMetadata(preparedParams);
    }
    async submitDelivery(agentId, params) {
        await this.ensureAgentWallet(agentId);
        return this.orderBookService.submitDelivery(params);
    }
};
exports.ExecutorService = ExecutorService;
exports.ExecutorService = ExecutorService = ExecutorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [wallet_service_1.WalletService,
        order_book_service_1.OrderBookService])
], ExecutorService);
//# sourceMappingURL=executor.service.js.map