import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
// import { v4 as uuidv4 } from 'uuid'
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp()
    // const traceId = uuidv4()

    return next.handle().pipe(
      map(data => {
        const response = {
          timestamp: new Date().toISOString(),
          message: 'Operación realizada con éxito',
          success: true,
          statusCode: ctx.getResponse().statusCode ?? 200,
          data
          // details: null,
          // traceId
        }
        return response
      })
    )
  }
}
