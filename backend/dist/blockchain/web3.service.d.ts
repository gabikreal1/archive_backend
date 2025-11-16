import { ConfigService } from '@nestjs/config';
import { Contract, ContractTransactionReceipt, Interface, JsonRpcProvider, LogDescription, Wallet } from 'ethers';
type ContractKey = 'orderBook' | 'escrow' | 'jobRegistry' | 'agentRegistry' | 'reputation' | 'usdc';
export interface ContractBundle {
    address: string;
    read: Contract;
    write: Contract;
    iface: Interface;
}
export declare class Web3Service {
    private readonly configService;
    private readonly logger;
    readonly provider: JsonRpcProvider;
    readonly signer: Wallet;
    readonly isStubProvider: boolean;
    private readonly abiBasePath;
    private readonly abiCache;
    private readonly contracts;
    private static readonly ERC20_ABI;
    constructor(configService: ConfigService);
    getContract(key: ContractKey): ContractBundle;
    get orderBook(): ContractBundle;
    get escrow(): ContractBundle;
    get jobRegistry(): ContractBundle;
    get agentRegistry(): ContractBundle;
    get reputation(): ContractBundle;
    get usdc(): ContractBundle;
    parseEvent(contract: ContractBundle, receipt: ContractTransactionReceipt | null, eventName: string): LogDescription | null;
    private bootstrapContract;
    private loadAbi;
    private suppressRpcNoise;
}
export {};
