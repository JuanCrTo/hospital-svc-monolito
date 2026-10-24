import { Type } from 'class-transformer'
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export const TENANT_STATUSES = ['active', 'inactive', 'suspended'] as const

export class InitialFacilityRequestDto {
  @ApiProperty({ example: 'Sede Centro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string

  @ApiProperty({ example: 'CENTRO' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string

  @ApiPropertyOptional({ example: 'America/Bogota' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string
}

export class CreateTenantRequestDto {
  @ApiProperty({ example: 'Red Hospitalaria Global' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string

  @ApiProperty({ example: 'red-global' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase alphanumeric with hyphens' })
  slug: string

  @ApiPropertyOptional({ enum: TENANT_STATUSES })
  @IsOptional()
  @IsEnum(TENANT_STATUSES)
  status?: (typeof TENANT_STATUSES)[number]

  @ApiPropertyOptional({ type: () => InitialFacilityRequestDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InitialFacilityRequestDto)
  initialFacility?: InitialFacilityRequestDto
}

export class UpdateTenantRequestDto {
  @ApiPropertyOptional({ example: 'Red Hospitalaria Global' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string

  @ApiPropertyOptional({ enum: TENANT_STATUSES })
  @IsOptional()
  @IsEnum(TENANT_STATUSES)
  status?: (typeof TENANT_STATUSES)[number]
}
