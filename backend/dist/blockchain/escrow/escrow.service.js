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
var EscrowService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowService = void 0;
const common_1 = require("@nestjs/common");
const ethers_1 = require("ethers");
const web3_service_1 = require("../web3.service");
let EscrowService = EscrowService_1 = class EscrowService {
    web3Service;
    logger = new common_1.Logger(EscrowService_1.name);
    constructor(web3Service) {
        this.web3Service = web3Service;
    }
    async createEscrow(params) {
        this.logger.warn('EscrowService.createEscrow is deprecated in favor of OrderBook.acceptBid; use with caution.');
        const contract = this.web3Service.escrow;
        const tx = await contract.write.lockFunds(this.toBigInt(params.jobId), params.poster, params.agent, this.parseAmount(params.amount));
        const receipt = await tx.wait();
        const parsed = this.web3Service.parseEvent(contract, receipt, 'EscrowCreated');
        if (!parsed) {
            this.logger.warn(`EscrowCreated event not found for job ${params.jobId}`);
        }
        return { escrowTxHash: tx.hash };
    }
    async ensureOnchainAllowance(amount) {
        const usdc = this.web3Service.usdc;
        const escrow = this.web3Service.escrow;
        const owner = this.web3Service.signer.address;
        const required = this.parseAmount(amount);
        const current = await usdc.read.allowance(owner, escrow.address);
        if (current >= required) {
            return;
        }
        const bump = required * BigInt(10);
        this.logger.log(`Approving USDC allowance for Escrow: owner=${owner}, spender=${escrow.address}, amount=${bump.toString()}`);
        const tx = await usdc.write.approve(escrow.address, bump);
        await tx.wait();
    }
    async releasePayment(params) {
        const contract = this.web3Service.escrow;
        const tx = await contract.write.releasePayment(this.toBigInt(params.jobId));
        await tx.wait();
        return { paymentTxHash: tx.hash };
    }
    async getEscrow(jobId) {
        const contract = this.web3Service.escrow;
        const result = await contract.read.getEscrow(this.toBigInt(jobId));
        return {
            user: result.user,
            agent: result.agent,
            amount: result.amount.toString(),
            funded: result.funded,
            released: result.released,
            refunded: result.refunded,
        };
    }
    parseAmount(amount) {
        return ethers_1.ethers.parseUnits(amount, 6);
    }
    toBigInt(value) {
        if (typeof value === 'bigint') {
            return value;
        }
        if (typeof value === 'number') {
            return BigInt(value);
        }
        if (/^0x/i.test(value)) {
            return BigInt(value);
        }
        if (!/^\d+$/.test(value)) {
            throw new Error(`Value ${value} is not a valid uint256.`);
        }
        return BigInt(value);
    }
};
exports.EscrowService = EscrowService;
exports.EscrowService = EscrowService = EscrowService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [web3_service_1.Web3Service])
], EscrowService);
//# sourceMappingURL=escrow.service.js.map