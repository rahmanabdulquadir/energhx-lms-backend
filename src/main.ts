import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { GlobalErrorHandlerFilter } from './error/globalErrorHandler.filter';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors()
  app.use('/webhook/stripe', bodyParser.raw({ type: 'application/json' }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalErrorHandlerFilter())
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
