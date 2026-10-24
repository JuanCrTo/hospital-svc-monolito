import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional } from 'class-validator'

export class UpdateProviderScheduleRequestDto {
  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive'
}
