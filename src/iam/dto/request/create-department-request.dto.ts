import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator'

export class CreateDepartmentRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  facilityId: string

  @ApiProperty({ example: 'Urgencias' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string

  @ApiProperty({ example: 'URG' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string
}
