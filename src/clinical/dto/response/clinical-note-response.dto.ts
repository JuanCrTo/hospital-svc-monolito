import { ApiProperty } from '@nestjs/swagger'

export class ClinicalNoteResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ format: 'uuid' })
  encounterId: string

  @ApiProperty({ format: 'uuid' })
  authorId: string

  @ApiProperty({ enum: ['evolution', 'admission', 'discharge'] })
  noteType: string

  @ApiProperty()
  content: string

  @ApiProperty({ format: 'uuid', nullable: true })
  amendsNoteId: string | null

  @ApiProperty({ nullable: true })
  amendmentReason: string | null

  @ApiProperty()
  createdAt: Date
}
