import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { IStandardizeResponseOptions } from '../interfaces/standardize-response-options.interface';

@Injectable()
export class StandardizeResponseInterceptor implements NestInterceptor {
  constructor(private readonly options: IStandardizeResponseOptions = {}) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const defaultMessage = this.options.defaultMessage ?? 'Success';
    const defaultData = this.options.defaultData ?? null;

    return next.handle().pipe(
      map((handlerResult) => {
        let message = defaultMessage;
        let data = defaultData;

        if (
          handlerResult !== null &&
          handlerResult !== undefined &&
          typeof handlerResult === 'object' &&
          !Array.isArray(handlerResult) &&
          ('data' in handlerResult || 'message' in handlerResult)
        ) {
          message =
            handlerResult.message !== undefined
              ? handlerResult.message
              : defaultMessage;
          data =
            handlerResult.data !== undefined ? handlerResult.data : defaultData;
        } else if (handlerResult === null || handlerResult === undefined) {
          data = defaultData;
        } else {
          data = handlerResult;
        }

        return {
          message,
          data,
        };
      }),
    );
  }
}
