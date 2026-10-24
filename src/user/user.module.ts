import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { UserEntity } from './model/user.entity'
import { Membership } from 'src/iam/model/membership.entity'
import { PatientModule } from 'src/patient/patient.module'
import { EmailModule } from 'src/email/email.module'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, Membership]), PatientModule, forwardRef(() => EmailModule)],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, TypeOrmModule]
})
export class UserModule {}
