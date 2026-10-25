import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator'

export class UpdateOrderStatusRequestDto {
  @ApiProperty({ enum: ['in_progress', 'completed', 'cancelled'] })
  @IsIn(['in_progress', 'completed', 'cancelled'])
  status: 'in_progress' | 'completed' | 'cancelled'

  @ApiPropertyOptional({ example: 'Orden duplicada' })
  @ValidateIf(o => o.status === 'cancelled')
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason?: string
}
