import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Medication } from './model/medication.entity'
import { InventoryItem } from './model/inventory-item.entity'
import { StockMovement } from './model/stock-movement.entity'
import { Prescription } from './model/prescription.entity'
import { PrescriptionLine } from './model/prescription-line.entity'
import { Encounter } from 'src/clinical/model/encounter.entity'
import { PharmacyController } from './pharmacy.controller'
import { PharmacyService } from './pharmacy.service'
import { LoggerModule } from 'src/common/logging/logger.module'

@Module({
  imports: [TypeOrmModule.forFeature([Medication, InventoryItem, StockMovement, Prescription, PrescriptionLine, Encounter]), LoggerModule],
  controllers: [PharmacyController],
  providers: [PharmacyService],
  exports: [PharmacyService]
})
export class PharmacyModule {}
