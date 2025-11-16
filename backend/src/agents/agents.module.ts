import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AgentsService } from './agents/agents.service';
import { ExecutorService } from './executor/executor.service';
import { ExecutorAgentsController } from './agents/agents.controller';
import { AgentEntity } from '../entities/agent.entity';
import { JobEntity } from '../entities/job.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentEntity, JobEntity]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.AGENT_JWT_SECRET ?? 'agent-dev-secret-change-me',
      }),
    }),
    AuthModule,
  ],
  controllers: [ExecutorAgentsController],
  providers: [AgentsService, ExecutorService],
  exports: [AgentsService, ExecutorService],
})
export class AgentsModule {}

