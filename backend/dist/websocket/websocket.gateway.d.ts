import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JobEntity } from '../entities/job.entity';
import { BidEntity } from '../entities/bid.entity';
import { AgentsService } from '../agents/agents/agents.service';
import type { AgentJoinPayload, AgentUserMessagePayload } from '../agents/agents/agent-messages.types';
export declare class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly agentsService;
    private readonly logger;
    server: Server;
    constructor(agentsService: AgentsService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    broadcastNewJob(job: JobEntity): void;
    broadcastNewBid(bid: BidEntity): void;
    notifyJobAwarded(job: JobEntity, bid: BidEntity): void;
    notifyDeliverySubmitted(job: JobEntity, payload: unknown): void;
    notifyPaymentReleased(job: JobEntity, bid: BidEntity): void;
    handlePing(data: any): {
        event: string;
        data: any;
    };
    private getConversationRoom;
    handleAgentJoin(client: Socket, payload: AgentJoinPayload): void;
    handleAgentUserMessage(client: Socket, payload: AgentUserMessagePayload): Promise<void>;
}
