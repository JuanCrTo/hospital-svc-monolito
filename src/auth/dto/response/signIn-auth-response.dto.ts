import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { AuthContextResponseDto } from 'src/iam/dto/response/auth-context-response.dto'

export class SignInResponseDto {
  @ApiProperty({
    description: 'Access token JWT de vida corta',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  })
  access_token: string

  @ApiPropertyOptional({ description: 'Refresh token opaco, rotado en cada uso' })
  refresh_token?: string

  @ApiProperty({ example: 'Bearer' })
  token_type: string

  @ApiProperty({ example: 900 })
  expires_in: number

  @ApiPropertyOptional({ type: () => AuthContextResponseDto, nullable: true })
  context?: AuthContextResponseDto | null

  @ApiPropertyOptional({
    type: () => AuthContextResponseDto,
    isArray: true,
    description: 'Contextos disponibles; si hay más de uno, usar POST /auth/context'
  })
  contexts?: AuthContextResponseDto[]
}
