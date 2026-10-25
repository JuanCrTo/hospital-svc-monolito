import { ApiProperty } from '@nestjs/swagger'

export class LabResultResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ format: 'uuid' })
  orderId: string

  @ApiProperty()
  analyteCode: string

  @ApiProperty()
  analyteName: string

  @ApiProperty()
  value: string

  @ApiProperty({ nullable: true })
  unit: string | null

  @ApiProperty({ nullable: true })
  referenceRange: string | null

  @ApiProperty({ enum: ['normal', 'abnormal', 'critical', 'unknown'] })
  interpretation: string

  @ApiProperty({ enum: ['preliminary', 'final', 'corrected'] })
  status: string

  @ApiProperty({ format: 'uuid' })
  reportedBy: string

  @ApiProperty()
  reportedAt: Date

  @ApiProperty({ format: 'uuid', nullable: true })
  amendsResultId: string | null

  @ApiProperty({ nullable: true })
  amendmentReason: string | null

  @ApiProperty()
  createdAt: Date
}
