import { Controller } from '@nestjs/common';
import { MedicalRecordService } from './medical-record.service';

@Controller('medical-records')
export class MedicalRecordController {
  constructor(private readonly medicalRecordService: MedicalRecordService) {}
}
