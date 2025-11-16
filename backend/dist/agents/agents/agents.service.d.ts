import { AgentBotMessagePayload, AgentUserMessagePayload } from './agent-messages.types';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { JobEntity } from '../../entities/job.entity';
import { JobsService } from '../../jobs/jobs.service';
export declare class AgentsService {
    private readonly configService;
    private readonly jobsRepo;
    private readonly jobsService;
    private readonly logger;
    private readonly openai?;
    private readonly conversations;
    constructor(configService: ConfigService, jobsRepo: Repository<JobEntity>, jobsService: JobsService);
    private getConversationMessages;
    private pushConversationMessage;
    private generateSergbotResponse;
    handleUserMessage(payload: AgentUserMessagePayload): Promise<AgentBotMessagePayload>;
}
