import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { getLogContext } from '../log-context.storage'
import { AuditAction, AuditLog } from './audit-log.entity'

export interface AuditRecord {
  action: AuditAction
  resourceType: string
  resourceId?: string | null
  actorUserId?: string | null
  tenantId?: string | null
  facilityId?: string | null
  ip?: string | null
  requestId?: string | null
  beforeSummary?: Record<string, unknown> | null
  afterSummary?: Record<string, unknown> | null
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>
  ) {}

  async record(entry: AuditRecord): Promise<void> {
    const context = getLogContext()

    await this.auditLogRepository.insert({
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId ?? null,
      actorUserId: entry.actorUserId ?? context?.actorUserId ?? null,
      tenantId: entry.tenantId ?? context?.tenantId ?? null,
      facilityId: entry.facilityId ?? context?.facilityId ?? null,
      ip: entry.ip ?? context?.ip ?? null,
      requestId: entry.requestId ?? context?.requestId ?? null,
      beforeSummary: entry.beforeSummary ?? null,
      afterSummary: entry.afterSummary ?? null
    })
  }
}
