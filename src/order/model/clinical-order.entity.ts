import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { Facility } from '../../facility/model/facility.entity'
import { PatientEntity } from '../../patient/model/patient.entity'
import { UserEntity } from '../../user/model/user.entity'
import { Encounter } from '../../clinical/model/encounter.entity'
import { LabResult } from './lab-result.entity'
import { ImagingStudy } from './imaging-study.entity'
import { Attachment } from './attachment.entity'

export type ClinicalOrderType = 'lab' | 'imaging'
export type ClinicalOrderPriority = 'routine' | 'urgent' | 'stat'
export type ClinicalOrderStatus = 'requested' | 'in_progress' | 'completed' | 'cancelled'

@Entity('clinical_orders')
@Index('idx_clinical_orders_tenant_facility_status', ['tenantId', 'facilityId', 'status'])
@Index('idx_clinical_orders_patient_requested', ['patientId', 'requestedAt'])
@Index('idx_clinical_orders_encounter', ['encounterId', 'requestedAt'])
export class ClinicalOrder {
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

  @Column({ name: 'encounter_id', type: 'uuid' })
  encounterId: string

  @ManyToOne(() => Encounter, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'encounter_id' })
  encounter: Encounter

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string

  @ManyToOne(() => PatientEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity

  @Column({ name: 'ordered_by', type: 'uuid' })
  orderedBy: string

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ordered_by' })
  orderedByUser: UserEntity

  @Column({ name: 'order_type', type: 'varchar', length: 20 })
  orderType: ClinicalOrderType

  @Column({ type: 'varchar', length: 40 })
  code: string

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'varchar', length: 20, default: 'routine' })
  priority: ClinicalOrderPriority

  @Column({ type: 'varchar', length: 20, default: 'requested' })
  status: ClinicalOrderStatus

  @Column({ name: 'clinical_notes', type: 'text', nullable: true })
  clinicalNotes: string | null

  @Column({ name: 'requested_at', type: 'timestamptz' })
  requestedAt: Date

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null

  @Column({ name: 'cancelled_by', type: 'uuid', nullable: true })
  cancelledBy: string | null

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cancelled_by' })
  cancelledByUser: UserEntity | null

  @Column({ name: 'cancel_reason', type: 'varchar', length: 500, nullable: true })
  cancelReason: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date

  @OneToMany(() => LabResult, result => result.order)
  labResults: LabResult[]

  @OneToMany(() => ImagingStudy, study => study.order)
  imagingStudies: ImagingStudy[]

  @OneToMany(() => Attachment, attachment => attachment.order)
  attachments: Attachment[]
}
