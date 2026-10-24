import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AuditService } from 'src/common/logging/audit/audit.service'
import { PatientService } from 'src/patient/patient.service'
import { Membership } from 'src/iam/model/membership.entity'
import { FacilityAssignment } from 'src/iam/model/facility-assignment.entity'
import { Appointment } from 'src/appointment/model/appointment.entity'
import { Encounter, EncounterStatus } from './model/encounter.entity'
import { ClinicalNote } from './model/clinical-note.entity'
import { VitalSign } from './model/vital-sign.entity'
import { Diagnosis } from './model/diagnosis.entity'
import { CreateEncounterRequestDto } from './dto/request/create-encounter-request.dto'
import { CreateClinicalNoteRequestDto } from './dto/request/create-clinical-note-request.dto'
import { CreateVitalSignsRequestDto } from './dto/request/create-vital-signs-request.dto'
import { CreateDiagnosisRequestDto } from './dto/request/create-diagnosis-request.dto'
import { EncounterResponseDto } from './dto/response/encounter-response.dto'
import { ClinicalNoteResponseDto } from './dto/response/clinical-note-response.dto'
import { VitalSignResponseDto } from './dto/response/vital-sign-response.dto'
import { DiagnosisResponseDto } from './dto/response/diagnosis-response.dto'
import { mapClinicalNoteToDto, mapDiagnosisToDto, mapEncounterToDto, mapVitalSignToDto } from './mapper/clinical-response.mapper'

export interface EncounterFilters {
  patientId?: string
  status?: EncounterStatus
  from?: string
  to?: string
}

@Injectable()
export class ClinicalService {
  constructor(
    @InjectRepository(Encounter)
    private readonly encounterRepository: Repository<Encounter>,
    @InjectRepository(ClinicalNote)
    private readonly noteRepository: Repository<ClinicalNote>,
    @InjectRepository(VitalSign)
    private readonly vitalSignRepository: Repository<VitalSign>,
    @InjectRepository(Diagnosis)
    private readonly diagnosisRepository: Repository<Diagnosis>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(FacilityAssignment)
    private readonly facilityAssignmentRepository: Repository<FacilityAssignment>,
    private readonly patientService: PatientService,
    private readonly auditService: AuditService
  ) {}

