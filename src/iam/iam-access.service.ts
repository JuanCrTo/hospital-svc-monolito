import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { FacilityAssignment } from './model/facility-assignment.entity'
import { MembershipRole } from './model/membership-role.entity'
import { Membership } from './model/membership.entity'

export interface ResolvedAccess {
  membership: Membership
  permissions: Set<string>
}

@Injectable()
export class IamAccessService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(MembershipRole)
    private readonly membershipRoleRepository: Repository<MembershipRole>,
    @InjectRepository(FacilityAssignment)
    private readonly facilityAssignmentRepository: Repository<FacilityAssignment>
  ) {}

  async resolve(userId: string, tenantId: string, facilityId: string | null): Promise<ResolvedAccess | null> {
    const membership = await this.membershipRepository.findOne({
      where: { userId, tenantId, status: 'active' }
    })
    if (!membership) return null

    if (facilityId) {
      const assignment = await this.facilityAssignmentRepository.findOne({
        where: { membershipId: membership.id, facilityId, status: 'active' }
      })
      if (!assignment) return null
    }

    const codes = await this.membershipRoleRepository
      .createQueryBuilder('mr')
      .innerJoin('mr.role', 'role')
      .innerJoin('role_permissions', 'rp', 'rp.role_id = role.id')
      .innerJoin('permissions', 'p', 'p.id = rp.permission_id')
      .select('DISTINCT p.code', 'code')
      .where('mr.membership_id = :membershipId', { membershipId: membership.id })
      .andWhere('role.status = :roleStatus', { roleStatus: 'active' })
      .andWhere(facilityId ? '(mr.facility_id IS NULL OR mr.facility_id = :facilityId)' : 'mr.facility_id IS NULL', facilityId ? { facilityId } : {})
      .getRawMany<{ code: string }>()

    return {
      membership,
      permissions: new Set(codes.map(row => row.code))
    }
  }
}
