import { WalletService } from '../circle/wallet/wallet.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import type { Request } from 'express';
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    getBalance(req: Request): Promise<{
        walletAddress: string;
        usdcBalance: string;
    }>;
    createDeposit(req: Request, dto: CreateDepositDto): Promise<{
        depositUrl: string;
    }>;
}
