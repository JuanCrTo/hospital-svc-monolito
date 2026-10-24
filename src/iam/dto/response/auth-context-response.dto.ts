import { ApiProperty } from '@nestjs/swagger'

export class AuthContextResponseDto {
  @ApiProperty({ format: 'uuid' })
  tenantId: string

  @ApiProperty({ format: 'uuid', nullable: true })
  facilityId: string | null

  @ApiProperty({ example: 1 })
  permissionsVersion: number
}
