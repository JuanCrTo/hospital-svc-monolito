import { FacilityAssignment } from '../model/facility-assignment.entity'
import { MembershipRole } from '../model/membership-role.entity'
import { Membership } from '../model/membership.entity'
import { MembershipResponseDto } from '../dto/response/membership-response.dto'

export function mapMembershipToDto(
  membership: Membership,
  userEmail: string,
  roles: MembershipRole[],
  assignments: FacilityAssignment[]
): MembershipResponseDto {
  return {
    id: membership.id,
    userId: membership.userId,
    userEmail,
    status: membership.status,
    permissionsVersion: membership.permissionsVersion,
    roles: roles.map(role => ({
      id: role.id,
      roleId: role.roleId,
      roleCode: role.role?.code ?? '',
      facilityId: role.facilityId
    })),
    facilities: assignments.map(assignment => ({
      facilityId: assignment.facilityId,
      facilityCode: assignment.facility?.code ?? '',
      status: assignment.status
    }))
  }
}
