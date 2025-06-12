import { Test, TestingModule } from '@nestjs/testing';
import { BasicContentController } from './basic-content.controller';

describe('BasicContentController', () => {
  let controller: BasicContentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BasicContentController],
    }).compile();

    controller = module.get<BasicContentController>(BasicContentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
