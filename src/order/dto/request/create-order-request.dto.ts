import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'

export class CreateOrderRequestDto {
  @ApiProperty({ format: 'uuid', description: 'Open encounter that originates the order' })
  @IsNotEmpty()
  @IsUUID()
  encounterId: string

  @ApiProperty({ enum: ['lab', 'imaging'] })
  @IsIn(['lab', 'imaging'])
  orderType: 'lab' | 'imaging'

  @ApiProperty({ example: 'CBC' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(40)
  code: string

  @ApiProperty({ example: 'Hemograma completo' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string

  @ApiPropertyOptional({ enum: ['routine', 'urgent', 'stat'], default: 'routine' })
  @IsOptional()
  @IsIn(['routine', 'urgent', 'stat'])
  priority?: 'routine' | 'urgent' | 'stat'

  @ApiPropertyOptional({ example: 'Sospecha de anemia' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  clinicalNotes?: string
}
