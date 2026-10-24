import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ArrayUnique, IsArray, IsEmail, IsEnum, IsOptional, IsUUID } from 'class-validator'
import { USER_ROLES, UserRole } from 'src/user/enums/user-role.enum'

export class CreateInvitationRequestDto {
  @ApiProperty({ example: 'doctor@example.com' })
  @IsEmail()
  email: string

  @ApiPropertyOptional({
    enum: USER_ROLES,
    description: 'Etiqueta legada del usuario; la autorización real usa roles IAM'
  })
  @IsOptional()
  @IsEnum(USER_ROLES)
  role?: UserRole

  @ApiPropertyOptional({ type: [String], description: 'Roles tenant-wide iniciales' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  roleIds?: string[]

  @ApiPropertyOptional({ type: [String], description: 'Sedes asignadas inicialmente' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  facilityIds?: string[]
}
