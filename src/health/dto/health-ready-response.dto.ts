import { ApiProperty } from '@nestjs/swagger'

export class HealthReadyResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string

  @ApiProperty({ example: 'up' })
  database: string
}
