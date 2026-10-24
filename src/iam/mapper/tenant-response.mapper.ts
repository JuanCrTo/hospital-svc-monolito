import { Tenant } from 'src/tenant/model/tenant.entity'
import { TenantResponseDto } from '../dto/response/tenant-response.dto'

export function mapTenantToDto(tenant: Tenant): TenantResponseDto {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status
  }
}
