import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { Facility } from '../../facility/model/facility.entity'
import { UserEntity } from '../../user/model/user.entity'
import { ClinicalOrder } from './clinical-order.entity'

export type LabResultInterpretation = 'normal' | 'abnormal' | 'critical' | 'unknown'
export type LabResultStatus = 'preliminary' | 'final' | 'corrected'

@Entity('lab_results')
@Index('idx_lab_results_order', ['orderId', 'reportedAt'])
export class LabResult {
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

  @Column({ name: 'analyte_code', type: 'varchar', length: 40 })
  analyteCode: string

  @Column({ name: 'analyte_name', type: 'varchar', length: 255 })
  analyteName: string

  @Column({ type: 'text' })
  value: string

  @Column({ type: 'varchar', length: 40, nullable: true })
  unit: string | null

  @Column({ name: 'reference_range', type: 'varchar', length: 120, nullable: true })
  referenceRange: string | null

  @Column({ type: 'varchar', length: 20, default: 'unknown' })
  interpretation: LabResultInterpretation

  @Column({ type: 'varchar', length: 20, default: 'final' })
  status: LabResultStatus

  @Column({ name: 'reported_by', type: 'uuid' })
  reportedBy: string

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reported_by' })
  reportedByUser: UserEntity

  @Column({ name: 'reported_at', type: 'timestamptz' })
  reportedAt: Date

  @Column({ name: 'amends_result_id', type: 'uuid', nullable: true })
  amendsResultId: string | null

  @ManyToOne(() => LabResult, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'amends_result_id' })
  amendsResult: LabResult | null

  @Column({ name: 'amendment_reason', type: 'varchar', length: 500, nullable: true })
  amendmentReason: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
