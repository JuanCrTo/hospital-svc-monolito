import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsUUID, Matches, Max, Min } from 'class-validator'

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/

export class CreateProviderScheduleRequestDto {
  @ApiProperty({ format: 'uuid', description: 'Provider user id' })
  @IsUUID()
  providerId: string

  @ApiProperty({ example: 1, description: 'Day of week (0=Sunday, 6=Saturday)' })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number

  @ApiProperty({ example: '08:00' })
  @IsNotEmpty()
  @Matches(TIME_PATTERN, { message: 'startTime must use HH:mm format' })
  startTime: string

  @ApiProperty({ example: '12:00' })
  @IsNotEmpty()
  @Matches(TIME_PATTERN, { message: 'endTime must use HH:mm format' })
  endTime: string

  @ApiPropertyOptional({ example: 30, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(240)
  slotMinutes?: number = 30

  @ApiPropertyOptional({ enum: ['active', 'inactive'], default: 'active' })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive'
}
