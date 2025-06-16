import { Test, TestingModule } from '@nestjs/testing';
import { GradingController } from './grading.controller';

describe('GradingController', () => {
  let controller: GradingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradingController],
    }).compile();

    controller = module.get<GradingController>(GradingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
