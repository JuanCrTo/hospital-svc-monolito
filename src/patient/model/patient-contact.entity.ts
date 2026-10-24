import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { PatientEntity } from './patient.entity'

export type PatientContactType = 'phone' | 'email' | 'address'

@Entity('patient_contacts')
@Unique('uq_patient_contacts_tenant_patient_type_value', ['tenantId', 'patientId', 'type', 'value'])
@Index('idx_patient_contacts_patient', ['patientId'])
@Index('idx_patient_contacts_tenant', ['tenantId'])
export class PatientContact {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string

  @ManyToOne(() => PatientEntity, patient => patient.contacts, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity

  @Column({ type: 'varchar', length: 20 })
  type: PatientContactType

  @Column({ type: 'varchar', length: 255 })
  value: string

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
