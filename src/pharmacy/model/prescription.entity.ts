import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { Facility } from '../../facility/model/facility.entity'
import { Encounter } from '../../clinical/model/encounter.entity'
import { PatientEntity } from '../../patient/model/patient.entity'
import { UserEntity } from '../../user/model/user.entity'
import { PrescriptionLine } from './prescription-line.entity'
@Entity('prescriptions')
@Index('idx_prescriptions_scope', ['tenantId', 'facilityId', 'encounterId'])
export class Prescription {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'tenant_id' }) tenant: Tenant
  @Column({ name: 'facility_id', type: 'uuid' }) facilityId: string
  @ManyToOne(() => Facility, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'facility_id' }) facility: Facility
  @Column({ name: 'encounter_id', type: 'uuid' }) encounterId: string
  @ManyToOne(() => Encounter, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'encounter_id' }) encounter: Encounter
  @Column({ name: 'patient_id', type: 'uuid' }) patientId: string
  @ManyToOne(() => PatientEntity, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'patient_id' }) patient: PatientEntity
  @Column({ name: 'prescribed_by', type: 'uuid' }) prescribedBy: string
  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'prescribed_by' }) prescriber: UserEntity
  @Column({ type: 'varchar', length: 1000, nullable: true }) instructions: string | null
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date
  @OneToMany(() => PrescriptionLine, line => line.prescription) lines: PrescriptionLine[]
}
