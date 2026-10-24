import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

export type AuditAction = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'STATE_CHANGE' | 'EXPORT' | 'PRINT'

@Entity('audit_logs')
@Index('idx_audit_logs_tenant_timestamp', ['tenantId', 'timestamp'])
@Index('idx_audit_logs_actor_user_id', ['actorUserId'])
@Index('idx_audit_logs_resource', ['resourceType', 'resourceId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId: string | null

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null

  @Column({ name: 'facility_id', type: 'uuid', nullable: true })
  facilityId: string | null

  @Column({ type: 'varchar', length: 50 })
  action: AuditAction

  @Column({ name: 'resource_type', type: 'varchar', length: 100 })
  resourceType: string

  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId: string | null

  @CreateDateColumn({ name: 'timestamp', type: 'timestamptz' })
  timestamp: Date

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip: string | null

  @Column({ name: 'request_id', type: 'uuid', nullable: true })
  requestId: string | null

  @Column({ name: 'before_summary', type: 'jsonb', nullable: true })
  beforeSummary: Record<string, unknown> | null

  @Column({ name: 'after_summary', type: 'jsonb', nullable: true })
  afterSummary: Record<string, unknown> | null
}
