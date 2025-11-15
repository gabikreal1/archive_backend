import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [AgentsModule],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}

