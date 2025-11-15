import { AgentBotMessagePayload, AgentUserMessagePayload } from './agent-messages.types';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { SergbotTaskEntity } from '../../entities/sergbot-task.entity';
export declare class AgentsService {
    private readonly configService;
    private readonly tasksRepo;
    private readonly logger;
    private readonly openai?;
    private readonly conversations;
    constructor(configService: ConfigService, tasksRepo: Repository<SergbotTaskEntity>);
    private getConversationMessages;
    private pushConversationMessage;
    private generateSergbotResponse;
    handleUserMessage(payload: AgentUserMessagePayload): Promise<AgentBotMessagePayload>;
}
