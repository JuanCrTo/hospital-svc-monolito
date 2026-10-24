import { Controller } from '@nestjs/common';
import { NurseService } from './nurse.service';

@Controller('nurses')
export class NurseController {
  constructor(private readonly nurseService: NurseService) {}
}
