import { BidEntity } from './bid.entity';
import { DeliveryEntity } from './delivery.entity';
export declare enum JobStatus {
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    DISPUTED = "DISPUTED"
}
export declare class JobEntity {
    id: string;
    posterWallet: string;
    createdByUserId: string | null;
    conversationId: string | null;
    description: string;
    metadataUri: string | null;
    tags: string[] | null;
    deadline: Date | null;
    status: JobStatus;
    createdAt: Date;
    bids?: BidEntity[];
    deliveries?: DeliveryEntity[];
}
