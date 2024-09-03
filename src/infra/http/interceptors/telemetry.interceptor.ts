import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { context, trace } from '@opentelemetry/api';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class TelemetryInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = _context.switchToHttp().getRequest();
    const span = trace.getSpan(context.active());

    if (span) {
      span.setAttribute('http.request_body', JSON.stringify(request.body));
      span.setAttribute(
        'http.request_headers',
        JSON.stringify(request.headers),
      );
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          if (span) {
            span.setAttribute('http.response_body', JSON.stringify(data));
          }
        },
        error: (error) => {
          if (span) {
            span.setAttribute('http.error', JSON.stringify(error));
          }
        },
      }),
    );
  }
}
