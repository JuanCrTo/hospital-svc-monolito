import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Facility } from '../../facility/model/facility.entity'
import { Membership } from './membership.entity'
import { Role } from './role.entity'

@Entity('membership_roles')
@Index('uq_membership_roles_tenant_wide', ['membershipId', 'roleId'], {
  unique: true,
  where: '"facility_id" IS NULL'
})
@Index('uq_membership_roles_facility', ['membershipId', 'roleId', 'facilityId'], {
  unique: true,
  where: '"facility_id" IS NOT NULL'
})
@Index('idx_membership_roles_membership_id', ['membershipId'])
export class MembershipRole {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'membership_id', type: 'uuid' })
  membershipId: string

  @ManyToOne(() => Membership, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'membership_id' })
  membership: Membership

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string

  @ManyToOne(() => Role, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'role_id' })
  role: Role

  @Column({ name: 'facility_id', type: 'uuid', nullable: true })
  facilityId: string | null

  @ManyToOne(() => Facility, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
