import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from 'src/common/logging/logger.module'
import { PermissionsGuard } from 'src/common/guards/permissions.guard'
import { Facility } from 'src/facility/model/facility.entity'
import { Tenant } from 'src/tenant/model/tenant.entity'
import { UserEntity } from 'src/user/model/user.entity'
import { UserModule } from 'src/user/user.module'
import { EmailModule } from 'src/email/email.module'
import { Department } from './model/department.entity'
import { FacilityAssignment } from './model/facility-assignment.entity'
import { MembershipRole } from './model/membership-role.entity'
import { Membership } from './model/membership.entity'
import { Permission } from './model/permission.entity'
import { RefreshToken } from './model/refresh-token.entity'
import { RolePermission } from './model/role-permission.entity'
import { Role } from './model/role.entity'
import { UserInvitation } from './model/user-invitation.entity'
import { IamAccessService } from './iam-access.service'
import { IamController } from './iam.controller'
import { PlatformController } from './platform.controller'
import { PlatformAdminGuard } from './platform-admin.guard'
import { IamService } from './iam.service'
import { RefreshTokenService } from './refresh-token.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      Facility,
      Department,
      Role,
      Permission,
      RolePermission,
      Membership,
      MembershipRole,
      FacilityAssignment,
      RefreshToken,
      UserInvitation,
      UserEntity
    ]),
    UserModule,
    EmailModule,
    LoggerModule
  ],
  controllers: [IamController, PlatformController],
  providers: [IamService, IamAccessService, RefreshTokenService, PermissionsGuard, PlatformAdminGuard],
  exports: [IamService, IamAccessService, RefreshTokenService, PermissionsGuard]
})
export class IamModule {}
