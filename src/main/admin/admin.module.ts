import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MailerService } from 'src/utils/sendMail';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [AdminController],
  providers: [AdminService, JwtService, ConfigService, MailerService]
})
export class AdminModule {}
