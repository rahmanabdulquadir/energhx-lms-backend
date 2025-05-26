import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { LibModule } from 'src/lib/lib.module';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from 'src/utils/sendMail';

@Module({
  imports: [LibModule, JwtService, ConfigService, MailerService],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
