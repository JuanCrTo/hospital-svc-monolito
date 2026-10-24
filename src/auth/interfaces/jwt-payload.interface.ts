export interface IJwtPayload {
  userId: string
  tenantId?: string | null
  facilityId?: string | null
  permissionsVersion?: number | null
  tokenType?: 'access' | 'password_reset'
  iat?: number
  exp?: number
}
