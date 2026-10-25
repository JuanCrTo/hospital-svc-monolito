import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { Facility } from '../../facility/model/facility.entity'
import { Admission } from './admission.entity'
import { UserEntity } from '../../user/model/user.entity'
@Entity('nursing_notes')
@Index('idx_nursing_notes_scope', ['tenantId', 'facilityId', 'admissionId', 'createdAt'])
export class NursingNote {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'tenant_id' }) tenant: Tenant
  @Column({ name: 'facility_id', type: 'uuid' }) facilityId: string
  @ManyToOne(() => Facility, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'facility_id' }) facility: Facility
  @Column({ name: 'admission_id', type: 'uuid' }) admissionId: string
  @ManyToOne(() => Admission, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'admission_id' }) admission: Admission
  @Column({ name: 'author_user_id', type: 'uuid' }) authorUserId: string
  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'author_user_id' }) author: UserEntity
  @Column({ type: 'text' }) content: string
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date
}
