import { Test, TestingModule } from '@nestjs/testing';
import { LibService } from './lib.service';

describe('LibService', () => {
  let service: LibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LibService],
    }).compile();

    service = module.get<LibService>(LibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
