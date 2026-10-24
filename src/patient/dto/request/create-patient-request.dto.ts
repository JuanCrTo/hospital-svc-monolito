import { ApiPropertyOptional } from '@nestjs/swagger'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator'
import { PatientIdentifierRequestDto } from './patient-identifier-request.dto'
import { PatientContactRequestDto } from './patient-contact-request.dto'
import { InsuranceCoverageRequestDto } from './insurance-coverage-request.dto'
import { IsPastInDate } from 'src/decorators/validation/isPastInDate.decorator'

export class CreatePatientRequestDto {
  @ApiProperty({
    description: 'The identification of the patient',
    example: '1234567890'
  })
  @IsNotEmpty({ message: 'Identification  is required' })
  @IsString({ message: 'Identification  must be a string' })
  @MaxLength(40)
  identification: string

  @ApiProperty({
    description: 'The firstname of the patient',
    example: 'John'
  })
  @IsNotEmpty({ message: 'Firstname is required' })
  @IsString({ message: 'Firstname must be a string' })
  @MaxLength(120)
  firstname: string

  @ApiProperty({
    description: 'The middlename of the patient',
    example: 'Doe'
  })
  @IsNotEmpty({ message: 'Middlename is required' })
  @IsString({ message: 'Middlename must be a string' })
  @MaxLength(120)
  middlename: string

  @ApiProperty({
    description: 'The lastname of the patient',
    example: 'Smith'
  })
  @IsNotEmpty({ message: 'Lastname is required' })
  @IsString({ message: 'Lastname must be a string' })
  @MaxLength(120)
  lastname: string

  @ApiProperty({
    description: 'The second lastname of the patient',
    example: 'Johnson'
  })
  @IsNotEmpty({ message: 'Second Lastname is required' })
  @IsString({ message: 'Second Lastname must be a string' })
  @MaxLength(120)
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

  @ApiProperty({
    description: 'The address of the patient',
    example: 'apex las vegas'
  })
  @IsNotEmpty({ message: 'Location is required' })
  @IsString({ message: 'Location must be a string' })
  @MaxLength(500)
  location: string

  @ApiPropertyOptional({ type: [PatientIdentifierRequestDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PatientIdentifierRequestDto)
  identifiers?: PatientIdentifierRequestDto[]

  @ApiPropertyOptional({ type: [PatientContactRequestDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PatientContactRequestDto)
  contacts?: PatientContactRequestDto[]

  @ApiPropertyOptional({ type: [InsuranceCoverageRequestDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => InsuranceCoverageRequestDto)
  insuranceCoverages?: InsuranceCoverageRequestDto[]
}
