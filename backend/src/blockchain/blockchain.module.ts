import { Module, forwardRef } from '@nestjs/common';
import { OrderBookService } from './order-book/order-book.service';
import { EscrowService } from './escrow/escrow.service';
import { ReputationService } from './reputation/reputation.service';
import { Web3Service } from './web3.service';
import { IpfsService } from './ipfs/ipfs.service';
import { IpfsMetadataService } from './ipfs/metadata.service';
import { MetadataController } from './ipfs/metadata.controller';
import { BlockchainListenerService } from './listeners/blockchain-listener.service';
import { WebsocketModule } from '../websocket/websocket.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [forwardRef(() => WebsocketModule), forwardRef(() => JobsModule)],
  controllers: [MetadataController],
  providers: [
    Web3Service,
    IpfsService,
    IpfsMetadataService,
    OrderBookService,
    EscrowService,
    ReputationService,
    BlockchainListenerService,
  ],
  exports: [
    Web3Service,
    IpfsService,
    IpfsMetadataService,
    OrderBookService,
    EscrowService,
    ReputationService,
  ],
})
export class BlockchainModule {}
