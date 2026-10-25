import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'
export class TransferBedRequestDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID('4') bedId: string
}
