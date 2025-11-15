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
var Web3Service_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3Service = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ethers_1 = require("ethers");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
let Web3Service = class Web3Service {
    static { Web3Service_1 = this; }
    configService;
    logger = new common_1.Logger(Web3Service_1.name);
    provider;
    signer;
    abiBasePath;
    abiCache = new Map();
    contracts;
    static ERC20_ABI = [
        'function approve(address spender, uint256 amount) returns (bool)',
        'function allowance(address owner, address spender) view returns (uint256)',
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
    ];
    constructor(configService) {
        this.configService = configService;
        const rpcUrl = this.configService.get('ARC_RPC_URL') ??
            'https://arc-testnet-rpc.placeholder';
        const chainId = Number(this.configService.get('ARC_CHAIN_ID') ?? 5042002);
        this.provider = new ethers_1.JsonRpcProvider(rpcUrl, chainId);
        let privateKey = this.configService.get('WEB3_OPERATOR_PRIVATE_KEY');
        if (!privateKey) {
            this.logger.warn('WEB3_OPERATOR_PRIVATE_KEY is not set. Web3Service is running in DEV/STUB mode; real blockchain transactions may fail.');
            privateKey = ethers_1.Wallet.createRandom().privateKey;
        }
        this.signer = new ethers_1.Wallet(privateKey, this.provider);
        this.abiBasePath =
            this.configService.get('ABIS_BASE_PATH') ??
                (0, node_path_1.join)(process.cwd(), '..', 'ABIS');
        this.contracts = {
            orderBook: this.bootstrapContract('ORDERBOOK_ADDRESS', 'OrderBook'),
            escrow: this.bootstrapContract('ESCROW_ADDRESS', 'Escrow'),
            jobRegistry: this.bootstrapContract('JOB_REGISTRY_ADDRESS', 'JobRegistry'),
            agentRegistry: this.bootstrapContract('AGENT_REGISTRY_ADDRESS', 'AgentRegistry'),
            reputation: this.bootstrapContract('REPUTATION_TOKEN_ADDRESS', 'IReputationEmitter'),
            usdc: this.bootstrapContract('USDC_TOKEN_ADDRESS', 'ERC20', Web3Service_1.ERC20_ABI),
        };
    }
    getContract(key) {
        return this.contracts[key];
    }
    get orderBook() {
        return this.getContract('orderBook');
    }
    get escrow() {
        return this.getContract('escrow');
    }
    get jobRegistry() {
        return this.getContract('jobRegistry');
    }
    get agentRegistry() {
        return this.getContract('agentRegistry');
    }
    get reputation() {
        return this.getContract('reputation');
    }
    get usdc() {
        return this.getContract('usdc');
    }
    parseEvent(contract, receipt, eventName) {
        if (!receipt) {
            return null;
        }
        for (const log of receipt.logs ?? []) {
            try {
                const parsed = contract.iface.parseLog(log);
                if (parsed && parsed.name === eventName) {
                    return parsed;
                }
            }
            catch {
            }
        }
        return null;
    }
    bootstrapContract(addressKey, abiName, abiOverride) {
        const address = this.configService.get(addressKey) ??
            '0x0000000000000000000000000000000000000000';
        if (!this.configService.get(addressKey)) {
            this.logger.warn(`Missing contract address env: ${addressKey}. Using stub address ${address} (DEV mode).`);
        }
        const abi = abiOverride ?? [];
        const iface = new ethers_1.Interface(abi);
        const read = new ethers_1.Contract(address, abi, this.provider);
        const write = new ethers_1.Contract(address, abi, this.signer);
        this.logger.verbose(`Bootstrapped contract ${abiName} @ ${address}`);
        return { address, read, write, iface };
    }
    loadAbi(contractName) {
        if (this.abiCache.has(contractName)) {
            return this.abiCache.get(contractName);
        }
        const filePath = (0, node_path_1.join)(this.abiBasePath, `${contractName}.json`);
        const raw = (0, node_fs_1.readFileSync)(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        const abiCandidate = parsed && typeof parsed === 'object' && 'abi' in parsed
            ? parsed.abi
            : parsed;
        if (!abiCandidate) {
            throw new Error(`ABI missing in ${filePath}`);
        }
        this.abiCache.set(contractName, abiCandidate);
        return abiCandidate;
    }
};
exports.Web3Service = Web3Service;
exports.Web3Service = Web3Service = Web3Service_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], Web3Service);
//# sourceMappingURL=web3.service.js.map