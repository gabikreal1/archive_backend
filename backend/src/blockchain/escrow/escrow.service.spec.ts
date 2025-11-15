import { Test, TestingModule } from '@nestjs/testing';
import { EscrowService } from './escrow.service';
import { Web3Service } from '../web3.service';

describe('EscrowService', () => {
  let service: EscrowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowService,
        {
          provide: Web3Service,
          useValue: {
            escrow: {
              write: { lockFunds: jest.fn(), releasePayment: jest.fn() },
              read: { getEscrow: jest.fn() },
            },
            parseEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EscrowService>(EscrowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
