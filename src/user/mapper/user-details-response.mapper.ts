import { UserDetailsResponseDto } from '../dto/response/user-details-response.dto'
import { PatientResponseDto } from 'src/patient/dto/response/patient-response.dto'
import { UserRole } from '../enums/user-role.enum'
import { UserEntity } from '../model/user.entity'

export function mapUserDetailsToDto(user: Partial<UserEntity> & { patientDetails?: PatientResponseDto }): UserDetailsResponseDto {
  if (!user) return undefined

  return {
    email: user.email,
    role: user.role as UserRole,
    patientDetails: user.patientDetails
  }
}
