import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AgentsService } from './agents/agents.service';
import { ExecutorService } from './executor/executor.service';
import { ExecutorAutopilotService } from './executor/executor-autopilot.service';
import { ExecutorAgentsController } from './agents/agents.controller';
import { AgentEntity } from '../entities/agent.entity';
import { JobEntity } from '../entities/job.entity';
import { AuthModule } from '../auth/auth.module';
import { CircleModule } from '../circle/circle.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentEntity, JobEntity]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.AGENT_JWT_SECRET ?? 'agent-dev-secret-change-me',
      }),
    }),
    AuthModule,
    CircleModule,
    forwardRef(() => BlockchainModule),
    forwardRef(() => JobsModule),
  ],
  controllers: [ExecutorAgentsController],
  providers: [AgentsService, ExecutorService, ExecutorAutopilotService],
  exports: [AgentsService, ExecutorService, ExecutorAutopilotService],
})
export class AgentsModule {}
