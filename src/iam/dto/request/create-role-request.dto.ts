import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ArrayUnique, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateRoleRequestDto {
  @ApiProperty({ example: 'Médico general' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string

  @ApiProperty({ example: 'doctor' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string

  @ApiPropertyOptional({ example: 'Atención médica general' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string

  @ApiProperty({ example: ['patient:read', 'clinical:read'], type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissions: string[]
}
