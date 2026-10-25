import { ApiProperty } from '@nestjs/swagger'

export class AttachmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ format: 'uuid' })
  orderId: string

  @ApiProperty({ format: 'uuid', nullable: true })
  labResultId: string | null

  @ApiProperty({ format: 'uuid', nullable: true })
  imagingStudyId: string | null

  @ApiProperty({ enum: ['order', 'lab_result', 'imaging'] })
  category: string

  @ApiProperty()
  originalName: string

  @ApiProperty()
  mimeType: string

  @ApiProperty()
  sizeBytes: number

  @ApiProperty()
  checksumSha256: string

  @ApiProperty({ format: 'uuid' })
  uploadedBy: string

  @ApiProperty()
  createdAt: Date
}
