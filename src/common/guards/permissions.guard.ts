import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { getLogContext } from '../logging/log-context.storage'
import { IS_PUBLIC_KEY } from '../../decorators/request/public.decorator'
import { PERMISSIONS_KEY } from '../../decorators/request/require-permission.decorator'
import { AuthContext } from '../../iam/interfaces/auth-context.interface'
import { IamAccessService } from '../../iam/iam-access.service'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessService: IamAccessService
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()])
    if (isPublic) return true

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [ctx.getHandler(), ctx.getClass()])
    if (!required || required.length === 0) {
      throw new ForbiddenException('No permission metadata defined for this route')
    }

    const request = ctx.switchToHttp().getRequest()
    const token = request.user
    if (!token?.userId || !token?.tenantId) {
      throw new ForbiddenException('Active tenant context is required')
    }

    const resolved = await this.accessService.resolve(token.userId, token.tenantId, token.facilityId ?? null)
    if (!resolved) {
      throw new ForbiddenException('No active membership for this context')
    }

    if (token.permissionsVersion !== undefined && token.permissionsVersion !== resolved.membership.permissionsVersion) {
      throw new ForbiddenException('Permissions changed; sign in again')
    }

    const missing = required.filter(permission => !resolved.permissions.has(permission))
    if (missing.length > 0) {
      throw new ForbiddenException('Insufficient permissions')
    }

    const authContext: AuthContext = {
      userId: token.userId,
      tenantId: token.tenantId,
      facilityId: token.facilityId ?? null,
      permissionsVersion: resolved.membership.permissionsVersion
    }
    request.auth = authContext

    const logContext = getLogContext()
    if (logContext) {
      logContext.actorUserId = authContext.userId
      logContext.tenantId = authContext.tenantId
      logContext.facilityId = authContext.facilityId
    }

    return true
  }
}
