import { Test, TestingModule } from '@nestjs/testing';
import { BasicContentService } from './basic-content.service';

describe('BasicContentService', () => {
  let service: BasicContentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BasicContentService],
    }).compile();

    service = module.get<BasicContentService>(BasicContentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
