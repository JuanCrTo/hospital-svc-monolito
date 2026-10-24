import { ApiProperty } from '@nestjs/swagger'
import { IsIn } from 'class-validator'

export class UpdateMembershipStatusRequestDto {
  @ApiProperty({ enum: ['active', 'suspended', 'revoked'], example: 'suspended' })
  @IsIn(['active', 'suspended', 'revoked'])
  status: 'active' | 'suspended' | 'revoked'
}
