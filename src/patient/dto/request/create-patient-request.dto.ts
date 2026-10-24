import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsNotEmpty, IsString } from 'class-validator'
import { IsPastInDate } from 'src/decorators/validation/isPastInDate.decorator'

export class CreatePatientDto {
  @ApiProperty({
    description: 'The identification of the patient',
    example: '1234567890'
  })
  @IsNotEmpty({ message: 'Identification  is required' })
  @IsString({ message: 'Identification  must be a string' })
  identification: string

  @ApiProperty({
    description: 'The firstname of the patient',
    example: 'John'
  })
  @IsNotEmpty({ message: 'Firstname is required' })
  @IsString({ message: 'Firstname must be a string' })
  firstname: string

  @ApiProperty({
    description: 'The middlename of the patient',
    example: 'Doe'
  })
  @IsNotEmpty({ message: 'Middlename is required' })
  @IsString({ message: 'Middlename must be a string' })
  middlename: string

  @ApiProperty({
    description: 'The lastname of the patient',
    example: 'Smith'
  })
  @IsNotEmpty({ message: 'Lastname is required' })
  @IsString({ message: 'Lastname must be a string' })
  lastname: string

  @ApiProperty({
    description: 'The second lastname of the patient',
    example: 'Johnson'
  })
  @IsNotEmpty({ message: 'Second Lastname is required' })
  @IsString({ message: 'Second Lastname must be a string' })
  secondlastname: string

  @ApiProperty({
    description: 'The birth of the patient',
    example: '1990-01-01'
  })
  @IsNotEmpty({ message: 'Birth is required' })
  @IsDateString({}, { message: 'Birth must be a valid date' })
  @IsPastInDate({
    message: 'Birth must be a date in the past'
  })
  birth: string

  // [0]/formatted_address
  // formatted_address/types: street_address
  @ApiProperty({
    description: 'The address of the patient',
    example: 'apex las vegas'
  })
  @IsNotEmpty({ message: 'Location is required' })
  @IsString({ message: 'Location must be a string' })
  location: string
}
