import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { PatientEntity } from './patient.entity'

export type PatientIdentifierType = 'national_id' | 'passport' | 'foreign_id' | 'other'

@Entity('patient_identifiers')
@Unique('uq_patient_identifiers_tenant_type_value', ['tenantId', 'type', 'value'])
@Index('idx_patient_identifiers_patient', ['patientId'])
@Index('idx_patient_identifiers_tenant', ['tenantId'])
export class PatientIdentifier {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string

  @ManyToOne(() => PatientEntity, patient => patient.identifiers, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity

  @Column({ type: 'varchar', length: 30 })
  type: PatientIdentifierType

  @Column({ type: 'varchar', length: 120 })
  value: string

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
