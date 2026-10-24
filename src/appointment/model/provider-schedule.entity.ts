import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { Facility } from '../../facility/model/facility.entity'
import { UserEntity } from '../../user/model/user.entity'

export type ProviderScheduleStatus = 'active' | 'inactive'

@Entity('provider_schedules')
@Unique('uq_provider_schedules_provider_slot', ['tenantId', 'facilityId', 'providerUserId', 'weekday', 'startTime'])
@Index('idx_provider_schedules_tenant_facility', ['tenantId', 'facilityId'])
@Index('idx_provider_schedules_provider', ['providerUserId'])
export class ProviderSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @Column({ name: 'facility_id', type: 'uuid' })
  facilityId: string

  @ManyToOne(() => Facility, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility

  @Column({ name: 'provider_user_id', type: 'uuid' })
  providerUserId: string

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'provider_user_id' })
  provider: UserEntity

  @Column({ type: 'smallint' })
  weekday: number

  @Column({ name: 'start_time', type: 'time' })
  startTime: string

  @Column({ name: 'end_time', type: 'time' })
  endTime: string

  @Column({ name: 'slot_minutes', type: 'smallint', default: 30 })
  slotMinutes: number

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: ProviderScheduleStatus

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date
}
