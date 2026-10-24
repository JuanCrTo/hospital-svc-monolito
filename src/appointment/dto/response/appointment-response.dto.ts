import { ApiProperty } from '@nestjs/swagger'

export class AppointmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ format: 'uuid' })
  facilityId: string

  @ApiProperty({ format: 'uuid' })
  patientId: string

  @ApiProperty({ format: 'uuid' })
  providerId: string

  @ApiProperty({ format: 'uuid', nullable: true })
  scheduleId: string | null

  @ApiProperty()
  startsAt: Date

  @ApiProperty()
  endsAt: Date

  @ApiProperty({ enum: ['scheduled', 'checked_in', 'cancelled', 'completed', 'no_show'] })
  status: string

  @ApiProperty({ nullable: true })
  reason: string | null

  @ApiProperty({ nullable: true })
  cancellationReason: string | null

  @ApiProperty({ nullable: true })
  canceledAt: Date | null

  @ApiProperty({ format: 'uuid' })
  createdBy: string

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}
