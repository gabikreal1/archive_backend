import { Test, TestingModule } from '@nestjs/testing';
import { ReputationService } from './reputation.service';
import { Web3Service } from '../web3.service';

describe('ReputationService', () => {
  let service: ReputationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReputationService,
        {
          provide: Web3Service,
          useValue: {
            reputation: {
              write: { recordSuccess: jest.fn(), recordFailure: jest.fn() },
            },
          },
        },
      ],
    }).compile();

    service = module.get<ReputationService>(ReputationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
