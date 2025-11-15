import { BidEntity } from './bid.entity';
import { DeliveryEntity } from './delivery.entity';
export declare class AgentEntity {
    id: string;
    name: string;
    walletAddress: string;
    capabilities: string[] | null;
    status: string;
    createdAt: Date;
    bids?: BidEntity[];
    deliveries?: DeliveryEntity[];
}
