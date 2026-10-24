import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ArrayUnique, IsArray, IsEmail, IsOptional, IsUUID } from 'class-validator'

export class CreateMembershipRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string

  @ApiPropertyOptional({ type: [String], description: 'Roles tenant-wide iniciales' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  roleIds?: string[]
}
