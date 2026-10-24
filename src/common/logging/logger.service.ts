import { Injectable } from '@nestjs/common'
import { LogLevel } from './log-level.enum'
import { LogType } from './log-type.enum'
import { getLogContext } from './log-context.storage'

const SENSITIVE_KEY = /password|token|authorization|secret|api[_-]?key|cookie/i
const MAX_DEPTH = 5

const sanitize = (value: unknown, depth = 0): unknown => {
  if (value === null || value === undefined) return value
  if (depth >= MAX_DEPTH) return '[truncated]'
  if (Array.isArray(value)) return value.map(item => sanitize(item, depth + 1))
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, item]) => {
      acc[key] = SENSITIVE_KEY.test(key) ? '[redacted]' : sanitize(item, depth + 1)
      return acc
    }, {})
  }
  return value
}

@Injectable()
export class LoggerService {
  debug(message: string, metadata: Record<string, unknown> = {}): void {
    this.write(LogLevel.DEBUG, message, metadata, LogType.APPLICATION)
  }

  info(message: string, metadata: Record<string, unknown> = {}): void {
    this.write(LogLevel.INFO, message, metadata, LogType.APPLICATION)
  }

  warn(message: string, metadata: Record<string, unknown> = {}): void {
    this.write(LogLevel.WARN, message, metadata, LogType.APPLICATION)
  }

  error(message: string, metadata: Record<string, unknown> = {}): void {
    this.write(LogLevel.ERROR, message, metadata, LogType.APPLICATION)
  }

  request(message: string, metadata: Record<string, unknown> = {}): void {
    this.write(LogLevel.INFO, message, metadata, LogType.REQUEST)
  }

  private write(level: LogLevel, message: string, metadata: Record<string, unknown>, type: LogType): void {
    const context = getLogContext()
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      type,
      message,
      request_id: context?.requestId ?? null,
      ip: context?.ip ?? null,
      actor_user_id: context?.actorUserId ?? null,
      tenant_id: context?.tenantId ?? null,
      facility_id: context?.facilityId ?? null,
      ...(sanitize(metadata) as Record<string, unknown>)
    }
    const line = JSON.stringify(entry)
    if (level === LogLevel.ERROR) {
      process.stderr.write(`${line}\n`)
      return
    }
    process.stdout.write(`${line}\n`)
  }
}
