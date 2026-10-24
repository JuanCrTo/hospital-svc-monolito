import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class CancelAppointmentRequestDto {
  @ApiProperty({ example: 'El paciente no puede asistir' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason: string
}
