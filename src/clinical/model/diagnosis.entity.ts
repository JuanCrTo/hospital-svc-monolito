import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { Facility } from '../../facility/model/facility.entity'
import { UserEntity } from '../../user/model/user.entity'
import { Encounter } from './encounter.entity'

export type DiagnosisType = 'primary' | 'secondary'

@Entity('diagnoses')
@Index('idx_diagnoses_encounter', ['encounterId', 'diagnosedAt'])
export class Diagnosis {
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

  @Column({ type: 'varchar', length: 20 })
  code: string

  @Column({ type: 'varchar', length: 500 })
  description: string

  @Column({ name: 'diagnosis_type', type: 'varchar', length: 20, default: 'secondary' })
  diagnosisType: DiagnosisType

  @Column({ name: 'diagnosed_by', type: 'uuid' })
  diagnosedBy: string

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'diagnosed_by' })
  diagnostician: UserEntity

  @Column({ name: 'diagnosed_at', type: 'timestamptz' })
  diagnosedAt: Date

  @Column({ name: 'amends_diagnosis_id', type: 'uuid', nullable: true })
  amendsDiagnosisId: string | null

  @ManyToOne(() => Diagnosis, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'amends_diagnosis_id' })
  amendsDiagnosis: Diagnosis | null

  @Column({ name: 'amendment_reason', type: 'varchar', length: 500, nullable: true })
  amendmentReason: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
