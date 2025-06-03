import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    let message = 'An unexpected error occurred';

    // Extract message from exception
    const exceptionResponse = exception.getResponse();
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const errorObject = exceptionResponse as any;

      // Handle validation errors (array of messages)
      if (Array.isArray(errorObject.message)) {
        message = errorObject.message.join(', ');
      } else if (typeof errorObject.message === 'string') {
        message = errorObject.message;
      } else if (errorObject.error) {
        message = errorObject.error;
      }
    }

    // Standardized error response format
    const errorResponse = {
      status: 'FAILED',
      message: message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorResponse);
  }
}
