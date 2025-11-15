import { Server } from 'socket.io';
import { JobEntity } from '../entities/job.entity';
import { BidEntity } from '../entities/bid.entity';
export declare class WebsocketGateway {
    server: Server;
    broadcastNewJob(job: JobEntity): void;
    broadcastNewBid(bid: BidEntity): void;
    notifyJobAwarded(job: JobEntity, bid: BidEntity): void;
    notifyDeliverySubmitted(job: JobEntity, payload: unknown): void;
    notifyPaymentReleased(job: JobEntity, bid: BidEntity): void;
    handlePing(data: any): {
        event: string;
        data: any;
    };
}
