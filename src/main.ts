import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { GlobalErrorHandlerFilter } from './error/globalErrorHandler.filter';
import { ValidationPipe } from '@nestjs/common';
import { UserSeeder } from './seed/admin.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Attach raw body only for Stripe webhook requests
  // app.use(
  //   express.json({
  //     verify: (req: any, res, buf) => {
  //       if (req.headers['stripe-signature']) {
  //         req.rawBody = buf;
  //       }
  //     },
  //   }),
  // );

  app.use('/payment/webhook', express.raw({ type: 'application/json' }));
 

  app.use(cookieParser());
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalErrorHandlerFilter());
  const seeder = app.get(UserSeeder);
  await seeder.seedAdmin();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
