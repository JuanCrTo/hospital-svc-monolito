import { IsEmail, IsEnum, IsNotEmpty, IsString, IsStrongPassword, ValidateIf, ValidateNested } from 'class-validator'
import { USER_ROLES, UserRole } from '../../enums/user-role.enum'
import { CreatePatientRequestDto } from 'src/patient/dto/request/create-patient-request.dto'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateUserDto {
  @ApiProperty({
    description: 'The name of the user',
    example: 'user@example.com'
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({ allow_display_name: false, require_tld: true }, { message: 'Email must be a valid email address' })
  email: string

  @ApiProperty({
    description: 'The password of the user',
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

  @ApiProperty({
    description: 'The role of the user',
    example: 'patient',
    enum: USER_ROLES,
    enumName: 'Role'
  })
  @IsEnum(USER_ROLES, {
    message: 'Role must be either doctor, nurse, or patient'
  })
  @IsNotEmpty({ message: 'Role is required' })
  role: UserRole

  @ApiPropertyOptional({
    description: 'details of the patient',
    type: () => CreatePatientRequestDto
  })
  @ValidateIf(o => o.role === 'patient')
  @IsNotEmpty({ message: 'Patient Details is required' })
  @ValidateNested()
  @Type(() => CreatePatientRequestDto)
  patientDetails?: CreatePatientRequestDto

  // @IsOptional()
  // @ValidateNested()
  // @Type(() => CreateDoctorDto)
  // doctorDetails?: CreateDoctorDto;

  // @IsOptional()
  // @ValidateNested()
  // @Type(() => CreateNurseDto)
  // nurseDetails?: CreateNurseDto;
}
