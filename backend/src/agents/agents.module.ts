import { Module } from '@nestjs/common';
import { AgentsService } from './agents/agents.service';
import { ExecutorService } from './executor/executor.service';

@Module({
  providers: [AgentsService, ExecutorService]
})
export class AgentsModule {}
