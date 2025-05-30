import { Catch, ExceptionFilter, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class SentryErrorFilter extends BaseExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    // Only capture exceptions with status code 500 or higher
    let shouldCapture = true;
    
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      shouldCapture = status >= HttpStatus.INTERNAL_SERVER_ERROR; // 500 and above
    }

    if (shouldCapture) {
      // Use Sentry to capture the exception manually
      Sentry.captureException(exception);
    }

    // Let the base filter handle the response
    super.catch(exception, host);
  }
} 