import { Module, forwardRef } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [forwardRef(() => AgentsModule)],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
