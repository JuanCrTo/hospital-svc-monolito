import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator'

export class CreateLabResultRequestDto {
  @ApiProperty({ example: 'HGB' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(40)
  analyteCode: string

  @ApiProperty({ example: 'Hemoglobina' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  analyteName: string

  @ApiProperty({ example: '11.2' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(4000)
  value: string

  @ApiPropertyOptional({ example: 'g/dL' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  unit?: string

  @ApiPropertyOptional({ example: '12.0 - 16.0' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  referenceRange?: string

  @ApiPropertyOptional({ enum: ['normal', 'abnormal', 'critical', 'unknown'], default: 'unknown' })
  @IsOptional()
  @IsIn(['normal', 'abnormal', 'critical', 'unknown'])
  interpretation?: 'normal' | 'abnormal' | 'critical' | 'unknown'

  @ApiPropertyOptional({ enum: ['preliminary', 'final'], default: 'final' })
  @IsOptional()
  @IsIn(['preliminary', 'final'])
  status?: 'preliminary' | 'final'

  @ApiPropertyOptional({ description: 'ISO 8601 report timestamp' })
  @IsOptional()
  @IsISO8601()
  reportedAt?: string

  @ApiPropertyOptional({ format: 'uuid', description: 'Result being corrected' })
  @IsOptional()
  @IsUUID()
  amendsResultId?: string

  @ApiPropertyOptional({ example: 'Corrección de transcripción' })
  @ValidateIf(o => o.amendsResultId !== undefined)
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  amendmentReason?: string
}
