import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { GlobalErrorHandlerFilter } from './error/globalErrorHandler.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    rawBody: true,
    bodyParser: true,
  });
  app.enableCors();
  app.use(cookieParser());
  app.enableCors()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalErrorHandlerFilter())
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
