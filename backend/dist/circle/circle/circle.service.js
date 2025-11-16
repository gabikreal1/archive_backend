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
const ethers_1 = require("ethers");
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
    async getWalletBalance(circleWalletId) {
        const usdcAddressEnv = this.configService.get('CIRCLE_USDC_TOKEN_ADDRESS') ??
            this.configService.get('USDC_TOKEN_ADDRESS');
        try {
            const response = await this.client.getWalletTokenBalance({
                id: circleWalletId,
                ...(usdcAddressEnv && { tokenAddresses: [usdcAddressEnv] }),
                includeAll: !usdcAddressEnv,
            });
            const payload = response.data ?? response;
            const tokenBalances = payload?.tokenBalances ??
                payload?.data?.tokenBalances ??
                payload?.balances ??
                [];
            if (Array.isArray(tokenBalances) && tokenBalances.length > 0) {
                const match = tokenBalances.find((b) => usdcAddressEnv
                    ? b?.token?.tokenAddress?.toLowerCase() ===
                        usdcAddressEnv.toLowerCase()
                    : b?.token?.symbol === 'USDC') ?? tokenBalances[0];
                const amount = match?.amount;
                if (typeof amount === 'string' && amount.trim()) {
                    return amount;
                }
            }
            const onchainFallback = await this.getOperatorOnchainUsdcBalance().catch(() => '0.0');
            return onchainFallback;
        }
        catch (err) {
            console.error('[Circle] getWalletBalance error', err);
            const onchainFallback = await this.getOperatorOnchainUsdcBalance().catch(() => '0.0');
            return onchainFallback;
        }
    }
    async createDepositSession(params) {
        console.warn('[Circle] createDepositSession is using a stub URL; integrate Circle Payments for real deposits');
        return `https://pay.circle.com/checkout/mock?walletId=${encodeURIComponent(params.circleWalletId)}&amount=${encodeURIComponent(params.amount)}`;
    }
    async approveEscrowSpend(params) {
        const usdcAddress = this.configService.get('USDC_TOKEN_ADDRESS') ??
            this.configService.get('CIRCLE_USDC_TOKEN_ADDRESS');
        const escrowAddress = this.configService.get('ESCROW_ADDRESS') ??
            this.configService.get('CIRCLE_ESCROW_ADDRESS');
        if (!usdcAddress) {
            throw new Error('USDC_TOKEN_ADDRESS (or CIRCLE_USDC_TOKEN_ADDRESS) is not configured – cannot perform Circle escrow approve');
        }
        if (!escrowAddress) {
            throw new Error('ESCROW_ADDRESS (or CIRCLE_ESCROW_ADDRESS) is not configured – cannot perform Circle escrow approve');
        }
        const decimals = 6;
        const amountBigInt = BigInt(Math.round(Number(params.amount) * 10 ** decimals));
        const amountRaw = amountBigInt.toString(10);
        const idempotencyKey = (0, crypto_1.randomUUID)();
        try {
            const response = await this.client.createContractExecutionTransaction({
                idempotencyKey,
                walletId: params.circleWalletId,
                contractAddress: usdcAddress,
                abiFunctionSignature: 'approve(address,uint256)',
                abiParameters: [escrowAddress, amountRaw],
                fee: {
                    type: 'level',
                    config: {
                        feeLevel: 'MEDIUM',
                    },
                },
            });
            const data = response.data;
            const txId = data?.id ??
                data?.transaction?.id ??
                data?.transactions?.[0]?.id ??
                data?.transactions?.[0]?.transaction?.id;
            console.log('[Circle] approveEscrowSpend submitted', txId ? `txId=${txId}` : '(no tx id in response)');
        }
        catch (err) {
            console.error('[Circle] approveEscrowSpend error', err);
            throw err;
        }
    }
    async getOperatorOnchainUsdcBalance() {
        const rpcUrl = this.configService.get('ARC_RPC_URL') ??
            'https://arc-testnet-rpc.placeholder';
        const chainId = Number(this.configService.get('ARC_CHAIN_ID') ?? 5042002);
        const usdcAddress = this.configService.get('USDC_TOKEN_ADDRESS') ??
            this.configService.get('CIRCLE_USDC_TOKEN_ADDRESS');
        const operatorPrivateKey = this.configService.get('WEB3_OPERATOR_PRIVATE_KEY');
        if (!usdcAddress || !operatorPrivateKey) {
            return '0.0';
        }
        const provider = new ethers_1.JsonRpcProvider(rpcUrl, chainId);
        const owner = new ethers_1.Wallet(operatorPrivateKey, provider).address;
        const erc20Abi = [
            'function balanceOf(address owner) view returns (uint256)',
            'function decimals() view returns (uint8)',
        ];
        const token = new ethers_1.Contract(usdcAddress, erc20Abi, provider);
        const [rawBalance, decimals] = await Promise.all([
            token.balanceOf(owner),
            token.decimals().catch(() => 6),
        ]);
        return ethers_1.ethers.formatUnits(rawBalance, decimals);
    }
};
exports.CircleService = CircleService;
exports.CircleService = CircleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CircleService);
//# sourceMappingURL=circle.service.js.map