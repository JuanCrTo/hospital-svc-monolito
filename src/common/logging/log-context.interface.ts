export interface LogContext {
  requestId: string
  ip: string | null
  actorUserId?: string | null
  tenantId?: string | null
  facilityId?: string | null
  isPlatformAdmin?: boolean
}
