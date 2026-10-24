import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'

export class CreateEncounterRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientId: string

  @ApiProperty({ format: 'uuid', description: 'Responsible provider user id' })
  @IsUUID()
  providerId: string

  @ApiPropertyOptional({ format: 'uuid', description: 'Appointment that originated the encounter' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string

  @ApiPropertyOptional({ example: 'Dolor abdominal' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string
}
