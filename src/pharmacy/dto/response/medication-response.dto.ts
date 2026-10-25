import { ApiProperty } from '@nestjs/swagger'
export class MedicationResponseDto {
  @ApiProperty() id: string
  @ApiProperty() code: string
  @ApiProperty() name: string
  @ApiProperty() activeIngredient: string
  @ApiProperty() concentration: string
  @ApiProperty() unitOfMeasure: string
  @ApiProperty() status: string
  @ApiProperty() createdAt: Date
}
