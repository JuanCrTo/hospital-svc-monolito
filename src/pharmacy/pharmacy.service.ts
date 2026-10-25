import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { AuditService } from 'src/common/logging/audit/audit.service'
import { CreateMedicationRequestDto } from './dto/request/create-medication-request.dto'
import { CreateStockMovementRequestDto } from './dto/request/create-stock-movement-request.dto'
import { UpdateMedicationStatusRequestDto } from './dto/request/update-medication-status-request.dto'
import { InventoryItem } from './model/inventory-item.entity'
import { Medication } from './model/medication.entity'
import { StockMovement } from './model/stock-movement.entity'
import { Prescription } from './model/prescription.entity'
import { PrescriptionLine } from './model/prescription-line.entity'
import { Encounter } from 'src/clinical/model/encounter.entity'
import { CreatePrescriptionRequestDto } from './dto/request/create-prescription-request.dto'
import { PrescriptionResponseDto } from './dto/response/prescription-response.dto'
import { mapInventory, mapMedication } from './mapper/pharmacy-response.mapper'
@Injectable()
export class PharmacyService {
  constructor(
    @InjectRepository(Medication) private readonly medications: Repository<Medication>,
    @InjectRepository(InventoryItem) private readonly inventory: Repository<InventoryItem>,
    @InjectRepository(StockMovement) private readonly movements: Repository<StockMovement>,
    @InjectRepository(Prescription) private readonly prescriptions: Repository<Prescription>,
    @InjectRepository(PrescriptionLine) private readonly prescriptionLines: Repository<PrescriptionLine>,
    @InjectRepository(Encounter) private readonly encounters: Repository<Encounter>,
    private readonly dataSource: DataSource,
    private readonly audit: AuditService
  ) {}
  async createMedication(dto: CreateMedicationRequestDto, tenantId: string, actorUserId: string) {
    const e = this.medications.create({ ...dto, tenantId, status: 'active' })
    const saved = await this.medications.save(e)
    await this.audit.record({
      action: 'CREATE',
      resourceType: 'medication',
      resourceId: saved.id,
      actorUserId,
      tenantId,
      facilityId: null,
      afterSummary: { code: saved.code }
    })
    return mapMedication(saved)
  }
  async listMedications(tenantId: string) {
    return (await this.medications.find({ where: { tenantId }, order: { name: 'ASC' } })).map(mapMedication)
  }
  async updateStatus(id: string, dto: UpdateMedicationStatusRequestDto, tenantId: string) {
    const e = await this.medications.findOne({ where: { id, tenantId } })
    if (!e) throw new NotFoundException('Medication not found')
    e.status = dto.status
    return mapMedication(await this.medications.save(e))
  }
  async listInventory(tenantId: string, facilityId: string) {
    return (await this.inventory.find({ where: { tenantId, facilityId }, order: { expiresOn: 'ASC' } })).map(mapInventory)
  }
  async recordMovement(dto: CreateStockMovementRequestDto, tenantId: string, facilityId: string, actorUserId: string) {
    return this.dataSource.transaction(async manager => {
      const repo = manager.getRepository(InventoryItem)
      let item = dto.inventoryItemId
        ? await repo.findOne({ where: { id: dto.inventoryItemId, tenantId, facilityId }, lock: { mode: 'pessimistic_write' } })
        : null
      if (!item) {
        item = repo.create({
          tenantId,
          facilityId,
          medicationId: dto.medicationId,
          lotNumber: dto.lotNumber,
          expiresOn: dto.expiresOn,
          quantityOnHand: 0,
          unitCost: null
        })
      }
      const next = item.quantityOnHand + dto.quantity
      if (next < 0) throw new ConflictException('Insufficient stock')
      item.quantityOnHand = next
      const saved = await repo.save(item)
      const movement = manager.getRepository(StockMovement).create({
        tenantId,
        facilityId,
        inventoryItemId: saved.id,
        movementType: dto.movementType,
        quantity: dto.quantity,
        balanceAfter: next,
        performedBy: actorUserId,
        reason: dto.reason,
        referenceId: null
      })
      await manager.getRepository(StockMovement).save(movement)
      await this.audit.record({
        action: 'CREATE',
        resourceType: 'stock_movement',
        resourceId: movement.id,
        tenantId,
        facilityId,
        afterSummary: { quantity: dto.quantity, balanceAfter: next }
      })
      return mapInventory(saved)
    })
  }
  async createPrescription(
    dto: CreatePrescriptionRequestDto,
    tenantId: string,
    facilityId: string,
    actorUserId: string
  ): Promise<PrescriptionResponseDto> {
    const encounter = await this.encounters.findOne({ where: { id: dto.encounterId, tenantId, facilityId } })
    if (!encounter) throw new NotFoundException('Encounter not found')
    if (encounter.status !== 'open') throw new ConflictException('Prescription requires an open encounter')
    return this.dataSource.transaction(async manager => {
      const prescription = await manager.getRepository(Prescription).save(
        manager.getRepository(Prescription).create({
          tenantId,
          facilityId,
          encounterId: encounter.id,
          patientId: encounter.patientId,
          prescribedBy: actorUserId,
          instructions: dto.instructions ?? null
        })
      )
      const lines = dto.lines.map(line =>
        manager.getRepository(PrescriptionLine).create({
          prescriptionId: prescription.id,
          medicationId: line.medicationId,
          dosage: line.dosage,
          frequency: line.frequency,
          quantity: line.quantity,
          instructions: line.instructions ?? null
        })
      )
      const savedLines = await manager.getRepository(PrescriptionLine).save(lines)
      await this.audit.record({
        action: 'CREATE',
        resourceType: 'prescription',
        resourceId: prescription.id,
        tenantId,
        facilityId,
        afterSummary: { lineCount: savedLines.length, patientId: encounter.patientId }
      })
      return {
        id: prescription.id,
        encounterId: prescription.encounterId,
        patientId: prescription.patientId,
        createdAt: prescription.createdAt,
        lines: savedLines.map(line => ({
          medicationId: line.medicationId,
          dosage: line.dosage,
          frequency: line.frequency,
          quantity: line.quantity,
          instructions: line.instructions
        }))
      }
    })
  }

