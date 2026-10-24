import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ChangePasswordRequestDto {
  @ApiProperty({
    description: 'The new password of the user',
    example: '1234Ab#'
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsStrongPassword(
    {
      minLength: 6,
      minUppercase: 1,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    {
      message:
        'Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one symbol'
    }
  )
  password: string
}
