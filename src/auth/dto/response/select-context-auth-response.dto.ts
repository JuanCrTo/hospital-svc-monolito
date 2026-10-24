import { ApiProperty } from '@nestjs/swagger'
import { AuthContextResponseDto } from 'src/iam/dto/response/auth-context-response.dto'

export class SelectContextResponseDto {
  @ApiProperty()
  access_token: string

  @ApiProperty({ example: 'Bearer' })
  token_type: string

  @ApiProperty({ example: 900 })
  expires_in: number

  @ApiProperty({ type: () => AuthContextResponseDto })
  context: AuthContextResponseDto
}
