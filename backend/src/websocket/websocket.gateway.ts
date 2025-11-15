import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JobEntity } from '../entities/job.entity';
import { BidEntity } from '../entities/bid.entity';
import { AgentsService } from '../agents/agents/agents.service';
import {
  AgentJoinPayload,
  AgentUserMessagePayload,
} from '../agents/agents/agent-messages.types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly agentsService: AgentsService) {}

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

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

  // ---- Example handler for incoming messages from agents/users (optional) ----

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: any) {
    return { event: 'pong', data };
  }

  // ---- Real‑time dialog with internal LLM agent ----

  private getConversationRoom(conversationId: string): string {
    return `conversation:${conversationId}`;
  }

  /**
   * Подписка клиента на конкретную диалоговую сессию.
   * Фронт шлёт:
   *
   * socket.emit('agent_join', { conversationId, userId });
   */
  @SubscribeMessage('agent_join')
  handleAgentJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AgentJoinPayload,
  ) {
    if (!payload?.conversationId) {
      client.emit('agent_error', {
        message: 'conversationId is required',
      });
      return;
    }

    const room = this.getConversationRoom(payload.conversationId);
    client.join(room);
    this.logger.debug(
      `Client ${client.id} joined conversation ${payload.conversationId}`,
    );

    client.emit('agent_joined', {
      conversationId: payload.conversationId,
    });
  }

  /**
   * Входящее текстовое сообщение пользователя к LLM‑агенту.
   *
   * socket.emit('agent_user_message', {
   *   conversationId,
   *   userId,
   *   message,
   *   metadata: { ... } // опционально
   * });
   */
  @SubscribeMessage('agent_user_message')
  async handleAgentUserMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AgentUserMessagePayload,
  ) {
    if (!payload?.conversationId || !payload?.message) {
      client.emit('agent_error', {
        message: 'conversationId and message are required',
      });
      return;
    }

    const room = this.getConversationRoom(payload.conversationId);

    // 1. Отразим сообщение пользователя всем участникам сессии (фронт может рисовать историю диалога).
    this.server.to(room).emit('agent_user_message', {
      ...payload,
      socketId: client.id,
    });

    // 2. Передаём сообщение в сервис агента, который решает, что делать (LLM + смартконтракты).
    const botReply = await this.agentsService.handleUserMessage(payload);

    // 3. Шлём ответ бота всем подписчикам этой сессии.
    this.server.to(room).emit('agent_bot_message', botReply);
  }
}

