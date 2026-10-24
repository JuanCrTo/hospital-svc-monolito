export interface AuthContext {
  userId: string
  tenantId: string | null
  facilityId: string | null
  permissionsVersion: number | null
  isPlatformAdmin: boolean
}
