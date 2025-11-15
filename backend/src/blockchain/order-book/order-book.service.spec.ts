import { Test, TestingModule } from '@nestjs/testing';
import { OrderBookService } from './order-book.service';
import { Web3Service } from '../web3.service';

describe('OrderBookService', () => {
  let service: OrderBookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderBookService,
        {
          provide: Web3Service,
          useValue: {
            orderBook: {
              write: { postJob: jest.fn() },
              read: { getJob: jest.fn() },
            },
            parseEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderBookService>(OrderBookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
