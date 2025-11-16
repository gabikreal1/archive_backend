import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobOrchestrationService } from './job-orchestration.service';
import { AgentsModule } from '../agents/agents.module';
import { JobEntity } from '../entities/job.entity';
import { BidEntity } from '../entities/bid.entity';
import { DeliveryEntity } from '../entities/delivery.entity';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { CircleModule } from '../circle/circle.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobEntity, BidEntity, DeliveryEntity]),
    forwardRef(() => BlockchainModule),
    CircleModule,
    forwardRef(() => WebsocketModule),
    AuthModule,
    forwardRef(() => AgentsModule),
  ],
  providers: [JobsService, JobOrchestrationService],
  controllers: [JobsController],
  exports: [JobsService, JobOrchestrationService],
})
export class JobsModule {}
