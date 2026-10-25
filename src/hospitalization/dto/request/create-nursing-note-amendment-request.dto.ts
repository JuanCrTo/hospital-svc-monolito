import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'
export class CreateNursingNoteAmendmentRequestDto {
  @ApiProperty() @IsString() @IsNotEmpty() content: string
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(500) reason: string
}
