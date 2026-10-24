import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator'

export class RescheduleAppointmentRequestDto {
  @ApiProperty({ example: '2026-10-27T14:00:00.000Z' })
  @IsISO8601()
  startsAt: string

  @ApiPropertyOptional({ example: 30, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(240)
  durationMinutes?: number = 30
}
