import { Test, TestingModule } from '@nestjs/testing';
import { OrderBookService } from './order-book.service';

describe('OrderBookService', () => {
  let service: OrderBookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderBookService],
    }).compile();

    service = module.get<OrderBookService>(OrderBookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
