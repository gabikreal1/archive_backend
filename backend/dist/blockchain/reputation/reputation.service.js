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
exports.ReputationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ethers_1 = require("ethers");
let ReputationService = class ReputationService {
    configService;
    provider;
    reputationContract;
    constructor(configService) {
        this.configService = configService;
        const rpcUrl = this.configService.get('ARC_RPC_URL') ??
            'https://arc-testnet-rpc.placeholder';
        this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
        const contractAddress = this.configService.get('REPUTATION_CONTRACT_ADDRESS') ??
            '0xReputationContractAddress';
        const abi = [
            'function getReputation(address agent) view returns (uint256)',
            'function updateReputation(address agent, uint256 delta)',
        ];
        this.reputationContract = new ethers_1.ethers.Contract(contractAddress, abi, this.provider);
    }
    async getReputation(agentAddress) {
        console.log('Get reputation (stub)', agentAddress);
        return '0';
    }
    async updateReputation(agentAddress, delta) {
        console.log('Update reputation (stub)', { agentAddress, delta });
    }
};
exports.ReputationService = ReputationService;
exports.ReputationService = ReputationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ReputationService);
//# sourceMappingURL=reputation.service.js.map