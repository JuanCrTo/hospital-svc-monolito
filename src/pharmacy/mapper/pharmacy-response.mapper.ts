import { InventoryItem } from '../model/inventory-item.entity'
import { Medication } from '../model/medication.entity'
import { InventoryResponseDto } from '../dto/response/inventory-response.dto'
import { MedicationResponseDto } from '../dto/response/medication-response.dto'
export const mapMedication = (e: Medication): MedicationResponseDto => ({
  id: e.id,
  code: e.code,
  name: e.name,
  activeIngredient: e.activeIngredient,
  concentration: e.concentration,
  unitOfMeasure: e.unitOfMeasure,
  status: e.status,
  createdAt: e.createdAt
})
export const mapInventory = (e: InventoryItem): InventoryResponseDto => ({
  id: e.id,
  medicationId: e.medicationId,
  lotNumber: e.lotNumber,
  expiresOn: e.expiresOn,
  quantityOnHand: e.quantityOnHand,
  unitCost: e.unitCost
})
