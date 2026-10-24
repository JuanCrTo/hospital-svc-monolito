import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from 'class-validator'

export class SignInRequestDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'user@example.com'
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({ allow_display_name: false, require_tld: true }, { message: 'Invalid email address' })
  email: string

  @ApiProperty({
    description: 'The password of the user',
    example: '123Ab@'
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
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
