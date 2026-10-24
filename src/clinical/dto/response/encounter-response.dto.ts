import { ApiProperty } from '@nestjs/swagger'
import { ClinicalNoteResponseDto } from './clinical-note-response.dto'
import { VitalSignResponseDto } from './vital-sign-response.dto'
import { DiagnosisResponseDto } from './diagnosis-response.dto'

export class EncounterResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ format: 'uuid' })
  facilityId: string

  @ApiProperty({ format: 'uuid' })
  patientId: string

  @ApiProperty({ format: 'uuid' })
  providerId: string

  @ApiProperty({ format: 'uuid', nullable: true })
  appointmentId: string | null

  @ApiProperty({ nullable: true })
  reason: string | null

  @ApiProperty({ enum: ['open', 'closed'] })
  status: string

  @ApiProperty()
  openedAt: Date

  @ApiProperty()
  openedBy: string

  @ApiProperty({ nullable: true })
  closedAt: Date | null

  @ApiProperty({ format: 'uuid', nullable: true })
  closedBy: string | null

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date

  @ApiProperty({ type: [ClinicalNoteResponseDto], required: false })
  notes?: ClinicalNoteResponseDto[]

  @ApiProperty({ type: [VitalSignResponseDto], required: false })
  vitalSigns?: VitalSignResponseDto[]

  @ApiProperty({ type: [DiagnosisResponseDto], required: false })
  diagnoses?: DiagnosisResponseDto[]
}
