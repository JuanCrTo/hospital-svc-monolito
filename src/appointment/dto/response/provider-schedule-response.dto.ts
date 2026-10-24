import { ApiProperty } from '@nestjs/swagger'

export class ProviderScheduleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ format: 'uuid' })
  facilityId: string

  @ApiProperty({ format: 'uuid' })
  providerId: string

  @ApiProperty({ example: 1 })
  weekday: number

  @ApiProperty({ example: '08:00:00' })
  startTime: string

  @ApiProperty({ example: '12:00:00' })
  endTime: string

  @ApiProperty({ example: 30 })
  slotMinutes: number

  @ApiProperty({ enum: ['active', 'inactive'] })
  status: string

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}
