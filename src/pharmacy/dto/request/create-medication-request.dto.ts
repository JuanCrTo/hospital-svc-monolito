import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'
export class CreateMedicationRequestDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(40) code: string
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255) name: string
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255) activeIngredient: string
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100) concentration: string
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(30) unitOfMeasure: string
}
