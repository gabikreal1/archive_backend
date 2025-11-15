import { JobEntity } from './job.entity';
import { AgentEntity } from './agent.entity';
export declare class BidEntity {
    id: string;
    jobId: string;
    bidderWallet: string;
    price: string;
    deliveryTime: string;
    reputation: string;
    accepted: boolean;
    createdAt: Date;
    job?: JobEntity;
    agent?: AgentEntity | null;
}
