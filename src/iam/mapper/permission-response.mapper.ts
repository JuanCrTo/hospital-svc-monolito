import { PermissionResponseDto } from '../dto/response/permission-response.dto'
import { Permission } from '../model/permission.entity'

export function mapPermissionToDto(permission: Permission): PermissionResponseDto {
  return {
    id: permission.id,
    code: permission.code,
    description: permission.description
  }
}
