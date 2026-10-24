import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsUUID } from 'class-validator'

export class AssignRoleRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  roleId: string

  @ApiPropertyOptional({ format: 'uuid', description: 'Sede; omitir para rol tenant-wide' })
  @IsOptional()
  @IsUUID()
  facilityId?: string
}
