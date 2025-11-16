import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CircleService } from './circle/circle.service';
import { WalletService } from './wallet/wallet.service';
import { WalletMappingEntity } from '../entities/wallet-mapping.entity';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletMappingEntity]),
    forwardRef(() => BlockchainModule),
  ],
  providers: [CircleService, WalletService],
  exports: [WalletService],
})
export class CircleModule {}
