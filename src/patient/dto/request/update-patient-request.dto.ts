import { PartialType } from '@nestjs/mapped-types'
import { CreatePatientRequestDto } from './create-patient-request.dto'

export class UpdatePatientRequestDto extends PartialType(CreatePatientRequestDto) {}
