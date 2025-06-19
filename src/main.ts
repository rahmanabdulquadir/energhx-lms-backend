import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { GlobalErrorHandlerFilter } from './error/globalErrorHandler.filter';
import { ValidationPipe } from '@nestjs/common';
import { UserSeeder } from './seed/admin.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Apply raw body only to Stripe webhook route
  app.use(
    '/payment/webhook',
    express.raw({ type: 'application/json' }),
  );

  // ✅ Apply normal body parser for other routes
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(cookieParser());
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalErrorHandlerFilter());

  const seeder = app.get(UserSeeder);
  await seeder.seedAdmin();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