  async openEncounter(dto: CreateEncounterRequestDto, tenantId: string, facilityId: string, actorUserId: string): Promise<EncounterResponseDto> {
    this.assertFacility(facilityId)
    await this.patientService.findById(dto.patientId, tenantId)
    await this.assertProviderAssigned(dto.providerId, tenantId, facilityId)

    if (dto.appointmentId) {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: dto.appointmentId, tenantId, facilityId }
      })
      if (!appointment) throw new NotFoundException('Appointment not found')
      if (appointment.patientId !== dto.patientId) {
        throw new BadRequestException('Appointment patient does not match encounter patient')
      }
      if (appointment.providerUserId !== dto.providerId) {
        throw new BadRequestException('Appointment provider does not match encounter provider')
      }
      if (appointment.status !== 'scheduled' && appointment.status !== 'checked_in') {
        throw new ConflictException('Appointment cannot originate an encounter in its current status')
      }
    }

    const encounter = this.encounterRepository.create({
      tenantId,
      facilityId,
      patientId: dto.patientId,
      providerUserId: dto.providerId,
      appointmentId: dto.appointmentId ?? null,
      reason: dto.reason ?? null,
      status: 'open',
      openedAt: new Date(),
      openedBy: actorUserId
    })

    try {
      const saved = await this.encounterRepository.save(encounter)
      await this.auditService.record({
        action: 'CREATE',
        resourceType: 'encounter',
        resourceId: saved.id,
        tenantId,
        facilityId,
        afterSummary: { patientId: saved.patientId, providerId: saved.providerUserId, status: saved.status }
      })
      return mapEncounterToDto(saved)
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new ConflictException('An encounter already exists for this appointment')
      throw error
    }
  }

  async findAll(tenantId: string, facilityId: string, filters: EncounterFilters = {}): Promise<EncounterResponseDto[]> {
    this.assertFacility(facilityId)
    const query = this.encounterRepository
      .createQueryBuilder('encounter')
      .where('encounter.tenant_id = :tenantId', { tenantId })
      .andWhere('encounter.facility_id = :facilityId', { facilityId })

    if (filters.patientId) query.andWhere('encounter.patient_id = :patientId', { patientId: filters.patientId })
    if (filters.status) query.andWhere('encounter.status = :status', { status: filters.status })
    if (filters.from) query.andWhere('encounter.opened_at >= :from', { from: this.parseDate(filters.from, 'from') })
    if (filters.to) query.andWhere('encounter.opened_at <= :to', { to: this.parseDate(filters.to, 'to') })

    const encounters = await query.orderBy('encounter.opened_at', 'DESC').getMany()
    await this.auditService.record({
      action: 'READ',
      resourceType: 'encounter',
      tenantId,
      facilityId,
      afterSummary: { count: encounters.length, patientId: filters.patientId ?? null }
    })
    return encounters.map(encounter => mapEncounterToDto(encounter))
  }

  async findById(id: string, tenantId: string, facilityId: string): Promise<EncounterResponseDto> {
    this.assertFacility(facilityId)
    const encounter = await this.encounterRepository.findOne({
      where: { id, tenantId, facilityId },
      relations: { notes: true, vitalSigns: true, diagnoses: true }
    })
    if (!encounter) throw new NotFoundException('Encounter not found')

    encounter.notes?.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    encounter.vitalSigns?.sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime())
    encounter.diagnoses?.sort((a, b) => a.diagnosedAt.getTime() - b.diagnosedAt.getTime())

    await this.auditService.record({
      action: 'READ',
      resourceType: 'clinical_record',
      resourceId: encounter.id,
      tenantId,
      facilityId,
      afterSummary: { patientId: encounter.patientId }
    })
    return mapEncounterToDto(encounter, {
      notes: encounter.notes,
      vitalSigns: encounter.vitalSigns,
      diagnoses: encounter.diagnoses
    })
  }

  async closeEncounter(id: string, tenantId: string, facilityId: string, actorUserId: string): Promise<EncounterResponseDto> {
    this.assertFacility(facilityId)
    const encounter = await this.getEncounterOrFail(id, tenantId, facilityId)
    if (encounter.status === 'closed') throw new ConflictException('Encounter is already closed')

    encounter.status = 'closed'
    encounter.closedAt = new Date()
    encounter.closedBy = actorUserId
    const saved = await this.encounterRepository.save(encounter)

    await this.auditService.record({
      action: 'STATE_CHANGE',
      resourceType: 'encounter',
      resourceId: saved.id,
      tenantId,
      facilityId,
      beforeSummary: { status: 'open' },
      afterSummary: { status: 'closed' }
    })
    return mapEncounterToDto(saved)
  }

  async addNote(
    encounterId: string,
    dto: CreateClinicalNoteRequestDto,
    tenantId: string,
    facilityId: string,
    actorUserId: string
  ): Promise<ClinicalNoteResponseDto> {
    this.assertFacility(facilityId)
    const encounter = await this.getEncounterOrFail(encounterId, tenantId, facilityId)
    this.assertOpen(encounter)

    if (dto.amendsNoteId) {
      const amended = await this.noteRepository.findOne({
        where: { id: dto.amendsNoteId, encounterId, tenantId, facilityId }
      })
      if (!amended) throw new BadRequestException('Amended note does not belong to this encounter')
      if (!dto.amendmentReason) throw new BadRequestException('amendmentReason is required when amending a note')
    } else if (dto.amendmentReason) {
      throw new BadRequestException('amendmentReason requires amendsNoteId')
    }

    const note = this.noteRepository.create({
      tenantId,
      facilityId,
      encounterId,
      authorUserId: actorUserId,
      noteType: dto.noteType,
      content: dto.content,
      amendsNoteId: dto.amendsNoteId ?? null,
      amendmentReason: dto.amendmentReason ?? null
    })
    const saved = await this.noteRepository.save(note)

    await this.auditService.record({
      action: 'CREATE',
      resourceType: 'clinical_note',
      resourceId: saved.id,
      tenantId,
      facilityId,
      afterSummary: { encounterId, noteType: saved.noteType, amendsNoteId: saved.amendsNoteId }
    })
    return mapClinicalNoteToDto(saved)
  }

  async findNotes(encounterId: string, tenantId: string, facilityId: string): Promise<ClinicalNoteResponseDto[]> {
    this.assertFacility(facilityId)
    await this.getEncounterOrFail(encounterId, tenantId, facilityId)
    const notes = await this.noteRepository.find({
      where: { encounterId, tenantId, facilityId },
      order: { createdAt: 'ASC' }
    })
    await this.auditService.record({
      action: 'READ',
      resourceType: 'clinical_note',
      resourceId: encounterId,
      tenantId,
      facilityId,
      afterSummary: { count: notes.length }
    })
    return notes.map(mapClinicalNoteToDto)
  }

  async addVitalSigns(
    encounterId: string,
    dto: CreateVitalSignsRequestDto,
    tenantId: string,
    facilityId: string,
    actorUserId: string
  ): Promise<VitalSignResponseDto> {
    this.assertFacility(facilityId)
    const encounter = await this.getEncounterOrFail(encounterId, tenantId, facilityId)
    this.assertOpen(encounter)
    if (!this.hasAnyMeasurement(dto)) throw new BadRequestException('At least one vital sign measurement is required')

    const vitalSign = this.vitalSignRepository.create({
      tenantId,
      facilityId,
      encounterId,
      recordedBy: actorUserId,
      measuredAt: dto.measuredAt ? this.parseDate(dto.measuredAt, 'measuredAt') : new Date(),
      temperature: dto.temperature ?? null,
      systolic: dto.systolic ?? null,
      diastolic: dto.diastolic ?? null,
      heartRate: dto.heartRate ?? null,
      respiratoryRate: dto.respiratoryRate ?? null,
      oxygenSaturation: dto.oxygenSaturation ?? null,
      weight: dto.weight ?? null,
      height: dto.height ?? null
    })
    const saved = await this.vitalSignRepository.save(vitalSign)

    await this.auditService.record({
      action: 'CREATE',
      resourceType: 'vital_sign',
      resourceId: saved.id,
      tenantId,
      facilityId,
      afterSummary: { encounterId, measuredAt: saved.measuredAt }
    })
    return mapVitalSignToDto(saved)
  }

  async findVitalSigns(encounterId: string, tenantId: string, facilityId: string): Promise<VitalSignResponseDto[]> {
    this.assertFacility(facilityId)
    await this.getEncounterOrFail(encounterId, tenantId, facilityId)
    const vitalSigns = await this.vitalSignRepository.find({
      where: { encounterId, tenantId, facilityId },
      order: { measuredAt: 'ASC' }
    })
    await this.auditService.record({
      action: 'READ',
      resourceType: 'vital_sign',
      resourceId: encounterId,
      tenantId,
      facilityId,
      afterSummary: { count: vitalSigns.length }
    })
    return vitalSigns.map(mapVitalSignToDto)
  }

  async addDiagnosis(
    encounterId: string,
    dto: CreateDiagnosisRequestDto,
    tenantId: string,
    facilityId: string,
    actorUserId: string
  ): Promise<DiagnosisResponseDto> {
    this.assertFacility(facilityId)
    const encounter = await this.getEncounterOrFail(encounterId, tenantId, facilityId)
    this.assertOpen(encounter)

    if (dto.amendsDiagnosisId) {
      const amended = await this.diagnosisRepository.findOne({
        where: { id: dto.amendsDiagnosisId, encounterId, tenantId, facilityId }
      })
      if (!amended) throw new BadRequestException('Amended diagnosis does not belong to this encounter')
      if (!dto.amendmentReason) throw new BadRequestException('amendmentReason is required when amending a diagnosis')
    } else if (dto.amendmentReason) {
      throw new BadRequestException('amendmentReason requires amendsDiagnosisId')
    }

    const diagnosis = this.diagnosisRepository.create({
      tenantId,
      facilityId,
      encounterId,
      code: dto.code,
      description: dto.description,
      diagnosisType: dto.diagnosisType ?? 'secondary',
      diagnosedBy: actorUserId,
      diagnosedAt: dto.diagnosedAt ? this.parseDate(dto.diagnosedAt, 'diagnosedAt') : new Date(),
      amendsDiagnosisId: dto.amendsDiagnosisId ?? null,
      amendmentReason: dto.amendmentReason ?? null
    })
    const saved = await this.diagnosisRepository.save(diagnosis)

    await this.auditService.record({
      action: 'CREATE',
      resourceType: 'diagnosis',
      resourceId: saved.id,
      tenantId,
      facilityId,
      afterSummary: { encounterId, code: saved.code, diagnosisType: saved.diagnosisType }
    })
    return mapDiagnosisToDto(saved)
  }

  async findDiagnoses(encounterId: string, tenantId: string, facilityId: string): Promise<DiagnosisResponseDto[]> {
    this.assertFacility(facilityId)
    await this.getEncounterOrFail(encounterId, tenantId, facilityId)
    const diagnoses = await this.diagnosisRepository.find({
      where: { encounterId, tenantId, facilityId },
      order: { diagnosedAt: 'ASC' }
    })
    await this.auditService.record({
      action: 'READ',
      resourceType: 'diagnosis',
      resourceId: encounterId,
      tenantId,
      facilityId,
      afterSummary: { count: diagnoses.length }
    })
    return diagnoses.map(mapDiagnosisToDto)
  }

  private async getEncounterOrFail(id: string, tenantId: string, facilityId: string): Promise<Encounter> {
    const encounter = await this.encounterRepository.findOne({ where: { id, tenantId, facilityId } })
    if (!encounter) throw new NotFoundException('Encounter not found')
    return encounter
  }

  private async assertProviderAssigned(providerId: string, tenantId: string, facilityId: string): Promise<void> {
    const membership = await this.membershipRepository.findOne({
      where: { userId: providerId, tenantId, status: 'active' }
    })
    if (!membership) throw new BadRequestException('Provider is not an active member of the tenant')

    const assignment = await this.facilityAssignmentRepository.findOne({
      where: { membershipId: membership.id, facilityId, status: 'active' }
    })
    if (!assignment) throw new BadRequestException('Provider is not assigned to the facility')
  }

  private assertOpen(encounter: Encounter): void {
    if (encounter.status !== 'open') throw new ConflictException('Encounter is closed')
  }

  private assertFacility(facilityId: string): void {
    if (!facilityId) throw new ForbiddenException('An active facility context is required')
  }

  private hasAnyMeasurement(dto: CreateVitalSignsRequestDto): boolean {
    return [dto.temperature, dto.systolic, dto.diastolic, dto.heartRate, dto.respiratoryRate, dto.oxygenSaturation, dto.weight, dto.height].some(
      value => value !== undefined
    )
  }

  private parseDate(value: string, field: string): Date {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) throw new BadRequestException(`${field} must be a valid date`)
    return date
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
  }
}
