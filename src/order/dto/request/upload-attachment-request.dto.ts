import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsUUID } from 'class-validator'

export class UploadAttachmentRequestDto {
  @ApiPropertyOptional({ enum: ['order', 'lab_result', 'imaging'], default: 'order' })
  @IsOptional()
  @IsIn(['order', 'lab_result', 'imaging'])
  category?: 'order' | 'lab_result' | 'imaging'

  @ApiPropertyOptional({ format: 'uuid', description: 'Required when category is lab_result' })
  @IsOptional()
  @IsUUID()
  labResultId?: string

  @ApiPropertyOptional({ format: 'uuid', description: 'Required when category is imaging' })
  @IsOptional()
  @IsUUID()
  imagingStudyId?: string
}
