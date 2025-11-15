import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobEntity } from '../entities/job.entity';
import { BidEntity } from '../entities/bid.entity';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { CircleModule } from '../circle/circle.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobEntity, BidEntity]),
    BlockchainModule,
    CircleModule,
    WebsocketModule,
    AuthModule,
  ],
  providers: [JobsService],
  controllers: [JobsController],
})
export class JobsModule {}
