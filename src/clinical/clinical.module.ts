import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ClinicalController } from './clinical.controller'
import { ClinicalService } from './clinical.service'
import { Encounter } from './model/encounter.entity'
import { ClinicalNote } from './model/clinical-note.entity'
import { VitalSign } from './model/vital-sign.entity'
import { Diagnosis } from './model/diagnosis.entity'
import { Appointment } from 'src/appointment/model/appointment.entity'
import { Membership } from 'src/iam/model/membership.entity'
import { FacilityAssignment } from 'src/iam/model/facility-assignment.entity'
import { PatientModule } from 'src/patient/patient.module'
import { LoggerModule } from 'src/common/logging/logger.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Encounter, ClinicalNote, VitalSign, Diagnosis, Appointment, Membership, FacilityAssignment]),
    PatientModule,
    LoggerModule
  ],
  controllers: [ClinicalController],
  providers: [ClinicalService],
  exports: [ClinicalService, TypeOrmModule]
})
export class ClinicalModule {}
