import { UserResumenResponseDto } from '../dto/response/user-resumen-response.dto'
import { UserRole } from '../enums/user-role.enum'
import { UserEntity } from '../model/user.entity'

export function mapUserResumenToDto(user: Partial<UserEntity>): UserResumenResponseDto {
  if (!user) return undefined

  return {
    email: user.email,
    role: user.role as UserRole
  }
}
