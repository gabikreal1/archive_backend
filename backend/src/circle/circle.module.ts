import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CircleService } from './circle/circle.service';
import { WalletService } from './wallet/wallet.service';
import { WalletMappingEntity } from '../entities/wallet-mapping.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WalletMappingEntity])],
  providers: [CircleService, WalletService],
  exports: [WalletService],
})
export class CircleModule {}
