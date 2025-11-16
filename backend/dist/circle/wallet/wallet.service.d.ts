import { Repository } from 'typeorm';
import { WalletMappingEntity } from '../../entities/wallet-mapping.entity';
import { CircleService } from '../circle/circle.service';
import { Web3Service } from '../../blockchain/web3.service';
export declare class WalletService {
    private readonly walletRepo;
    private readonly circleService;
    private readonly web3Service;
    private readonly agentKeyPrefix;
    private readonly logger;
    private readonly devAgentWalletAddress?;
    private readonly devAgentCircleWalletId;
    constructor(walletRepo: Repository<WalletMappingEntity>, circleService: CircleService, web3Service: Web3Service);
    getOrCreateUserWallet(userId: string): Promise<string>;
    getOrCreateMapping(userId: string): Promise<WalletMappingEntity>;
    private buildAgentOwner;
    getOrCreateAgentWallet(agentId: string): Promise<string>;
    getAgentMapping(agentId: string): Promise<WalletMappingEntity>;
    getUserBalance(userId: string): Promise<{
        walletAddress: string;
        usdcBalance: string;
    }>;
    createDepositSession(params: {
        userId: string;
        amount: string;
        paymentMethod?: string;
    }): Promise<{
        depositUrl: string;
    }>;
    approveEscrowSpend(userId: string, amount: string): Promise<void>;
    private shouldUseDevAgentWallet;
    private deriveDevAgentWalletAddress;
}
