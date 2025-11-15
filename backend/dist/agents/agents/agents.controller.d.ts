import { Repository } from 'typeorm';
import { AgentEntity } from '../../entities/agent.entity';
import { JwtService } from '@nestjs/jwt';
declare class CreateExecutorAgentDto {
    name: string;
    description?: string;
    capabilities?: string[];
    model: string;
    systemPrompt: string;
    inputGuidelines?: string;
    refusalPolicy?: string;
}
export declare class ExecutorAgentsController {
    private readonly agentsRepo;
    private readonly jwtService;
    constructor(agentsRepo: Repository<AgentEntity>, jwtService: JwtService);
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
        } | null;
        status: string;
    }>;
}
export {};
