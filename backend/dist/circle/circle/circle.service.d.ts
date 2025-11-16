import { ConfigService } from '@nestjs/config';
export declare class CircleService {
    private readonly configService;
    private readonly apiKey;
    private readonly client;
    private readonly entitySecret;
    private readonly walletSetId;
    constructor(configService: ConfigService);
    createWalletForUser(userId: string): Promise<{
        circleWalletId: string;
        walletAddress: string;
    }>;
    getWalletBalance(circleWalletId: string): Promise<string>;
    createDepositSession(params: {
        circleWalletId: string;
        amount: string;
        paymentMethod?: string;
    }): Promise<string>;
    approveEscrowSpend(params: {
        circleWalletId: string;
        amount: string;
    }): Promise<void>;
    private getOperatorOnchainUsdcBalance;
}
