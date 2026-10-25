import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator'
export class CreateStockMovementRequestDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID('4') inventoryItemId: string
  @ApiProperty({ enum: ['receipt', 'adjustment'] }) @IsString() @IsNotEmpty() movementType: 'receipt' | 'adjustment'
  @ApiProperty({ description: 'Cantidad positiva para entrada; negativa solo para ajuste' }) @IsInt() quantity: number
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(500) reason: string
  @ApiProperty() @IsString() @IsNotEmpty() lotNumber: string
  @ApiProperty() @IsString() @IsNotEmpty() expiresOn: string
  @ApiProperty({ format: 'uuid' }) @IsUUID('4') medicationId: string
}
