import { Controller } from '@nestjs/common';
import { MedicineService } from './medicine.service';

@Controller('medicines')
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}
}
