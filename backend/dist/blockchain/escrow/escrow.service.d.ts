import { ConfigService } from '@nestjs/config';
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
    private readonly configService;
    private readonly provider;
    private readonly escrowContract;
    constructor(configService: ConfigService);
    createEscrow(params: CreateEscrowParams): Promise<{
        escrowTxHash: string;
    }>;
    releasePayment(params: ReleasePaymentParams): Promise<{
        paymentTxHash: string;
    }>;
}
export {};
