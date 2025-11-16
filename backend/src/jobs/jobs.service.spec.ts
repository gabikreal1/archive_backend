import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JobEntity, JobStatus } from '../entities/job.entity';
import { BidEntity } from '../entities/bid.entity';
import {
  OrderBookService,
  AcceptBidParams,
} from '../blockchain/order-book/order-book.service';
import { EscrowService } from '../blockchain/escrow/escrow.service';
import { WalletService } from '../circle/wallet/wallet.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { IpfsMetadataService } from '../blockchain/ipfs/metadata.service';
import { AcceptBidDto } from './dto/accept-bid.dto';
import { JobOrchestrationService } from './job-orchestration.service';

const createRepoMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  }),
});

describe('JobsService', () => {
  let service: JobsService;
  let jobsRepo: ReturnType<typeof createRepoMock>;
  let bidsRepo: ReturnType<typeof createRepoMock>;
  let orderBook: { acceptBid: jest.Mock };
  let escrow: { createEscrow: jest.Mock };
  let wallet: {
    getOrCreateUserWallet: jest.Mock;
    approveEscrowSpend: jest.Mock;
  };
  let websocket: {
    emitBlockchainEvent: jest.Mock;
    broadcastNewJob: jest.Mock;
    notifyJobAwarded: jest.Mock;
    notifyPaymentReleased: jest.Mock;
  };
  let metadata: { publishJobMetadata: jest.Mock };
  let jobOrchestration: {
    launchAuction: jest.Mock;
    selectExecutor: jest.Mock;
    submitRating: jest.Mock;
  };

  beforeEach(async () => {
    jobsRepo = createRepoMock();
    bidsRepo = createRepoMock();
    orderBook = { acceptBid: jest.fn() };
    escrow = { createEscrow: jest.fn() };
    wallet = {
      getOrCreateUserWallet: jest.fn(),
      approveEscrowSpend: jest.fn(),
    };
    websocket = {
      emitBlockchainEvent: jest.fn(),
      broadcastNewJob: jest.fn(),
      notifyJobAwarded: jest.fn(),
      notifyPaymentReleased: jest.fn(),
    };
    metadata = { publishJobMetadata: jest.fn() };
    jobOrchestration = {
      launchAuction: jest.fn(),
      selectExecutor: jest.fn(),
      submitRating: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: getRepositoryToken(JobEntity), useValue: jobsRepo },
        { provide: getRepositoryToken(BidEntity), useValue: bidsRepo },
        { provide: OrderBookService, useValue: orderBook },
        { provide: EscrowService, useValue: escrow },
        { provide: WalletService, useValue: wallet },
        { provide: WebsocketGateway, useValue: websocket },
        { provide: IpfsMetadataService, useValue: metadata },
        { provide: JobOrchestrationService, useValue: jobOrchestration },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('acceptBid', () => {
    let job: JobEntity;
    let bid: BidEntity;

    const buildDtoWithAnswers = (): AcceptBidDto => ({
      bidId: bid.id,
      answers: [{ id: 'q1', question: 'Why?', answer: 'Because' }],
    });

    beforeEach(() => {
      job = { id: '1', status: JobStatus.OPEN } as JobEntity;
      bid = {
        id: '10',
        price: '100',
        bidderWallet: '0xagent',
        accepted: false,
      } as BidEntity;

      jobsRepo.findOne.mockResolvedValue(job);
      bidsRepo.findOne.mockResolvedValue(bid);
      wallet.getOrCreateUserWallet.mockResolvedValue('0xposter');
      wallet.approveEscrowSpend.mockResolvedValue(undefined);
      escrow.createEscrow.mockResolvedValue({ escrowTxHash: '0xescrow' });
      orderBook.acceptBid.mockResolvedValue({
        txHash: '0xaccept',
        responseUri: 'ipfs://response',
        responseCid: 'cid-123',
      });
    });

    it('passes response metadata to order book when provided', async () => {
      const result = await service.acceptBid(
        'user-1',
        job.id,
        buildDtoWithAnswers(),
      );

      expect(orderBook.acceptBid).toHaveBeenCalledWith(
        expect.objectContaining<AcceptBidParams>({
          jobId: job.id,
          bidId: bid.id,
          responseMetadata: expect.objectContaining({
            answeredBy: '0xposter',
            answers: {
              q1: { question: 'Why?', answer: 'Because' },
            },
          }),
        }),
      );
      expect(result.bidResponseMetadataUri).toBe('ipfs://response');
      expect(result.acceptBidTxHash).toBe('0xaccept');
      expect(bid.accepted).toBe(true);
      expect(job.status).toBe(JobStatus.IN_PROGRESS);
    });

    it('calls acceptBid without metadata when no answers provided', async () => {
      const dto: AcceptBidDto = { bidId: bid.id };
      orderBook.acceptBid.mockResolvedValue({ txHash: '0xaccept2' });

      const result = await service.acceptBid('user-1', job.id, dto);

      expect(orderBook.acceptBid).toHaveBeenCalledWith(
        expect.objectContaining<AcceptBidParams>({
          jobId: job.id,
          bidId: bid.id,
          responseMetadata: undefined,
        }),
      );
      expect(result.bidResponseMetadataUri).toBeUndefined();
      expect(result.acceptBidTxHash).toBe('0xaccept2');
    });
  });
});
