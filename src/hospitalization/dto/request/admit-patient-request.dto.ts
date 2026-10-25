import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'
export class AdmitPatientRequestDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID('4') encounterId: string
  @ApiProperty({ format: 'uuid' }) @IsUUID('4') bedId: string
}
