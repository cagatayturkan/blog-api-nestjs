import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { GenericResponse } from '../interfaces/generic-response.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, GenericResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<GenericResponse<T>> {
    return next.handle().pipe(
      map(handlerData => {
        const httpResponse = context.switchToHttp().getResponse();
        const statusCode = httpResponse.statusCode;

        if (statusCode === HttpStatus.NO_CONTENT) {
          // For 204 No Content, Postman might show an empty body or a default message.
          // We are shaping it to our generic response for consistency if needed, 
          // or we could let it pass through as truly empty if that's preferred by client.
          // Here, we provide a success message.
          return {
            status: 'SUCCESS',
            message: 'Operation successful with no content to return.',
            // data: undefined // data is explicitly undefined here
          } as GenericResponse<T>; // Type assertion for clarity
        }

        // Check if the data from handler is for a paginated list
        // (i.e., it has 'data' and 'pagination' properties itself)
        if (
          typeof handlerData === 'object' &&
          handlerData !== null &&
          Object.prototype.hasOwnProperty.call(handlerData, 'data') &&
          Object.prototype.hasOwnProperty.call(handlerData, 'pagination')
        ) {
          return {
            status: 'SUCCESS',
            data: (handlerData as any).data, // The actual array of items
            pagination: (handlerData as any).pagination,
          } as GenericResponse<T>;
        }

        // For non-paginated successful responses (single items, create, update responses etc.)
        return {
          status: 'SUCCESS',
          data: handlerData,
        } as GenericResponse<T>; // Type assertion
      }),
      catchError(err => {
        const httpStatus = err instanceof HttpException ? err.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'An unexpected internal error occurred.'; // Default fallback message

        if (err instanceof HttpException) {
          const errorResponse = err.getResponse();
          if (typeof errorResponse === 'string') {
            message = errorResponse;
          } else if (typeof errorResponse === 'object' && errorResponse !== null) {
            // Standard NestJS validation pipe errors are often an object with a 'message' array
            const messages = (errorResponse as any).message;
            if (Array.isArray(messages)) {
              message = messages.join(', ');
            } else if (typeof messages === 'string') {
              message = messages;
            } else if (err.message) {
                message = err.message;
            }
          } else if (err.message) {
            message = err.message; // Fallback to error's own message if response is not structured as expected
          }
        } else if (err.message) {
          message = err.message; // For non-HttpException errors that have a message
        }
        
        // Bu kısım önemli: Yeni bir HttpException fırlatıyoruz ama
        // client'a giden HTTP status code'u orijinal hatanın status code'u olacak.
        // Response body'si ise bizim formatımızda olacak.
        throw new HttpException(
          {
            status: 'FAILED',
            message: message,
          } as GenericResponse<never>, // Use 'never' for data type in error response
          httpStatus,
        );
      }),
    );
  }
} 