import { Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { createHash, randomBytes, randomUUID } from 'crypto'
import { IsNull, Repository } from 'typeorm'
import { UserEntity } from '../user/model/user.entity'
import { RefreshToken } from './model/refresh-token.entity'

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000

export interface RefreshTokenMeta {
  ip: string | null
  userAgent: string | null
}

export interface RotatedRefreshToken {
  userId: string
  tenantId: string | null
  facilityId: string | null
  refreshToken: string
  isPlatformAdmin: boolean
}

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  async issue(
    userId: string,
    tenantId: string | null,
    facilityId: string | null,
    meta: RefreshTokenMeta,
    familyId: string = randomUUID()
  ): Promise<{ token: string; familyId: string }> {
    const token = randomBytes(48).toString('base64url')
    await this.refreshTokenRepository.insert({
      userId,
      tenantId,
      facilityId,
      tokenHash: this.hash(token),
      familyId,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      ip: meta.ip,
      userAgent: meta.userAgent
    })
    return { token, familyId }
  }

  async rotate(rawToken: string, meta: RefreshTokenMeta): Promise<RotatedRefreshToken> {
    const current = await this.refreshTokenRepository.findOne({ where: { tokenHash: this.hash(rawToken) } })

    if (!current || current.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    if (current.revokedAt) {
      await this.revokeFamily(current.familyId)
      throw new UnauthorizedException('Refresh token already used')
    }

    const user = await this.userRepository.findOne({ where: { id: current.userId } })
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid refresh token')
    }

    const next = await this.issue(user.id, current.tenantId, current.facilityId, meta, current.familyId)
    const nextEntity = await this.refreshTokenRepository.findOne({ where: { tokenHash: this.hash(next.token) } })

    current.revokedAt = new Date()
    current.replacedByTokenId = nextEntity?.id ?? null
    await this.refreshTokenRepository.save(current)

    return {
      userId: user.id,
      tenantId: current.tenantId,
      facilityId: current.facilityId,
      refreshToken: next.token,
      isPlatformAdmin: user.isPlatformAdmin === true
    }
  }

  async revoke(rawToken: string): Promise<void> {
    const current = await this.refreshTokenRepository.findOne({ where: { tokenHash: this.hash(rawToken) } })
    if (!current) return
    await this.revokeFamily(current.familyId)
  }

  async revokeForUserTenant(userId: string, tenantId: string | null): Promise<void> {
    await this.refreshTokenRepository.update({ userId, tenantId: tenantId ?? IsNull(), revokedAt: IsNull() }, { revokedAt: new Date() })
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.refreshTokenRepository.update({ familyId, revokedAt: IsNull() }, { revokedAt: new Date() })
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }
}
