import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator'

export class CreateImagingStudyRequestDto {
  @ApiProperty({ example: 'Radiografía de tórax' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  studyType: string

  @ApiPropertyOptional({ example: 'XR' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  modality?: string

  @ApiPropertyOptional({ example: 'Tórax' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  bodySite?: string

  @ApiProperty({ example: 'Sin consolidaciones...' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20000)
  findings: string

  @ApiPropertyOptional({ example: 'Estudio dentro de límites normales' })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  impression?: string

  @ApiPropertyOptional({ description: 'ISO 8601 study timestamp' })
  @IsOptional()
  @IsISO8601()
  performedAt?: string

  @ApiPropertyOptional({ enum: ['preliminary', 'final'], default: 'final' })
  @IsOptional()
  @IsIn(['preliminary', 'final'])
  status?: 'preliminary' | 'final'

  @ApiPropertyOptional({ description: 'ISO 8601 report timestamp' })
  @IsOptional()
  @IsISO8601()
  reportedAt?: string

  @ApiPropertyOptional({ format: 'uuid', description: 'Study being corrected' })
  @IsOptional()
  @IsUUID()
  amendsStudyId?: string

  @ApiPropertyOptional({ example: 'Corrección de hallazgo' })
  @ValidateIf(o => o.amendsStudyId !== undefined)
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  amendmentReason?: string
}
