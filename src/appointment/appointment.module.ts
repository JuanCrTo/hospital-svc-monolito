import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppointmentService } from './appointment.service'
import { AppointmentController } from './appointment.controller'
import { Appointment } from './model/appointment.entity'
import { ProviderSchedule } from './model/provider-schedule.entity'
import { Membership } from 'src/iam/model/membership.entity'
import { FacilityAssignment } from 'src/iam/model/facility-assignment.entity'
import { PatientModule } from 'src/patient/patient.module'

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, ProviderSchedule, Membership, FacilityAssignment]), PatientModule],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService, TypeOrmModule]
})
export class AppointmentModule {}
