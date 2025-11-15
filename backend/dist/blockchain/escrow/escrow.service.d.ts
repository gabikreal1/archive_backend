import { Web3Service } from '../web3.service';
interface CreateEscrowParams {
    jobId: string;
    poster: string;
    agent: string;
    amount: string;
}
interface ReleasePaymentParams {
    jobId: string;
    agent: string;
    amount: string;
}
export declare class EscrowService {
    private readonly web3Service;
    private readonly logger;
    constructor(web3Service: Web3Service);
    createEscrow(params: CreateEscrowParams): Promise<{
        escrowTxHash: string;
    }>;
    releasePayment(params: ReleasePaymentParams): Promise<{
        paymentTxHash: string;
    }>;
    getEscrow(jobId: string): Promise<{
        user: any;
        agent: any;
        amount: any;
        funded: any;
        released: any;
        refunded: any;
    }>;
    private parseAmount;
    private toBigInt;
}
export {};
