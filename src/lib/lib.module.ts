import { Global, Module } from '@nestjs/common';
import { LibService } from './lib.service';

@Global()
@Module({
  providers: [LibService],
  exports: [LibService],
})
export class LibModule {}
