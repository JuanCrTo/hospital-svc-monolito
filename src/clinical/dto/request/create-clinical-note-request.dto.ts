import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator'

export class CreateClinicalNoteRequestDto {
  @ApiProperty({ enum: ['evolution', 'admission', 'discharge'], default: 'evolution' })
  @IsIn(['evolution', 'admission', 'discharge'])
  noteType: 'evolution' | 'admission' | 'discharge'

  @ApiProperty({ example: 'Paciente refiere mejoría del dolor...' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20000)
  content: string

  @ApiPropertyOptional({ format: 'uuid', description: 'Note being amended' })
  @IsOptional()
  @IsUUID()
  amendsNoteId?: string

  @ApiPropertyOptional({ example: 'Corrección de diagnóstico inicial' })
  @ValidateIf(o => o.amendsNoteId !== undefined)
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  amendmentReason?: string
}
