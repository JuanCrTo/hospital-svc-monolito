import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { EmailService } from 'src/email/email.service'
import { comparePassword } from 'src/utils/utils'
import { getLogContext } from 'src/common/logging/log-context.storage'
import { UserService } from '../user/user.service'
import { SignInResponseDto } from './dto/response/signIn-auth-response.dto'
import { IJwtPayload } from './interfaces/jwt-payload.interface'
import { IamService } from 'src/iam/iam.service'
import { RefreshTokenMeta, RefreshTokenService } from 'src/iam/refresh-token.service'
import { UserEntity } from 'src/user/model/user.entity'
import { SelectContextRequestDto } from './dto/request/select-context-auth-request.dto'
import { SelectContextResponseDto } from './dto/response/select-context-auth-response.dto'

const ACCESS_EXPIRES_IN_SECONDS = 900

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly iamService: IamService,
    private readonly refreshTokenService: RefreshTokenService
  ) {}

  async signIn(email: string, password: string, meta: RefreshTokenMeta): Promise<SignInResponseDto> {
    const user = await this.userService.findByEmailRaw(email)
    if (!user || user.status !== 'active') throw new UnauthorizedException()

    const isPasswordValid = await comparePassword(password, user.passwordHash)
    if (!isPasswordValid) throw new UnauthorizedException()

    const logContext = getLogContext()
    if (logContext) logContext.actorUserId = user.id

    const contexts = await this.iamService.listAvailableContexts(user.id)
    const context = contexts.length === 1 ? contexts[0] : null

    const accessToken = await this.signAccessToken({
      userId: user.id,
      tenantId: context?.tenantId ?? null,
      facilityId: context?.facilityId ?? null,
      permissionsVersion: context?.permissionsVersion ?? null,
      isPlatformAdmin: user.isPlatformAdmin === true
    })
    const refresh = await this.refreshTokenService.issue(user.id, context?.tenantId ?? null, context?.facilityId ?? null, meta)

    return {
      access_token: accessToken,
      refresh_token: refresh.token,
      token_type: 'Bearer',
      expires_in: ACCESS_EXPIRES_IN_SECONDS,
      context,
      contexts
    }
  }

  async refresh(rawToken: string, meta: RefreshTokenMeta): Promise<SignInResponseDto> {
    const rotated = await this.refreshTokenService.rotate(rawToken, meta)

    let permissionsVersion: number | null = null
    if (rotated.tenantId) {
      const context = await this.iamService.getContext(rotated.userId, rotated.tenantId, rotated.facilityId).catch(() => null)
      if (!context) throw new UnauthorizedException('Membership is no longer active')
      permissionsVersion = context.permissionsVersion
    }

    const accessToken = await this.signAccessToken({
      userId: rotated.userId,
      tenantId: rotated.tenantId,
      facilityId: rotated.facilityId,
      permissionsVersion,
      isPlatformAdmin: rotated.isPlatformAdmin
    })

    return {
      access_token: accessToken,
      refresh_token: rotated.refreshToken,
      token_type: 'Bearer',
      expires_in: ACCESS_EXPIRES_IN_SECONDS,
      context: rotated.tenantId
        ? {
            tenantId: rotated.tenantId,
            facilityId: rotated.facilityId,
            permissionsVersion: permissionsVersion ?? 0
          }
        : null,
      contexts: []
    }
  }

  async logout(rawToken: string): Promise<void> {
    await this.refreshTokenService.revoke(rawToken)
  }

  async acceptInvitation(rawToken: string, password: string): Promise<void> {
    await this.iamService.acceptInvitation(rawToken, password)
  }

  async selectContext(userId: string, dto: SelectContextRequestDto): Promise<SelectContextResponseDto> {
    const user = await this.userService.findByIdRaw(userId)
    if (!user || user.status !== 'active') throw new UnauthorizedException()

    const context = await this.iamService.getContext(userId, dto.tenantId, dto.facilityId ?? null)

    const accessToken = await this.signAccessToken({
      userId,
      tenantId: dto.tenantId,
      facilityId: dto.facilityId ?? null,
      permissionsVersion: context.permissionsVersion,
      isPlatformAdmin: user.isPlatformAdmin === true
    })

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: ACCESS_EXPIRES_IN_SECONDS,
      context: {
        tenantId: dto.tenantId,
        facilityId: dto.facilityId ?? null,
        permissionsVersion: context.permissionsVersion
      }
    }
  }

  async generateResetTokenJWT(user: UserEntity): Promise<string> {
    const payload: IJwtPayload = { userId: user.id, tokenType: 'password_reset' }
    return this.jwtService.signAsync(payload, { expiresIn: '1h' })
  }

  async handleForgotPassword(email: string) {
    const user = await this.userService.findByEmailRaw(email)

    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    const token = await this.generateResetTokenJWT(user)
    const baseUrl = this.configService.get<string>('LOCAL_URL')
    const resetLink = `${baseUrl}/reset-password?token=${token}`

    return this.emailService.sendEmailForgotPassword(user.id, resetLink)
  }

  private signAccessToken(payload: Omit<IJwtPayload, 'tokenType'>): Promise<string> {
    return this.jwtService.signAsync({ ...payload, tokenType: 'access' })
  }
}
