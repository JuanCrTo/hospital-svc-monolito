import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsNotEmpty, IsString, IsUUID, MaxLength, Min, IsInt, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
export class CreatePrescriptionLineRequestDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID('4') medicationId: string
  @ApiProperty() @IsString() @IsNotEmpty() dosage: string
  @ApiProperty() @IsString() @IsNotEmpty() frequency: string
  @ApiProperty() @IsInt() @Min(1) quantity: number
  @ApiProperty({ required: false }) @IsString() @MaxLength(500) instructions?: string
}
export class CreatePrescriptionRequestDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID('4') encounterId: string
  @ApiProperty({ required: false }) @IsString() @MaxLength(1000) instructions?: string
  @ApiProperty({ type: [CreatePrescriptionLineRequestDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionLineRequestDto)
  lines: CreatePrescriptionLineRequestDto[]
}
