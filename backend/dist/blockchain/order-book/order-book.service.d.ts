import { ConfigService } from '@nestjs/config';
interface PostJobParams {
    poster: string;
    description: string;
    tags: string[];
    deadline?: number;
}
export declare class OrderBookService {
    private readonly configService;
    private readonly provider;
    private readonly orderBookContract;
    constructor(configService: ConfigService);
    postJob(params: PostJobParams): Promise<{
        jobId: string;
        txHash: string;
    }>;
}
export {};
