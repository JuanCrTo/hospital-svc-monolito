import { ApiProperty } from '@nestjs/swagger'

export class PermissionGrantResponseDto {
  @ApiProperty({ example: 'patient:read' })
  permission: string

  @ApiProperty({ format: 'uuid', nullable: true, description: 'null si el permiso es tenant-wide' })
  facilityId: string | null
}

export class ResolvedPermissionsResponseDto {
  @ApiProperty({ type: [String], example: ['tenant:read', 'patient:read'] })
  permissions: string[]

  @ApiProperty({ type: () => PermissionGrantResponseDto, isArray: true })
  grants: PermissionGrantResponseDto[]
}
