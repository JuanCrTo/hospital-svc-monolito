import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { IJwtPayload } from './interfaces/jwt-payload.interface'
import { IS_PUBLIC_KEY } from '../decorators/request/public.decorator'
import { getLogContext } from '../common/logging/log-context.storage'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()])

    if (isPublic) {
      return true
    }

    const request = ctx.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException()
    }

    try {
      const payload = await this.jwtService.verifyAsync<IJwtPayload>(token)

      if (payload.tokenType && payload.tokenType !== 'access') {
        throw new UnauthorizedException()
      }

      delete payload.iat
      delete payload.exp

      request['user'] = payload

      const logContext = getLogContext()
      if (logContext) {
        logContext.actorUserId = payload.userId
        logContext.tenantId = payload.tenantId ?? null
        logContext.facilityId = payload.facilityId ?? null
        logContext.isPlatformAdmin = payload.isPlatformAdmin === true
      }
    } catch {
      throw new UnauthorizedException()
    }

    return true
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
