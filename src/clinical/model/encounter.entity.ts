import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { Facility } from '../../facility/model/facility.entity'
import { PatientEntity } from '../../patient/model/patient.entity'
import { UserEntity } from '../../user/model/user.entity'
import { Appointment } from '../../appointment/model/appointment.entity'
import { ClinicalNote } from './clinical-note.entity'
import { VitalSign } from './vital-sign.entity'
import { Diagnosis } from './diagnosis.entity'

export type EncounterStatus = 'open' | 'closed'

@Entity('encounters')
@Unique('uq_encounters_tenant_appointment', ['tenantId', 'appointmentId'])
@Index('idx_encounters_tenant_facility_opened', ['tenantId', 'facilityId', 'openedAt'])
@Index('idx_encounters_patient', ['patientId', 'openedAt'])
export class Encounter {
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

  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId: string | null

  @ManyToOne(() => Appointment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason: string | null

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: EncounterStatus

  @Column({ name: 'opened_at', type: 'timestamptz' })
  openedAt: Date

  @Column({ name: 'opened_by', type: 'uuid' })
  openedBy: string

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'opened_by' })
  openedByUser: UserEntity

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null

  @Column({ name: 'closed_by', type: 'uuid', nullable: true })
  closedBy: string | null

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'closed_by' })
  closedByUser: UserEntity | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date

  @OneToMany(() => ClinicalNote, note => note.encounter)
  notes: ClinicalNote[]

  @OneToMany(() => VitalSign, vitalSign => vitalSign.encounter)
  vitalSigns: VitalSign[]

  @OneToMany(() => Diagnosis, diagnosis => diagnosis.encounter)
  diagnoses: Diagnosis[]
}
