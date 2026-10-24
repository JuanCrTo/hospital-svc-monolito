import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateFacilityRequestDto {
  @ApiProperty({ example: 'Sede Centro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string

  @ApiProperty({ example: 'CENTRO' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string

  @ApiPropertyOptional({ example: 'America/Bogota' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string

  @ApiPropertyOptional({ enum: ['active', 'inactive'], example: 'active' })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive'
}
