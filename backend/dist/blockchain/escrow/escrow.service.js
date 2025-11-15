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
exports.EscrowService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ethers_1 = require("ethers");
let EscrowService = class EscrowService {
    configService;
    provider;
    escrowContract;
    constructor(configService) {
        this.configService = configService;
        const rpcUrl = this.configService.get('ARC_RPC_URL') ??
            'https://arc-testnet-rpc.placeholder';
        this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
        const contractAddress = this.configService.get('ESCROW_CONTRACT_ADDRESS') ??
            '0xEscrowContractAddress';
        const abi = [
            'event EscrowCreated(string jobId, address poster, address agent, uint256 amount)',
            'event PaymentReleased(string jobId, address agent, uint256 amount)',
            'function createEscrow(string jobId, address poster, address agent, uint256 amount)',
            'function releasePayment(string jobId)',
        ];
        this.escrowContract = new ethers_1.ethers.Contract(contractAddress, abi, this.provider);
    }
    async createEscrow(params) {
        const escrowTxHash = `0xESCROW_TX_${Date.now()}`;
        console.log('Creating escrow onchain (stub)', params);
        return { escrowTxHash };
    }
    async releasePayment(params) {
        const paymentTxHash = `0xPAYMENT_TX_${Date.now()}`;
        console.log('Releasing payment onchain (stub)', params);
        return { paymentTxHash };
    }
};
exports.EscrowService = EscrowService;
exports.EscrowService = EscrowService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EscrowService);
//# sourceMappingURL=escrow.service.js.map