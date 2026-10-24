import { DepartmentResponseDto } from '../dto/response/department-response.dto'
import { Department } from '../model/department.entity'

export function mapDepartmentToDto(department: Department): DepartmentResponseDto {
  return {
    id: department.id,
    facilityId: department.facilityId,
    name: department.name,
    code: department.code,
    status: department.status,
    createdAt: department.createdAt,
    updatedAt: department.updatedAt
  }
}
