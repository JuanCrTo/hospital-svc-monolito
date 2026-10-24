import { calculateAge, calculateClinicalAge } from 'src/utils/utils'
import { PatientResponseDto, LocationHistoryItemDto } from '../dto/response/patient-response.dto'
import { PatientEntity } from '../model/patient.entity'

export function mapPatientToDto(patient: Partial<PatientEntity>): PatientResponseDto {
  if (!patient) return undefined

  let locationHistory: LocationHistoryItemDto[] | undefined = undefined
  if (Array.isArray(patient.locationHistory)) {
    locationHistory = patient.locationHistory.map(item => ({
      location: item.location,
      latitude: item.latitude ?? undefined,
      longitude: item.longitude ?? undefined,
      updatedAt: item.updatedAt
    }))
  }

  return {
    id: patient.id,
    identification: patient.identification,
    firstname: patient.firstname,
    middlename: patient.middlename,
    lastname: patient.lastname,
    secondlastname: patient.secondlastname,
    birth: patient.birthDate,
    age: calculateAge(patient.birthDate),
    clinicalage: calculateClinicalAge(patient.birthDate),
    location: patient.location ?? undefined,
    latitude: patient.latitude ?? undefined,
    longitude: patient.longitude ?? undefined,
    locationHistory
  }
}
