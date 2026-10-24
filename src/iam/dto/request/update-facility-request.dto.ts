import { PartialType } from '@nestjs/swagger'
import { CreateFacilityRequestDto } from './create-facility-request.dto'

export class UpdateFacilityRequestDto extends PartialType(CreateFacilityRequestDto) {}
