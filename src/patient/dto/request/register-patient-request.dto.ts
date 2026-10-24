import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsUUID } from 'class-validator'
import { CreatePatientRequestDto } from './create-patient-request.dto'

export class RegisterPatientRequestDto extends CreatePatientRequestDto {
  @ApiProperty({ format: 'uuid', description: 'Existing active member user in the current tenant' })
  @IsNotEmpty()
  @IsUUID()
  userId: string
}
