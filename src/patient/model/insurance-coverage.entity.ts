import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { PatientEntity } from './patient.entity'

@Entity('insurance_coverages')
@Unique('uq_insurance_coverages_tenant_provider_policy', ['tenantId', 'providerName', 'policyNumber'])
@Index('idx_insurance_coverages_patient', ['patientId'])
@Index('idx_insurance_coverages_tenant', ['tenantId'])
export class InsuranceCoverage {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string

  @ManyToOne(() => PatientEntity, patient => patient.insuranceCoverages, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity

  @Column({ name: 'provider_name', type: 'varchar', length: 160 })
  providerName: string

  @Column({ name: 'policy_number', type: 'varchar', length: 80 })
  policyNumber: string

  @Column({ name: 'plan_name', type: 'varchar', length: 120, nullable: true })
  planName: string | null

  @Column({ name: 'valid_from', type: 'date' })
  validFrom: string

  @Column({ name: 'valid_to', type: 'date', nullable: true })
  validTo: string | null

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date
}
