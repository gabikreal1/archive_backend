import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { JobEntity } from '../entities/job.entity';
import { BidEntity } from '../entities/bid.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway {
  @WebSocketServer()
  server: Server;

  // ---- Outgoing events used by backend services ----

  broadcastNewJob(job: JobEntity) {
    this.server.emit('new_job', job);
  }

  broadcastNewBid(bid: BidEntity) {
    this.server.emit('new_bid', bid);
  }

  notifyJobAwarded(job: JobEntity, bid: BidEntity) {
    this.server.emit('job_awarded', { job, bid });
  }

  notifyDeliverySubmitted(job: JobEntity, payload: unknown) {
    this.server.emit('delivery_submitted', { job, payload });
  }

  notifyPaymentReleased(job: JobEntity, bid: BidEntity) {
    this.server.emit('payment_released', { job, bid });
  }

  emitBlockchainEvent(event: string, payload: unknown) {
    this.server.emit(`chain:${event}`, payload);
  }

  // ---- Example handler for incoming messages from agents/users (optional) ----

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: any) {
    return { event: 'pong', data };
  }
}
