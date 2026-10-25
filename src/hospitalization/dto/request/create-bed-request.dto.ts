import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'
export class CreateBedRequestDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(40) code: string
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(80) ward: string
}
