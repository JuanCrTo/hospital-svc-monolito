import { ApiProperty } from '@nestjs/swagger'
export class InventoryResponseDto {
  @ApiProperty() id: string
  @ApiProperty() medicationId: string
  @ApiProperty() lotNumber: string
  @ApiProperty() expiresOn: string
  @ApiProperty() quantityOnHand: number
  @ApiProperty({ nullable: true }) unitCost: string | null
}
