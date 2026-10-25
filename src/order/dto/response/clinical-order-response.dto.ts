import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { LabResultResponseDto } from './lab-result-response.dto'
import { ImagingStudyResponseDto } from './imaging-study-response.dto'
import { AttachmentResponseDto } from './attachment-response.dto'

export class ClinicalOrderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ format: 'uuid' })
  facilityId: string

  @ApiProperty({ format: 'uuid' })
  encounterId: string

  @ApiProperty({ format: 'uuid' })
  patientId: string

  @ApiProperty({ format: 'uuid' })
  orderedBy: string

  @ApiProperty({ enum: ['lab', 'imaging'] })
  orderType: string

  @ApiProperty()
  code: string

  @ApiProperty()
  name: string

  @ApiProperty({ enum: ['routine', 'urgent', 'stat'] })
  priority: string

  @ApiProperty({ enum: ['requested', 'in_progress', 'completed', 'cancelled'] })
  status: string

  @ApiProperty({ nullable: true })
  clinicalNotes: string | null

  @ApiProperty()
  requestedAt: Date

  @ApiProperty({ nullable: true })
  startedAt: Date | null

  @ApiProperty({ nullable: true })
  completedAt: Date | null

  @ApiProperty({ nullable: true })
  cancelledAt: Date | null

  @ApiProperty({ format: 'uuid', nullable: true })
  cancelledBy: string | null

  @ApiProperty({ nullable: true })
  cancelReason: string | null

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date

  @ApiPropertyOptional({ type: [LabResultResponseDto] })
  labResults?: LabResultResponseDto[]

  @ApiPropertyOptional({ type: [ImagingStudyResponseDto] })
  imagingStudies?: ImagingStudyResponseDto[]

  @ApiPropertyOptional({ type: [AttachmentResponseDto] })
  attachments?: AttachmentResponseDto[]
}
