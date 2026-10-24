import { RoleResponseDto } from '../dto/response/role-response.dto'
import { Permission } from '../model/permission.entity'
import { Role } from '../model/role.entity'
import { mapPermissionToDto } from './permission-response.mapper'

export function mapRoleToDto(role: Role, permissions: Permission[]): RoleResponseDto {
  return {
    id: role.id,
    name: role.name,
    code: role.code,
    description: role.description,
    status: role.status,
    permissions: permissions.map(mapPermissionToDto)
  }
}
