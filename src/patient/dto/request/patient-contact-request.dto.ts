import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { PatientContactType } from '../../model/patient-contact.entity'

export const PATIENT_CONTACT_TYPES: PatientContactType[] = ['phone', 'email', 'address']

export class PatientContactRequestDto {
  @ApiProperty({ enum: PATIENT_CONTACT_TYPES, example: 'phone' })
  @IsIn(PATIENT_CONTACT_TYPES)
  type: PatientContactType

  @ApiProperty({ example: '+573001112233', maxLength: 255 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  value: string

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean
}
