import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { Facility } from '../../facility/model/facility.entity'
import { Admission } from './admission.entity'
import { Bed } from './bed.entity'
import { UserEntity } from '../../user/model/user.entity'
@Entity('bed_assignments')
@Index('idx_bed_assignments_active_bed', ['tenantId', 'facilityId', 'bedId', 'releasedAt'])
export class BedAssignment {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'tenant_id' }) tenant: Tenant
  @Column({ name: 'facility_id', type: 'uuid' }) facilityId: string
  @ManyToOne(() => Facility, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'facility_id' }) facility: Facility
  @Column({ name: 'admission_id', type: 'uuid' }) admissionId: string
  @ManyToOne(() => Admission, admission => admission.assignments, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'admission_id' })
  admission: Admission
  @Column({ name: 'bed_id', type: 'uuid' }) bedId: string
  @ManyToOne(() => Bed, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'bed_id' }) bed: Bed
  @Column({ name: 'assigned_by', type: 'uuid' }) assignedBy: string
  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'assigned_by' }) assignedByUser: UserEntity
  @Column({ name: 'assigned_at', type: 'timestamptz' }) assignedAt: Date
  @Column({ name: 'released_at', type: 'timestamptz', nullable: true }) releasedAt: Date | null
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date
}
