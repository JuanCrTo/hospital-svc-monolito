import { ApiProperty } from '@nestjs/swagger'

export class TenantResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ example: 'Red Hospitalaria Global' })
  name: string

  @ApiProperty({ example: 'red-global' })
  slug: string

  @ApiProperty({ enum: ['active', 'inactive', 'suspended'] })
  status: string
}
