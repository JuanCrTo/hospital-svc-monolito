import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsISO8601, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator'

export class CreateAppointmentRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientId: string

  @ApiProperty({ format: 'uuid', description: 'Provider user id' })
  @IsUUID()
  providerId: string

  @ApiProperty({ format: 'uuid', required: false, description: 'Optional provider schedule slot' })
  @IsOptional()
  @IsUUID()
  scheduleId?: string

  @ApiProperty({ example: '2026-10-26T13:00:00.000Z' })
  @IsISO8601()
  startsAt: string

  @ApiPropertyOptional({ example: 30, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(240)
  durationMinutes?: number = 30

  @ApiPropertyOptional({ example: 'Control de seguimiento' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string
}
