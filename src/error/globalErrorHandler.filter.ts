import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';

@Catch()
export class GlobalErrorHandlerFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (!exception) {
      Logger.error('Caught undefined exception!');
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Unknown error occurred',
        path: request?.url || 'unknown',
        method: request?.method || 'unknown',
      });
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal server error';
    let errorDetails: string | Record<string, unknown> | undefined = undefined;

    // ✅ Handle NestJS HTTP Exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (exception instanceof NotFoundException) {
        message = 'API Not Found';
      } else if (exception instanceof BadRequestException) {
        const res = exceptionResponse as
          | { message: string[]; error: string }
          | string;
        if (typeof res === 'string') {
          message = res;
        } else if (Array.isArray(res.message)) {
          // Extract validation errors from class validator
          message = res.message.map((msg) => `${msg}`)[0];
        } else {
          message = res.error || 'Bad Request';
        }
      } else {
        message =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as any)?.message || 'Http Exception occurred';
      }
    }

    // ✅ Handle Prisma Errors
    if (exception instanceof PrismaClientValidationError) {
      console.log('Prisma Client Validation Error: ', exception);
      message = 'Validation Error';
      errorDetails = exception.message;
      status = HttpStatus.BAD_REQUEST;
    } else if (exception instanceof PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        message = 'Duplicate Key Error';
        errorDetails = exception.meta ?? undefined;
        status = HttpStatus.BAD_REQUEST;
      }
    }

    response.status(status).json({
      success: false,
      message,
      statusCode: status,
      errorDetails,
      path: request?.url || 'unknown',
      method: request?.method || 'unknown',
    });

    Logger.error(
      `Exception caught at ${request.method} ${request.url}`,
      exception,
    );
  }
}
