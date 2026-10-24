import { ApiProperty } from '@nestjs/swagger'

export class FacilityResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ example: 'Sede Centro' })
  name: string

  @ApiProperty({ example: 'CENTRO' })
  code: string

  @ApiProperty({ example: 'America/Bogota' })
  timezone: string

  @ApiProperty({ enum: ['active', 'inactive'] })
  status: string

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}
