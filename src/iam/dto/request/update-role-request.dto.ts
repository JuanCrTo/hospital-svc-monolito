import { ApiPropertyOptional } from '@nestjs/swagger'
import { ArrayUnique, IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateRoleRequestDto {
  @ApiPropertyOptional({ example: 'Médico general' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string

  @ApiPropertyOptional({ example: 'Atención médica general' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string

  @ApiPropertyOptional({ enum: ['active', 'inactive'], example: 'active' })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive'

  @ApiPropertyOptional({ example: ['patient:read', 'clinical:read'], type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissions?: string[]
}
