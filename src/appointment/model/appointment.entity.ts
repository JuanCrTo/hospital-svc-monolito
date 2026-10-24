import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { Facility } from '../../facility/model/facility.entity'
import { PatientEntity } from '../../patient/model/patient.entity'
import { UserEntity } from '../../user/model/user.entity'
import { ProviderSchedule } from './provider-schedule.entity'

export type AppointmentStatus = 'scheduled' | 'checked_in' | 'cancelled' | 'completed' | 'no_show'

@Entity('appointments')
@Index('idx_appointments_tenant_facility_start', ['tenantId', 'facilityId', 'startsAt'])
@Index('idx_appointments_patient', ['patientId', 'startsAt'])
@Index('idx_appointments_provider', ['providerUserId', 'startsAt'])
export class Appointment {
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

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string

  @ManyToOne(() => PatientEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity

  @Column({ name: 'provider_user_id', type: 'uuid' })
  providerUserId: string

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'provider_user_id' })
  provider: UserEntity

  @Column({ name: 'schedule_id', type: 'uuid', nullable: true })
  scheduleId: string | null

  @ManyToOne(() => ProviderSchedule, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'schedule_id' })
  schedule: ProviderSchedule | null

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date

  @Column({ name: 'ends_at', type: 'timestamptz' })
  endsAt: Date

  @Column({ type: 'varchar', length: 20, default: 'scheduled' })
  status: AppointmentStatus

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason: string | null

  @Column({ name: 'cancellation_reason', type: 'varchar', length: 500, nullable: true })
  cancellationReason: string | null

  @Column({ name: 'canceled_at', type: 'timestamptz', nullable: true })
  canceledAt: Date | null

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdByUser: UserEntity

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date
}
