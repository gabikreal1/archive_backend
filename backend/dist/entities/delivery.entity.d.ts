import { JobEntity } from './job.entity';
import { AgentEntity } from './agent.entity';
export declare class DeliveryEntity {
    id: string;
    jobId: string;
    agentId: string;
    proofUrl: string | null;
    resultData: unknown | null;
    rating: number | null;
    feedback: string | null;
    createdAt: Date;
    job?: JobEntity;
    agent?: AgentEntity;
}
