import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuditLog } from './audit/audit-log.entity'
import { AuditService } from './audit/audit.service'
import { LogInterceptor } from './log.interceptor'
import { LogMiddleware } from './log.middleware'
import { LoggerService } from './logger.service'

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [LoggerService, AuditService, { provide: APP_INTERCEPTOR, useClass: LogInterceptor }],
  exports: [LoggerService, AuditService]
})
export class LoggerModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LogMiddleware).forRoutes('*')
  }
}
