import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

export class AssignFacilityRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  facilityId: string
}
