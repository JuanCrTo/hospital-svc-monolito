import { ApiProperty } from '@nestjs/swagger'
import { PermissionResponseDto } from './permission-response.dto'

export class RoleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ example: 'Médico general' })
  name: string

  @ApiProperty({ example: 'doctor' })
  code: string

  @ApiProperty({ example: 'Atención médica general', nullable: true })
  description: string | null

  @ApiProperty({ enum: ['active', 'inactive'] })
  status: string

  @ApiProperty({ type: () => PermissionResponseDto, isArray: true })
  permissions: PermissionResponseDto[]
}
