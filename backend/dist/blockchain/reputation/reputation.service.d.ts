import { ConfigService } from '@nestjs/config';
export declare class ReputationService {
    private readonly configService;
    private readonly provider;
    private readonly reputationContract;
    constructor(configService: ConfigService);
    getReputation(agentAddress: string): Promise<string>;
    updateReputation(agentAddress: string, delta: string): Promise<void>;
}
