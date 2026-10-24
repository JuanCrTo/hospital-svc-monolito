import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { Facility } from '../../facility/model/facility.entity'
import { Membership } from './membership.entity'

export type FacilityAssignmentStatus = 'active' | 'inactive'

@Entity('facility_assignments')
@Unique('uq_facility_assignments_membership_facility', ['membershipId', 'facilityId'])
@Index('idx_facility_assignments_membership_id', ['membershipId'])
@Index('idx_facility_assignments_facility_id', ['facilityId'])
export class FacilityAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'membership_id', type: 'uuid' })
  membershipId: string

  @ManyToOne(() => Membership, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'membership_id' })
  membership: Membership

  @Column({ name: 'facility_id', type: 'uuid' })
  facilityId: string

  @ManyToOne(() => Facility, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: FacilityAssignmentStatus

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
