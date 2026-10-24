import { ApiProperty } from '@nestjs/swagger'

export class HealthLiveResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string
}
