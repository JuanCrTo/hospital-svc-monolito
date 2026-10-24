import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { Facility } from '../../facility/model/facility.entity'
import { UserEntity } from '../../user/model/user.entity'
import { Encounter } from './encounter.entity'

const decimalTransformer = {
  to: (value: number | null | undefined): number | null | undefined => value,
  from: (value: string | null): number | null => (value === null ? null : Number(value))
}

@Entity('vital_signs')
@Index('idx_vital_signs_encounter', ['encounterId', 'measuredAt'])
export class VitalSign {
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

  @Column({ name: 'recorded_by', type: 'uuid' })
  recordedBy: string

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'recorded_by' })
  recorder: UserEntity

  @Column({ name: 'measured_at', type: 'timestamptz' })
  measuredAt: Date

  @Column({ type: 'numeric', precision: 4, scale: 1, nullable: true, transformer: decimalTransformer })
  temperature: number | null

  @Column({ type: 'smallint', nullable: true })
  systolic: number | null

  @Column({ type: 'smallint', nullable: true })
  diastolic: number | null

  @Column({ name: 'heart_rate', type: 'smallint', nullable: true })
  heartRate: number | null

  @Column({ name: 'respiratory_rate', type: 'smallint', nullable: true })
  respiratoryRate: number | null

  @Column({ name: 'oxygen_saturation', type: 'numeric', precision: 5, scale: 2, nullable: true, transformer: decimalTransformer })
  oxygenSaturation: number | null

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true, transformer: decimalTransformer })
  weight: number | null

  @Column({ type: 'numeric', precision: 5, scale: 1, nullable: true, transformer: decimalTransformer })
  height: number | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
