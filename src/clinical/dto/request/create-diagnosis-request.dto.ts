import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator'

export class CreateDiagnosisRequestDto {
  @ApiProperty({ example: 'R10.4' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  code: string

  @ApiProperty({ example: 'Dolor abdominal no especificado' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  description: string

  @ApiPropertyOptional({ enum: ['primary', 'secondary'], default: 'secondary' })
  @IsOptional()
  @IsIn(['primary', 'secondary'])
  diagnosisType?: 'primary' | 'secondary'

  @ApiPropertyOptional({ example: '2026-10-24T14:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  diagnosedAt?: string

  @ApiPropertyOptional({ format: 'uuid', description: 'Diagnosis being amended' })
  @IsOptional()
  @IsUUID()
  amendsDiagnosisId?: string

  @ApiPropertyOptional({ example: 'Corrección de código CIE-10' })
  @ValidateIf(o => o.amendsDiagnosisId !== undefined)
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  amendmentReason?: string
}
