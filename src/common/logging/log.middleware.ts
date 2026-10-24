import { randomUUID } from 'crypto'
import { Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { logContextStorage } from './log-context.storage'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const resolveRequestId = (header: string | string[] | undefined): string => {
  const candidate = Array.isArray(header) ? header[0] : header
  return candidate && UUID_PATTERN.test(candidate) ? candidate : randomUUID()
}

const resolveIp = (request: Request): string | null => {
  const forwarded = request.headers['x-forwarded-for']
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]
  return forwardedIp?.trim() || request.ip || request.socket?.remoteAddress || null
}

@Injectable()
export class LogMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const requestId = resolveRequestId(request.headers['x-request-id'])
    response.setHeader('x-request-id', requestId)

    logContextStorage.run({ requestId, ip: resolveIp(request) }, () => next())
  }
}
