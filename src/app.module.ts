import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './main/user/user.module';
import { AuthModule } from './main/auth/auth.module';
import { UserController } from './main/user/user.controller';
import { UserService } from './main/user/user.service';

@Module({
  imports: [PrismaModule, UserModule, AuthModule],
  controllers: [AppController, UserController],
  providers: [AppService, UserService],
})
export class AppModule {}