  async listPrescriptions(tenantId: string, facilityId: string): Promise<PrescriptionResponseDto[]> {
    const items = await this.prescriptions.find({ where: { tenantId, facilityId }, relations: { lines: true }, order: { createdAt: 'DESC' } })
    return items.map(item => ({
      id: item.id,
      encounterId: item.encounterId,
      patientId: item.patientId,
      createdAt: item.createdAt,
      lines: (item.lines ?? []).map(line => ({
        medicationId: line.medicationId,
        dosage: line.dosage,
        frequency: line.frequency,
        quantity: line.quantity,
        instructions: line.instructions
      }))
    }))
  }

  async dispense(prescriptionId: string, tenantId: string, facilityId: string, actorUserId: string): Promise<void> {
    await this.dataSource.transaction(async manager => {
      const prescription = await manager
        .getRepository(Prescription)
        .findOne({ where: { id: prescriptionId, tenantId, facilityId }, relations: { lines: true } })
      if (!prescription) throw new NotFoundException('Prescription not found')
      for (const line of prescription.lines) {
        const item = await manager.getRepository(InventoryItem).findOne({
          where: { tenantId, facilityId, medicationId: line.medicationId },
          order: { expiresOn: 'ASC' },
          lock: { mode: 'pessimistic_write' }
        })
        if (!item || item.quantityOnHand < line.quantity) throw new ConflictException('Insufficient stock for prescription')
        item.quantityOnHand -= line.quantity
        await manager.getRepository(InventoryItem).save(item)
        await manager.getRepository(StockMovement).save(
          manager.getRepository(StockMovement).create({
            tenantId,
            facilityId,
            inventoryItemId: item.id,
            movementType: 'dispense',
            quantity: -line.quantity,
            balanceAfter: item.quantityOnHand,
            performedBy: actorUserId,
            reason: 'Prescription dispensing',
            referenceId: prescription.id
          })
        )
      }
      await this.audit.record({
        action: 'STATE_CHANGE',
        resourceType: 'prescription',
        resourceId: prescription.id,
        tenantId,
        facilityId,
        afterSummary: { action: 'dispensed' }
      })
    })
  }
}
