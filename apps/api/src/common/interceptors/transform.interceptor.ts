import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  order?: unknown;
  orders?: unknown;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((payload) => {
        if (
          payload &&
          typeof payload === 'object' &&
          'success' in payload &&
          'data' in payload
        ) {
          const typed = payload as ApiResponse<T>;
          return {
            success: typed.success,
            data: typed.data,
            message: typed.message ?? 'OK',
            ...(typed.order !== undefined ? { order: typed.order } : {}),
            ...(typed.orders !== undefined ? { orders: typed.orders } : {}),
          };
        }

        if (payload && typeof payload === 'object' && 'data' in payload) {
          const wrapped = payload as {
            message?: string;
            data: T;
            order?: unknown;
            orders?: unknown;
          };
          return {
            success: true,
            data: wrapped.data,
            message: wrapped.message ?? 'OK',
            ...(wrapped.order !== undefined ? { order: wrapped.order } : {}),
            ...(wrapped.orders !== undefined ? { orders: wrapped.orders } : {}),
          };
        }

        return {
          success: true,
          data: payload as T,
          message: 'OK',
        };
      }),
    );
  }
}
