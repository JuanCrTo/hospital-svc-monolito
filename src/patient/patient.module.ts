import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PatientService } from './patient.service'
import { PatientController } from './patient.controller'
import { PatientEntity } from './model/patient.entity'
import { PatientLocationHistory } from './model/patient-location-history.entity'

@Module({
  imports: [TypeOrmModule.forFeature([PatientEntity, PatientLocationHistory])],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [TypeOrmModule, PatientService]
})
export class PatientModule {}
