import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator'

export class AcceptInvitationRequestDto {
  @ApiProperty({ description: 'Token opaco recibido por correo' })
  @IsString()
  @IsNotEmpty()
  token: string

  @ApiProperty({ example: '1234Ab#' })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword(
    { minLength: 6, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1 },
    {
      message:
        'Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one symbol'
    }
  )
  password: string
}
