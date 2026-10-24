import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class InsuranceCoverageRequestDto {
  @ApiProperty({ example: 'Seguros Salud Colombia', maxLength: 160 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(160)
  providerName: string

  @ApiProperty({ example: 'POL-2026-0001', maxLength: 80 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  policyNumber: string

  @ApiPropertyOptional({ example: 'Plan Familiar', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  planName?: string

  @ApiProperty({ example: '2026-01-01' })
  @IsNotEmpty()
  @IsDateString()
  validFrom: string

  @ApiPropertyOptional({ example: '2026-12-31', nullable: true })
  @IsOptional()
  @IsDateString()
  validTo?: string

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
