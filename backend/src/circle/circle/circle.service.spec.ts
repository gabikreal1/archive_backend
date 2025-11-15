import { Test, TestingModule } from '@nestjs/testing';
import { CircleService } from './circle.service';

describe('CircleService', () => {
  let service: CircleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CircleService],
    }).compile();

    service = module.get<CircleService>(CircleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
