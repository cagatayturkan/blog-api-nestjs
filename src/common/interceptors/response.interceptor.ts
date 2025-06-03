import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GenericResponse } from '../interfaces/generic-response.interface';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, GenericResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<GenericResponse<T>> {
    return next.handle().pipe(
      map((handlerData) => {
        const httpResponse = context.switchToHttp().getResponse();
        const statusCode = httpResponse.statusCode;

        if (statusCode === HttpStatus.NO_CONTENT) {
          // For 204 No Content responses
          return {
            status: 'SUCCESS',
            message: 'Operation completed successfully',
          } as GenericResponse<T>;
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
            data: handlerData.data, // The actual array of items
            pagination: handlerData.pagination,
          } as GenericResponse<T>;
        }

        // For non-paginated successful responses (single items, create, update responses etc.)
        return {
          status: 'SUCCESS',
          data: handlerData,
        } as GenericResponse<T>;
      }),
    );
  }
}
