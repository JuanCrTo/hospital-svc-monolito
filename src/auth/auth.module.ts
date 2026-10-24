import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { UserModule } from '../user/user.module'
import { JwtModule } from '@nestjs/jwt'
import { JwtSignInConfigService } from './jwt-sign-in-config/jwt-sign-in-config.service'
import { APP_GUARD } from '@nestjs/core'
import { AuthGuard } from './auth.guard'
import { EmailModule } from '../email/email.module'
import { IamModule } from '../iam/iam.module'
import { PermissionsGuard } from '../common/guards/permissions.guard'

@Module({
  imports: [
    UserModule,
    EmailModule,
    IamModule,
    JwtModule.registerAsync({
      global: false,
      useClass: JwtSignInConfigService
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, { provide: APP_GUARD, useClass: AuthGuard }, { provide: APP_GUARD, useExisting: PermissionsGuard }]
})
export class AuthModule {}
