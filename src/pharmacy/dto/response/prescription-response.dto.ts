import { ApiProperty } from '@nestjs/swagger'
export class PrescriptionResponseDto {
  @ApiProperty() id: string
  @ApiProperty() encounterId: string
  @ApiProperty() patientId: string
  @ApiProperty() createdAt: Date
  @ApiProperty() lines: Array<{ medicationId: string; dosage: string; frequency: string; quantity: number; instructions: string | null }>
}
