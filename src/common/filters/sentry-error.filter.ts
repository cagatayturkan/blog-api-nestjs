import { Catch, ExceptionFilter, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class SentryErrorFilter extends BaseExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    console.log('🚨 SentryErrorFilter caught exception:', exception);
    
    // Only capture exceptions with status code 500 or higher
    let shouldCapture = true;
    
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      shouldCapture = status >= HttpStatus.INTERNAL_SERVER_ERROR; // 500 and above
      console.log(`📊 HttpException status: ${status}, shouldCapture: ${shouldCapture}`);
    } else {
      console.log('⚡ Non-HttpException error, will capture to Sentry');
    }

    if (shouldCapture) {
      console.log('📤 Sending to Sentry...');
      // Use Sentry to capture the exception manually
      Sentry.captureException(exception);
      console.log('✅ Sent to Sentry!');
    } else {
      console.log('❌ Not sending to Sentry (status < 500)');
    }

    // Let the base filter handle the response
    super.catch(exception, host);
  }
} 