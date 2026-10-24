import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx.switchToHttp().getRequest()
    if (request.user?.isPlatformAdmin !== true) {
      throw new ForbiddenException('Platform administrator access required')
    }
    return true
  }
}
