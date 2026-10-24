import { Facility } from 'src/facility/model/facility.entity'
import { FacilityResponseDto } from '../dto/response/facility-response.dto'

export function mapFacilityToDto(facility: Facility): FacilityResponseDto {
  return {
    id: facility.id,
    name: facility.name,
    code: facility.code,
    timezone: facility.timezone,
    status: facility.status,
    createdAt: facility.createdAt,
    updatedAt: facility.updatedAt
  }
}
