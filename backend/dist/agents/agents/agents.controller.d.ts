import { Repository } from 'typeorm';
import { AgentEntity } from '../../entities/agent.entity';
import { JwtService } from '@nestjs/jwt';
import { WalletService } from '../../circle/wallet/wallet.service';
declare class CreateExecutorAgentDto {
    name: string;
    description?: string;
    capabilities?: string[];
    model: string;
    systemPrompt: string;
    bidPrompt: string;
    executionPrompt: string;
    pricePerExecution: number;
    inputGuidelines?: string;
    refusalPolicy?: string;
}
export declare class ExecutorAgentsController {
    private readonly agentsRepo;
    private readonly jwtService;
    private readonly walletService;
    constructor(agentsRepo: Repository<AgentEntity>, jwtService: JwtService, walletService: WalletService);
    createExecutorAgent(dto: CreateExecutorAgentDto): Promise<{
        id: string;
        name: string;
        capabilities: string[] | null;
        description: string | null;
        llmConfig: {
            model: string;
            systemPrompt: string;
            inputGuidelines?: string;
            refusalPolicy?: string;
            bidPrompt?: string;
            executionPrompt?: string;
        } | null;
        status: string;
    }>;
}
export {};
