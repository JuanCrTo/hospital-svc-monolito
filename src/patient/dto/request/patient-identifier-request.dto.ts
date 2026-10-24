import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator'
import { PatientIdentifierType } from '../../model/patient-identifier.entity'

export const PATIENT_IDENTIFIER_TYPES: PatientIdentifierType[] = ['national_id', 'passport', 'foreign_id', 'other']

export class PatientIdentifierRequestDto {
  @ApiProperty({ enum: PATIENT_IDENTIFIER_TYPES, example: 'passport' })
  @IsIn(PATIENT_IDENTIFIER_TYPES)
  type: PatientIdentifierType

  @ApiProperty({ example: 'AB1234567', maxLength: 120 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  value: string
}
