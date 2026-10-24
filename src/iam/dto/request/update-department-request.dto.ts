import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateDepartmentRequestDto {
  @ApiPropertyOptional({ example: 'Urgencias' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string

  @ApiPropertyOptional({ example: 'URG' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string

  @ApiPropertyOptional({ enum: ['active', 'inactive'], example: 'active' })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive'
}
