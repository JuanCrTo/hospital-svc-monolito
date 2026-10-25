import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { Facility } from '../../facility/model/facility.entity'
import { NursingNote } from './nursing-note.entity'
import { UserEntity } from '../../user/model/user.entity'
@Entity('nursing_note_amendments')
@Index('idx_nursing_note_amendments_scope', ['tenantId', 'facilityId', 'nursingNoteId', 'createdAt'])
export class NursingNoteAmendment {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'tenant_id' }) tenant: Tenant
  @Column({ name: 'facility_id', type: 'uuid' }) facilityId: string
  @ManyToOne(() => Facility, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'facility_id' }) facility: Facility
  @Column({ name: 'nursing_note_id', type: 'uuid' }) nursingNoteId: string
  @ManyToOne(() => NursingNote, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'nursing_note_id' }) nursingNote: NursingNote
  @Column({ name: 'author_user_id', type: 'uuid' }) authorUserId: string
  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'author_user_id' }) author: UserEntity
  @Column({ type: 'text' }) content: string
  @Column({ type: 'varchar', length: 500 }) reason: string
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date
}
