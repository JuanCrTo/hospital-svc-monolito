import { ApiProperty } from '@nestjs/swagger'

export class DiagnosisResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ format: 'uuid' })
  encounterId: string

  @ApiProperty({ example: 'R10.4' })
  code: string

  @ApiProperty()
  description: string

  @ApiProperty({ enum: ['primary', 'secondary'] })
  diagnosisType: string

  @ApiProperty({ format: 'uuid' })
  diagnosedBy: string

  @ApiProperty()
  diagnosedAt: Date

  @ApiProperty({ format: 'uuid', nullable: true })
  amendsDiagnosisId: string | null

  @ApiProperty({ nullable: true })
  amendmentReason: string | null

  @ApiProperty()
  createdAt: Date
}
