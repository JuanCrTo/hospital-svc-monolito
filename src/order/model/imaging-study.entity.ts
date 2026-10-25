import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { Facility } from '../../facility/model/facility.entity'
import { UserEntity } from '../../user/model/user.entity'
import { ClinicalOrder } from './clinical-order.entity'

export type ImagingStudyStatus = 'preliminary' | 'final' | 'corrected'

@Entity('imaging_studies')
@Index('idx_imaging_studies_order', ['orderId', 'reportedAt'])
export class ImagingStudy {
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

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string

  @ManyToOne(() => ClinicalOrder, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id' })
  order: ClinicalOrder

  @Column({ name: 'study_type', type: 'varchar', length: 120 })
  studyType: string

  @Column({ type: 'varchar', length: 40, nullable: true })
  modality: string | null

  @Column({ name: 'body_site', type: 'varchar', length: 120, nullable: true })
  bodySite: string | null

  @Column({ type: 'text' })
  findings: string

  @Column({ type: 'text', nullable: true })
  impression: string | null

  @Column({ name: 'performed_at', type: 'timestamptz' })
  performedAt: Date

  @Column({ type: 'varchar', length: 20, default: 'final' })
  status: ImagingStudyStatus

  @Column({ name: 'reported_by', type: 'uuid' })
  reportedBy: string

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reported_by' })
  reportedByUser: UserEntity

  @Column({ name: 'reported_at', type: 'timestamptz' })
  reportedAt: Date

  @Column({ name: 'amends_study_id', type: 'uuid', nullable: true })
  amendsStudyId: string | null

  @ManyToOne(() => ImagingStudy, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'amends_study_id' })
  amendsStudy: ImagingStudy | null

  @Column({ name: 'amendment_reason', type: 'varchar', length: 500, nullable: true })
  amendmentReason: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
