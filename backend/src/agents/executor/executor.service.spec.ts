import { Test, TestingModule } from '@nestjs/testing';
import { ExecutorService, AgentBidRequest } from './executor.service';
import { WalletService } from '../../circle/wallet/wallet.service';
import { OrderBookService } from '../../blockchain/order-book/order-book.service';

describe('ExecutorService', () => {
  let service: ExecutorService;
  let walletService: jest.Mocked<WalletService>;
  let orderBookService: jest.Mocked<OrderBookService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutorService,
        {
          provide: WalletService,
          useValue: {
            getOrCreateAgentWallet: jest.fn(),
          },
        },
        {
          provide: OrderBookService,
          useValue: {
            placeBidWithMetadata: jest.fn(),
            submitDelivery: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ExecutorService);
    walletService = module.get(WalletService) as jest.Mocked<WalletService>;
    orderBookService = module.get(OrderBookService) as jest.Mocked<OrderBookService>;
  });

  it('caches agent wallets after first lookup', async () => {
    walletService.getOrCreateAgentWallet.mockResolvedValueOnce('0xagent');

    const first = await service.ensureAgentWallet('agent_1');
    const second = await service.ensureAgentWallet('agent_1');

    expect(first).toBe('0xagent');
    expect(second).toBe('0xagent');
    expect(walletService.getOrCreateAgentWallet).toHaveBeenCalledTimes(1);
  });

  it('injects agent wallet into bid metadata', async () => {
    walletService.getOrCreateAgentWallet.mockResolvedValueOnce('0xwallet');
    orderBookService.placeBidWithMetadata.mockResolvedValueOnce({
      bidId: '1',
      txHash: '0xhash',
      metadataUri: 'ipfs://meta',
      metadataCid: 'cid',
    });

    const params: AgentBidRequest = {
      jobId: '123',
      price: '100',
      deliveryTimeSeconds: '3600',
      metadata: {
        bidder: {
          name: 'Agent',
          specialization: ['research'],
        },
        price: {
          total: 100,
        },
        deliveryTime: {
          estimatedSeconds: 3600,
        },
        methodology: 'Plan',
      },
    };

    await service.placeBidWithMetadata('agent_1', params);

    expect(orderBookService.placeBidWithMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          bidder: expect.objectContaining({ walletAddress: '0xwallet' }),
        }),
      }),
    );
  });

  it('forwards submitDelivery invocations', async () => {
    walletService.getOrCreateAgentWallet.mockResolvedValue('0xwallet');
    orderBookService.submitDelivery.mockResolvedValueOnce({
      txHash: '0xtx',
      proofHash: '0xproof',
    });

    await service.submitDelivery('agent_2', {
      jobId: 'job',
      proofHash: '0xproof',
    });

    expect(orderBookService.submitDelivery).toHaveBeenCalledWith({
      jobId: 'job',
      proofHash: '0xproof',
    });
  });
});
