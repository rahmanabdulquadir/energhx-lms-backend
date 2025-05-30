import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './main/user/user.module';
import { AuthModule } from './main/auth/auth.module';
import { UserController } from './main/user/user.controller';
import { UserService } from './main/user/user.service';
import { DeveloperModule } from './main/developer/developer.module';
import { ServerModule } from './main/server/server.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MailerService } from './utils/sendMail';
import { CountryModule } from './main/country/country.module';
import { ProgramModule } from './main/program/program.module';
import { CourseModule } from './main/course/course.module';
import { ModuleModule } from './main/module/module.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule,
    DeveloperModule,
    ServerModule,
    ConfigModule.forRoot({
      isGlobal: true, // This makes ConfigService available globally
    }),
    JwtModule.register({
      global: true, // This makes JwtService available globally
    }),
    CountryModule,
    ProgramModule,
    CourseModule,
    ModuleModule,
  ],
  controllers: [AppController, UserController],
  providers: [AppService, UserService, MailerService],
})
export class AppModule {}
