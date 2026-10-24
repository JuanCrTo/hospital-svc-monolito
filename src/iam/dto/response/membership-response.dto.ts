import { ApiProperty } from '@nestjs/swagger'

export class MembershipRoleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ format: 'uuid' })
  roleId: string

  @ApiProperty({ example: 'doctor' })
  roleCode: string

  @ApiProperty({ format: 'uuid', nullable: true })
  facilityId: string | null
}

export class MembershipFacilityResponseDto {
  @ApiProperty({ format: 'uuid' })
  facilityId: string

  @ApiProperty({ example: 'CENTRO' })
  facilityCode: string

  @ApiProperty({ enum: ['active', 'inactive'] })
  status: string
}

export class MembershipResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ format: 'uuid' })
  userId: string

  @ApiProperty({ example: 'user@example.com' })
  userEmail: string

  @ApiProperty({ enum: ['active', 'suspended', 'revoked'] })
  status: string

  @ApiProperty({ example: 1 })
  permissionsVersion: number

  @ApiProperty({ type: () => MembershipRoleResponseDto, isArray: true })
  roles: MembershipRoleResponseDto[]

  @ApiProperty({ type: () => MembershipFacilityResponseDto, isArray: true })
  facilities: MembershipFacilityResponseDto[]
}
