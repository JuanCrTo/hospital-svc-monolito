import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { PatientEntity } from './patient.entity'

const decimalTransformer = {
  to: (value: number | null | undefined): number | null | undefined => value,
  from: (value: string | null): number | null => (value === null ? null : Number(value))
}

@Entity('patient_location_history')
@Index('idx_patient_location_history_patient', ['patientId', 'updatedAt'])
@Index('idx_patient_location_history_tenant', ['tenantId'])
export class PatientLocationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string

  @ManyToOne(() => PatientEntity, patient => patient.locationHistory, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity

  @Column({ type: 'varchar', length: 500 })
  location: string

  @Column({
    type: 'numeric',
    precision: 9,
    scale: 6,
    nullable: true,
    transformer: decimalTransformer
  })
  latitude: number | null

  @Column({
    type: 'numeric',
    precision: 9,
    scale: 6,
    nullable: true,
    transformer: decimalTransformer
  })
  longitude: number | null

  @CreateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date
}
