import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Request, Response } from 'express'
import { Observable, catchError, tap, throwError } from 'rxjs'
import { LoggerService } from './logger.service'

@Injectable()
export class LogInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp()
    const request = http.getRequest<Request>()
    const response = http.getResponse<Response>()
    const startedAt = process.hrtime.bigint()
    const path = request.originalUrl.split('?')[0]

    const durationMs = (): number => Number(process.hrtime.bigint() - startedAt) / 1_000_000

    return next.handle().pipe(
      tap(() => {
        this.logger.request('request.completed', {
          method: request.method,
          path,
          status_code: response.statusCode,
          duration_ms: Math.round(durationMs() * 100) / 100
        })
      }),
      catchError(error => {
        this.logger.error('request.failed', {
          method: request.method,
          path,
          status_code: error?.status ?? error?.statusCode ?? 500,
          error_name: error?.name ?? 'Error',
          duration_ms: Math.round(durationMs() * 100) / 100
        })
        return throwError(() => error)
      })
    )
  }
}
