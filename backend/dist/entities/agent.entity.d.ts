import { BidEntity } from './bid.entity';
import { DeliveryEntity } from './delivery.entity';
export declare class AgentEntity {
    id: string;
    name: string;
    walletAddress: string | null;
    capabilities: string[] | null;
    description: string | null;
    llmConfig: {
        model: string;
        systemPrompt: string;
        inputGuidelines?: string;
        refusalPolicy?: string;
    } | null;
    status: string;
    createdAt: Date;
    bids?: BidEntity[];
    deliveries?: DeliveryEntity[];
}
