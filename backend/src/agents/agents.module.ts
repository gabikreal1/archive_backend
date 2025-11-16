import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AgentsService } from './agents/agents.service';
import { ExecutorService } from './executor/executor.service';
import { ExecutorAgentsController } from './agents/agents.controller';
import { AgentEntity } from '../entities/agent.entity';
import { JobEntity } from '../entities/job.entity';
import { AuthModule } from '../auth/auth.module';
import { CircleModule } from '../circle/circle.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

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
    BlockchainModule,
  ],
  controllers: [ExecutorAgentsController],
  providers: [AgentsService, ExecutorService],
  exports: [AgentsService, ExecutorService],
})
export class AgentsModule {}
