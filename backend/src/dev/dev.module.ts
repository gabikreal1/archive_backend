import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevController } from './dev.controller';
import { WalletMappingEntity } from '../entities/wallet-mapping.entity';
import { JobEntity } from '../entities/job.entity';
import { BidEntity } from '../entities/bid.entity';
import { AgentEntity } from '../entities/agent.entity';
import { DeliveryEntity } from '../entities/delivery.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WalletMappingEntity,
      JobEntity,
      BidEntity,
      AgentEntity,
      DeliveryEntity,
    ]),
  ],
  controllers: [DevController],
})
export class DevModule {}
