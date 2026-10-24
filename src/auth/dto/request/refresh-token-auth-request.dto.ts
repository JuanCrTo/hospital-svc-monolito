import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class RefreshTokenRequestDto {
  @ApiProperty({ description: 'Refresh token emitido en el sign-in o en la rotación anterior' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string
}
