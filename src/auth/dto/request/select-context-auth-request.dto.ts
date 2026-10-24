import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsUUID } from 'class-validator'

export class SelectContextRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  facilityId?: string
}
