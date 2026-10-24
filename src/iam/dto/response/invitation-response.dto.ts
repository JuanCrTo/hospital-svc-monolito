import { ApiProperty } from '@nestjs/swagger'
import { MembershipResponseDto } from './membership-response.dto'

export class InvitationResponseDto {
  @ApiProperty({ type: () => MembershipResponseDto })
  membership: MembershipResponseDto

  @ApiProperty({ description: 'Indica si se emitió un token de invitación' })
  invitationSent: boolean

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  expiresAt: Date | null
}
