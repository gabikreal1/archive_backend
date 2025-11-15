import { Module } from '@nestjs/common';
import { OrderBookService } from './order-book/order-book.service';
import { EscrowService } from './escrow/escrow.service';
import { ReputationService } from './reputation/reputation.service';
import { Web3Service } from './web3.service';
import { IpfsService } from './ipfs/ipfs.service';
import { BlockchainListenerService } from './listeners/blockchain-listener.service';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebsocketModule],
  providers: [
    Web3Service,
    IpfsService,
    OrderBookService,
    EscrowService,
    ReputationService,
    BlockchainListenerService,
  ],
  exports: [
    Web3Service,
    IpfsService,
    OrderBookService,
    EscrowService,
    ReputationService,
  ],
})
export class BlockchainModule {}
