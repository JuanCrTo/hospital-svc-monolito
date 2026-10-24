import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { Facility } from '../../facility/model/facility.entity'
import { UserEntity } from '../../user/model/user.entity'
import { Encounter } from './encounter.entity'

export type ClinicalNoteType = 'evolution' | 'admission' | 'discharge'

@Entity('clinical_notes')
@Index('idx_clinical_notes_encounter', ['encounterId', 'createdAt'])
export class ClinicalNote {
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

  @Column({ name: 'author_user_id', type: 'uuid' })
  authorUserId: string

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'author_user_id' })
  author: UserEntity

  @Column({ name: 'note_type', type: 'varchar', length: 20 })
  noteType: ClinicalNoteType

  @Column({ type: 'text' })
  content: string

  @Column({ name: 'amends_note_id', type: 'uuid', nullable: true })
  amendsNoteId: string | null

  @ManyToOne(() => ClinicalNote, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'amends_note_id' })
  amendsNote: ClinicalNote | null

  @Column({ name: 'amendment_reason', type: 'varchar', length: 500, nullable: true })
  amendmentReason: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
