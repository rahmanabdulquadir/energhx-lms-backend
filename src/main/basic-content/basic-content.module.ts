import { Module } from '@nestjs/common';
import { BasicContentController } from './basic-content.controller';
import { BasicContentService } from './basic-content.service';

@Module({
  controllers: [BasicContentController],
  providers: [BasicContentService]
})
export class BasicContentModule {}
