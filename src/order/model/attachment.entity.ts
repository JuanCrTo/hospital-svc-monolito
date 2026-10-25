import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { Facility } from '../../facility/model/facility.entity'
import { UserEntity } from '../../user/model/user.entity'
import { ClinicalOrder } from './clinical-order.entity'
import { LabResult } from './lab-result.entity'
import { ImagingStudy } from './imaging-study.entity'

export type AttachmentCategory = 'order' | 'lab_result' | 'imaging'

@Entity('attachments')
@Index('idx_attachments_order', ['orderId', 'createdAt'])
@Index('uq_attachments_public_id', ['publicId'], { unique: true })
export class Attachment {
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

  @Column({ name: 'lab_result_id', type: 'uuid', nullable: true })
  labResultId: string | null

  @ManyToOne(() => LabResult, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'lab_result_id' })
  labResult: LabResult | null

  @Column({ name: 'imaging_study_id', type: 'uuid', nullable: true })
  imagingStudyId: string | null

  @ManyToOne(() => ImagingStudy, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'imaging_study_id' })
  imagingStudy: ImagingStudy | null

  @Column({ type: 'varchar', length: 20 })
  category: AttachmentCategory

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName: string

  @Column({ name: 'mime_type', type: 'varchar', length: 120 })
  mimeType: string

  @Column({ name: 'size_bytes', type: 'integer' })
  sizeBytes: number

  @Column({ name: 'checksum_sha256', type: 'char', length: 64 })
  checksumSha256: string

  @Column({ name: 'public_id', type: 'varchar', length: 255 })
  publicId: string

  @Column({ name: 'resource_type', type: 'varchar', length: 20 })
  resourceType: string

  @Column({ type: 'varchar', length: 20 })
  format: string

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy: string

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedByUser: UserEntity

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
