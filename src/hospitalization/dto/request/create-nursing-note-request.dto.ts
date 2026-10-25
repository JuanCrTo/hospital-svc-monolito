import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'
export class CreateNursingNoteRequestDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(10000) content: string
}
