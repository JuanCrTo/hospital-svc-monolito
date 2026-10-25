import { ApiProperty } from '@nestjs/swagger'

export class ImagingStudyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ format: 'uuid' })
  orderId: string

  @ApiProperty()
  studyType: string

  @ApiProperty({ nullable: true })
  modality: string | null

  @ApiProperty({ nullable: true })
  bodySite: string | null

  @ApiProperty()
  findings: string

  @ApiProperty({ nullable: true })
  impression: string | null

  @ApiProperty()
  performedAt: Date

  @ApiProperty({ enum: ['preliminary', 'final', 'corrected'] })
  status: string

  @ApiProperty({ format: 'uuid' })
  reportedBy: string

  @ApiProperty()
  reportedAt: Date

  @ApiProperty({ format: 'uuid', nullable: true })
  amendsStudyId: string | null

  @ApiProperty({ nullable: true })
  amendmentReason: string | null

  @ApiProperty()
  createdAt: Date
}
