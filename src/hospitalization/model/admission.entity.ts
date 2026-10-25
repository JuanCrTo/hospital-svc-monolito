import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { Facility } from '../../facility/model/facility.entity'
import { PatientEntity } from '../../patient/model/patient.entity'
import { Encounter } from '../../clinical/model/encounter.entity'
import { UserEntity } from '../../user/model/user.entity'
import { BedAssignment } from './bed-assignment.entity'
@Entity('admissions')
@Index('idx_admissions_scope_status', ['tenantId', 'facilityId', 'status'])
export class Admission {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'tenant_id' }) tenant: Tenant
  @Column({ name: 'facility_id', type: 'uuid' }) facilityId: string
  @ManyToOne(() => Facility, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'facility_id' }) facility: Facility
  @Column({ name: 'patient_id', type: 'uuid' }) patientId: string
  @ManyToOne(() => PatientEntity, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'patient_id' }) patient: PatientEntity
  @Column({ name: 'encounter_id', type: 'uuid' }) encounterId: string
  @ManyToOne(() => Encounter, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'encounter_id' }) encounter: Encounter
  @Column({ name: 'admitted_by', type: 'uuid' }) admittedBy: string
  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'admitted_by' }) admittedByUser: UserEntity
  @Column({ type: 'varchar', length: 20, default: 'active' }) status: 'active' | 'discharged'
  @Column({ name: 'admitted_at', type: 'timestamptz' }) admittedAt: Date
  @Column({ name: 'discharged_at', type: 'timestamptz', nullable: true }) dischargedAt: Date | null
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date
  @OneToMany(() => BedAssignment, assignment => assignment.admission) assignments: BedAssignment[]
}
