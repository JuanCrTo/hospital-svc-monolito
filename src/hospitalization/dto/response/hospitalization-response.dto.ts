import { ApiProperty } from '@nestjs/swagger'
export class BedResponseDto {
  @ApiProperty() id: string
  @ApiProperty() code: string
  @ApiProperty() ward: string
  @ApiProperty() status: string
}
export class AdmissionResponseDto {
  @ApiProperty() id: string
  @ApiProperty() patientId: string
  @ApiProperty() encounterId: string
  @ApiProperty() status: string
  @ApiProperty() admittedAt: Date
}
