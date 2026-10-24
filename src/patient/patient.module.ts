import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from 'src/common/logging/logger.module'
import { Membership } from 'src/iam/model/membership.entity'
import { UserEntity } from 'src/user/model/user.entity'
import { PatientService } from './patient.service'
import { PatientController } from './patient.controller'
import { PatientEntity } from './model/patient.entity'
import { PatientLocationHistory } from './model/patient-location-history.entity'
import { PatientIdentifier } from './model/patient-identifier.entity'
import { PatientContact } from './model/patient-contact.entity'
import { InsuranceCoverage } from './model/insurance-coverage.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([PatientEntity, PatientLocationHistory, PatientIdentifier, PatientContact, InsuranceCoverage, UserEntity, Membership]),
    LoggerModule
  ],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [TypeOrmModule, PatientService]
})
export class PatientModule {}
