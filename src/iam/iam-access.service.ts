import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { FacilityAssignment } from './model/facility-assignment.entity'
import { MembershipRole } from './model/membership-role.entity'
import { Membership } from './model/membership.entity'

export interface PermissionGrant {
  permission: string
  facilityId: string | null
}

export interface ResolvedAccess {
  membership: Membership
  permissions: Set<string>
  grants: PermissionGrant[]
}

interface CachedAccess {
  permissions: Set<string>
  grants: PermissionGrant[]
}

const CACHE_TTL_MS = 60_000
const CACHE_MAX_ENTRIES = 2_000

@Injectable()
export class IamAccessService {
  private readonly cache = new Map<string, { value: CachedAccess; expiresAt: number }>()

  constructor(private readonly dataSource: DataSource) {}

  async resolve(userId: string, tenantId: string, facilityId: string | null): Promise<ResolvedAccess | null> {
    return this.dataSource.transaction(async manager => {
      await manager.query(
        `SELECT set_config('app.tenant_id', $1, true),
                set_config('app.user_id', $2, true),
                set_config('app.facility_id', $3, true)`,
        [tenantId, userId, facilityId ?? '']
      )

      const membership = await manager.getRepository(Membership).findOne({ where: { userId, tenantId, status: 'active' } })
      if (!membership) return null

      if (facilityId) {
        const assignment = await manager
          .getRepository(FacilityAssignment)
          .findOne({ where: { membershipId: membership.id, facilityId, status: 'active' } })
        if (!assignment) return null
      }

      const cached = this.readCache(membership, facilityId)
      if (cached) {
        return { membership, permissions: cached.permissions, grants: cached.grants }
      }

      const rows = await manager
        .getRepository(MembershipRole)
        .createQueryBuilder('mr')
        .innerJoin('mr.role', 'role')
        .innerJoin('role_permissions', 'rp', 'rp.role_id = role.id')
        .innerJoin('permissions', 'p', 'p.id = rp.permission_id')
        .select('p.code', 'code')
        .addSelect('mr.facility_id', 'facility_id')
        .distinct(true)
        .where('mr.membership_id = :membershipId', { membershipId: membership.id })
        .andWhere('role.status = :roleStatus', { roleStatus: 'active' })
        .andWhere(
          facilityId ? '(mr.facility_id IS NULL OR mr.facility_id = :facilityId)' : 'mr.facility_id IS NULL',
          facilityId ? { facilityId } : {}
        )
        .getRawMany<{ code: string; facility_id: string | null }>()

      const grants: PermissionGrant[] = rows.map(row => ({
        permission: row.code,
        facilityId: row.facility_id ?? null
      }))
      const permissions = new Set(grants.map(grant => grant.permission))

      this.writeCache(membership, facilityId, { permissions, grants })

      return { membership, permissions, grants }
    })
  }

  private cacheKey(membership: Membership, facilityId: string | null): string {
    return `${membership.id}:${membership.permissionsVersion}:${facilityId ?? 'all'}`
  }

  private readCache(membership: Membership, facilityId: string | null): CachedAccess | null {
    const key = this.cacheKey(membership, facilityId)
    const entry = this.cache.get(key)
    if (!entry) return null
    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key)
      return null
    }
    return entry.value
  }

  private writeCache(membership: Membership, facilityId: string | null, value: CachedAccess): void {
    if (this.cache.size >= CACHE_MAX_ENTRIES) this.cache.clear()
    this.cache.set(this.cacheKey(membership, facilityId), {
      value,
      expiresAt: Date.now() + CACHE_TTL_MS
    })
  }
}
