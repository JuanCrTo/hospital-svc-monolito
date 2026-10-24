import { ApiProperty } from '@nestjs/swagger'

export class DepartmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ format: 'uuid' })
  facilityId: string

  @ApiProperty({ example: 'Urgencias' })
  name: string

  @ApiProperty({ example: 'URG' })
  code: string

  @ApiProperty({ enum: ['active', 'inactive'] })
  status: string

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}
