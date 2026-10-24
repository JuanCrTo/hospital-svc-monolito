import { calculateAge, calculateClinicalAge } from 'src/utils/utils'
import {
  PatientResponseDto,
  LocationHistoryItemDto,
  PatientIdentifierResponseDto,
  PatientContactResponseDto,
  InsuranceCoverageResponseDto
} from '../dto/response/patient-response.dto'
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

  const identifiers: PatientIdentifierResponseDto[] | undefined = Array.isArray(patient.identifiers)
    ? patient.identifiers.map(item => ({ id: item.id, type: item.type, value: item.value, createdAt: item.createdAt }))
    : undefined

  const contacts: PatientContactResponseDto[] | undefined = Array.isArray(patient.contacts)
    ? patient.contacts.map(item => ({ id: item.id, type: item.type, value: item.value, isPrimary: item.isPrimary, createdAt: item.createdAt }))
    : undefined

  const insuranceCoverages: InsuranceCoverageResponseDto[] | undefined = Array.isArray(patient.insuranceCoverages)
    ? patient.insuranceCoverages.map(item => ({
        id: item.id,
        providerName: item.providerName,
        policyNumber: item.policyNumber,
        planName: item.planName ?? undefined,
        validFrom: item.validFrom,
        validTo: item.validTo ?? undefined,
        isActive: item.isActive,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }))
    : undefined

  return {
    id: patient.id,
    userId: patient.userId,
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
    locationHistory,
    identifiers,
    contacts,
    insuranceCoverages
  }
}
