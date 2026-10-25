import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Bed } from './model/bed.entity'
import { Admission } from './model/admission.entity'
import { BedAssignment } from './model/bed-assignment.entity'
import { NursingNote } from './model/nursing-note.entity'
import { Encounter } from 'src/clinical/model/encounter.entity'
import { HospitalizationController } from './hospitalization.controller'
import { HospitalizationService } from './hospitalization.service'
import { LoggerModule } from 'src/common/logging/logger.module'
@Module({
  controllers: [HospitalizationController],
  providers: [HospitalizationService],
  imports: [TypeOrmModule.forFeature([Bed, Admission, BedAssignment, NursingNote, Encounter]), LoggerModule],
  exports: [TypeOrmModule]
})
export class HospitalizationModule {}
