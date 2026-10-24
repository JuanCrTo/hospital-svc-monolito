import { ApiProperty } from '@nestjs/swagger'

export class PermissionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ example: 'patient:read' })
  code: string

  @ApiProperty({ example: 'Leer pacientes', nullable: true })
  description: string | null
}
