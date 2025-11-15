import { Module } from '@nestjs/common';
import { OrderBookService } from './order-book/order-book.service';
import { EscrowService } from './escrow/escrow.service';
import { ReputationService } from './reputation/reputation.service';

@Module({
  providers: [OrderBookService, EscrowService, ReputationService],
  exports: [OrderBookService, EscrowService, ReputationService],
})
export class BlockchainModule {}
