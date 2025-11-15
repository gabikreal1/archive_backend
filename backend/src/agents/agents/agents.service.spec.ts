import { Test, TestingModule } from '@nestjs/testing';
import { AgentsService } from './agents.service';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SergbotTaskEntity } from '../../entities/sergbot-task.entity';

describe('AgentsService', () => {
  let service: AgentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        {
          provide: ConfigService,
          useValue: {
            get: () => undefined,
          },
        },
        {
          provide: getRepositoryToken(SergbotTaskEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
