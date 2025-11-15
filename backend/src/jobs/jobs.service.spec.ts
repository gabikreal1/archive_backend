import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JobEntity } from '../entities/job.entity';
import { BidEntity } from '../entities/bid.entity';
import { OrderBookService } from '../blockchain/order-book/order-book.service';
import { EscrowService } from '../blockchain/escrow/escrow.service';
import { WalletService } from '../circle/wallet/wallet.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { IpfsMetadataService } from '../blockchain/ipfs/metadata.service';

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(async () => {
    const repoMock = () => ({
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: getRepositoryToken(JobEntity), useValue: repoMock() },
        { provide: getRepositoryToken(BidEntity), useValue: repoMock() },
        { provide: OrderBookService, useValue: {} },
        { provide: EscrowService, useValue: {} },
        { provide: WalletService, useValue: {} },
        {
          provide: WebsocketGateway,
          useValue: { emitBlockchainEvent: jest.fn() },
        },
        { provide: IpfsMetadataService, useValue: {} },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
