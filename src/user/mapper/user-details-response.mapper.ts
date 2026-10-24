import { UserDetailsResponseDto } from '../dto/response/user-details-response.dto'
import { PatientResponseDto } from 'src/patient/dto/response/patient-response.dto'
import { mapPatientToDto } from 'src/patient/mapper/patient-response.mapper'
import { UserRole } from '../enums/user-role.enum'
import { Patient } from 'src/patient/model/patient.schema'
import { UserEntity } from '../model/user.entity'

export function mapUserDetailsToDto(user: Partial<UserEntity> & { patientDetails?: Partial<Patient> }): UserDetailsResponseDto {
  if (!user) return undefined

  let patientDetails: PatientResponseDto | undefined = undefined
  if (user.patientDetails) {
    patientDetails = mapPatientToDto(user.patientDetails)
  }

  return {
    email: user.email,
    role: user.role as UserRole,
    patientDetails
  }
}
