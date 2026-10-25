import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { AuditService } from 'src/common/logging/audit/audit.service'
import { Encounter } from 'src/clinical/model/encounter.entity'
import { Bed } from './model/bed.entity'
import { Admission } from './model/admission.entity'
import { BedAssignment } from './model/bed-assignment.entity'
import { CreateBedRequestDto } from './dto/request/create-bed-request.dto'
import { TransferBedRequestDto } from './dto/request/transfer-bed-request.dto'
import { CreateNursingNoteRequestDto } from './dto/request/create-nursing-note-request.dto'
import { NursingNote } from './model/nursing-note.entity'
import { AdmitPatientRequestDto } from './dto/request/admit-patient-request.dto'
import { BedResponseDto, AdmissionResponseDto } from './dto/response/hospitalization-response.dto'
@Injectable()
export class HospitalizationService {
  constructor(
    @InjectRepository(Bed) private readonly beds: Repository<Bed>,
    @InjectRepository(Admission) private readonly admissions: Repository<Admission>,
    @InjectRepository(BedAssignment) private readonly assignments: Repository<BedAssignment>,
    @InjectRepository(Encounter) private readonly encounters: Repository<Encounter>,
    @InjectRepository(NursingNote) private readonly notes: Repository<NursingNote>,
    private readonly dataSource: DataSource,
    private readonly audit: AuditService
  ) {}
  async createBed(dto: CreateBedRequestDto, tenantId: string, facilityId: string): Promise<BedResponseDto> {
    const saved = await this.beds.save(this.beds.create({ tenantId, facilityId, code: dto.code, ward: dto.ward, status: 'available' }))
    await this.audit.record({ action: 'CREATE', resourceType: 'bed', resourceId: saved.id, tenantId, facilityId, afterSummary: { code: saved.code } })
    return saved
  }
  async listBeds(tenantId: string, facilityId: string): Promise<BedResponseDto[]> {
    return this.beds.find({ where: { tenantId, facilityId }, order: { ward: 'ASC', code: 'ASC' } })
  }
  async admit(dto: AdmitPatientRequestDto, tenantId: string, facilityId: string, userId: string): Promise<AdmissionResponseDto> {
    return this.dataSource.transaction(async manager => {
      const encounter = await manager
        .getRepository(Encounter)
        .findOne({ where: { id: dto.encounterId, tenantId, facilityId }, lock: { mode: 'pessimistic_read' } })
      if (!encounter) throw new NotFoundException('Encounter not found')
      const bed = await manager.getRepository(Bed).findOne({ where: { id: dto.bedId, tenantId, facilityId }, lock: { mode: 'pessimistic_write' } })
      if (!bed || bed.status !== 'available') throw new ConflictException('Bed is not available')
      const active = await manager.getRepository(BedAssignment).findOne({ where: { bedId: bed.id, tenantId, facilityId, releasedAt: null } })
      if (active) throw new ConflictException('Bed is already assigned')
      const admission = await manager.getRepository(Admission).save(
        manager.getRepository(Admission).create({
          tenantId,
          facilityId,
          patientId: encounter.patientId,
          encounterId: encounter.id,
          admittedBy: userId,
          status: 'active',
          admittedAt: new Date(),
          dischargedAt: null
        })
      )
      await manager
        .getRepository(BedAssignment)
        .save(
          manager
            .getRepository(BedAssignment)
            .create({ tenantId, facilityId, admissionId: admission.id, bedId: bed.id, assignedBy: userId, assignedAt: new Date(), releasedAt: null })
        )
      await this.audit.record({
        action: 'CREATE',
        resourceType: 'admission',
        resourceId: admission.id,
        tenantId,
        facilityId,
        afterSummary: { patientId: admission.patientId, bedId: bed.id }
      })
      return {
        id: admission.id,
        patientId: admission.patientId,
        encounterId: admission.encounterId,
        status: admission.status,
        admittedAt: admission.admittedAt
      }
    })
  }
  async discharge(id: string, tenantId: string, facilityId: string): Promise<void> {
    await this.dataSource.transaction(async manager => {
      const admission = await manager
        .getRepository(Admission)
        .findOne({ where: { id, tenantId, facilityId, status: 'active' }, lock: { mode: 'pessimistic_write' } })
      if (!admission) throw new NotFoundException('Admission not found')
      admission.status = 'discharged'
      admission.dischargedAt = new Date()
      await manager.getRepository(Admission).save(admission)
      const activeAssignments = await manager
        .getRepository(BedAssignment)
        .find({ where: { admissionId: id, tenantId, facilityId, releasedAt: null } })
      for (const assignment of activeAssignments) {
        assignment.releasedAt = new Date()
        await manager.getRepository(BedAssignment).save(assignment)
      }
      await this.audit.record({
        action: 'STATE_CHANGE',
        resourceType: 'admission',
        resourceId: id,
        tenantId,
        facilityId,
        afterSummary: { status: 'discharged' }
      })
    })
  }
  async transfer(id: string, dto: TransferBedRequestDto, tenantId: string, facilityId: string, userId: string): Promise<void> {
    await this.dataSource.transaction(async manager => {
      const admission = await manager
        .getRepository(Admission)
        .findOne({ where: { id, tenantId, facilityId, status: 'active' }, lock: { mode: 'pessimistic_write' } })
      if (!admission) throw new NotFoundException('Admission not found')
      const target = await manager.getRepository(Bed).findOne({ where: { id: dto.bedId, tenantId, facilityId }, lock: { mode: 'pessimistic_write' } })
      if (!target || target.status !== 'available') throw new ConflictException('Target bed is not available')
      const occupied = await manager.getRepository(BedAssignment).findOne({ where: { bedId: target.id, tenantId, facilityId, releasedAt: null } })
      if (occupied) throw new ConflictException('Target bed is already assigned')
      const current = await manager
        .getRepository(BedAssignment)
        .findOne({ where: { admissionId: id, tenantId, facilityId, releasedAt: null }, lock: { mode: 'pessimistic_write' } })
      if (current) {
        current.releasedAt = new Date()
        await manager.getRepository(BedAssignment).save(current)
      }
      await manager
        .getRepository(BedAssignment)
        .save(
          manager
            .getRepository(BedAssignment)
            .create({ tenantId, facilityId, admissionId: id, bedId: target.id, assignedBy: userId, assignedAt: new Date(), releasedAt: null })
        )
      await this.audit.record({
        action: 'STATE_CHANGE',
        resourceType: 'admission',
        resourceId: id,
        tenantId,
        facilityId,
        afterSummary: { action: 'transferred', bedId: target.id }
      })
    })
  }
  async addNursingNote(id: string, dto: CreateNursingNoteRequestDto, tenantId: string, facilityId: string, userId: string) {
    const admission = await this.admissions.findOne({ where: { id, tenantId, facilityId, status: 'active' } })
    if (!admission) throw new NotFoundException('Admission not found')
    const note = await this.notes.save(this.notes.create({ tenantId, facilityId, admissionId: id, authorUserId: userId, content: dto.content }))
    await this.audit.record({
      action: 'CREATE',
      resourceType: 'nursing_note',
      resourceId: note.id,
      tenantId,
      facilityId,
      afterSummary: { admissionId: id }
    })
    return { id: note.id, admissionId: note.admissionId, content: note.content, createdAt: note.createdAt }
  }
  async listNursingNotes(id: string, tenantId: string, facilityId: string) {
    const admission = await this.admissions.findOne({ where: { id, tenantId, facilityId } })
    if (!admission) throw new NotFoundException('Admission not found')
    return this.notes.find({ where: { admissionId: id, tenantId, facilityId }, order: { createdAt: 'ASC' } })
  }
}
