import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Readable } from 'stream'
import { AuditService } from 'src/common/logging/audit/audit.service'
import { Encounter } from 'src/clinical/model/encounter.entity'
import { ClinicalOrder, ClinicalOrderPriority, ClinicalOrderStatus, ClinicalOrderType } from './model/clinical-order.entity'
import { LabResult } from './model/lab-result.entity'
import { ImagingStudy } from './model/imaging-study.entity'
import { Attachment } from './model/attachment.entity'
import { AttachmentStorageService } from './storage/attachment-storage.service'
import { CreateOrderRequestDto } from './dto/request/create-order-request.dto'
import { UpdateOrderStatusRequestDto } from './dto/request/update-order-status-request.dto'
import { CreateLabResultRequestDto } from './dto/request/create-lab-result-request.dto'
import { CreateImagingStudyRequestDto } from './dto/request/create-imaging-study-request.dto'
import { UploadAttachmentRequestDto } from './dto/request/upload-attachment-request.dto'
import { ClinicalOrderResponseDto } from './dto/response/clinical-order-response.dto'
import { LabResultResponseDto } from './dto/response/lab-result-response.dto'
import { ImagingStudyResponseDto } from './dto/response/imaging-study-response.dto'
import { AttachmentResponseDto } from './dto/response/attachment-response.dto'
import { mapAttachmentToDto, mapClinicalOrderToDto, mapImagingStudyToDto, mapLabResultToDto } from './mapper/order-response.mapper'

const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/tiff', 'application/dicom', 'application/dicom+json'])

const DEFAULT_MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

export interface OrderFilters {
  patientId?: string
  encounterId?: string
  status?: ClinicalOrderStatus
  orderType?: ClinicalOrderType
  priority?: ClinicalOrderPriority
  from?: string
  to?: string
}

export interface UploadedFileLike {
  originalname: string
  mimetype: string
  size: number
  buffer: Buffer
}

export interface AttachmentDownload {
  stream: Readable
  fileName: string
  mimeType: string
}

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(ClinicalOrder)
    private readonly orderRepository: Repository<ClinicalOrder>,
    @InjectRepository(LabResult)
    private readonly labResultRepository: Repository<LabResult>,
    @InjectRepository(ImagingStudy)
    private readonly imagingStudyRepository: Repository<ImagingStudy>,
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    @InjectRepository(Encounter)
    private readonly encounterRepository: Repository<Encounter>,
    private readonly storageService: AttachmentStorageService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService
  ) {}

  async createOrder(dto: CreateOrderRequestDto, tenantId: string, facilityId: string, actorUserId: string): Promise<ClinicalOrderResponseDto> {
    this.assertFacility(facilityId)
    const encounter = await this.getEncounterOrFail(dto.encounterId, tenantId, facilityId)
    if (encounter.status !== 'open') throw new ConflictException('Orders can only be created for an open encounter')

    const order = this.orderRepository.create({
      tenantId,
      facilityId,
      encounterId: encounter.id,
      patientId: encounter.patientId,
      orderedBy: actorUserId,
      orderType: dto.orderType,
      code: dto.code,
      name: dto.name,
      priority: dto.priority ?? 'routine',
      status: 'requested',
      clinicalNotes: dto.clinicalNotes ?? null,
      requestedAt: new Date()
    })
    const saved = await this.orderRepository.save(order)

    await this.auditService.record({
      action: 'CREATE',
      resourceType: 'clinical_order',
      resourceId: saved.id,
      tenantId,
      facilityId,
      afterSummary: { encounterId: saved.encounterId, patientId: saved.patientId, orderType: saved.orderType, code: saved.code }
    })
    return mapClinicalOrderToDto(saved)
  }

  async findAll(tenantId: string, facilityId: string, filters: OrderFilters = {}): Promise<ClinicalOrderResponseDto[]> {
    this.assertFacility(facilityId)
    const query = this.orderRepository
      .createQueryBuilder('order')
      .where('order.tenant_id = :tenantId', { tenantId })
      .andWhere('order.facility_id = :facilityId', { facilityId })

    if (filters.patientId) query.andWhere('order.patient_id = :patientId', { patientId: filters.patientId })
    if (filters.encounterId) query.andWhere('order.encounter_id = :encounterId', { encounterId: filters.encounterId })
    if (filters.status) query.andWhere('order.status = :status', { status: filters.status })
    if (filters.orderType) query.andWhere('order.order_type = :orderType', { orderType: filters.orderType })
    if (filters.priority) query.andWhere('order.priority = :priority', { priority: filters.priority })
    if (filters.from) query.andWhere('order.requested_at >= :from', { from: this.parseDate(filters.from, 'from') })
    if (filters.to) query.andWhere('order.requested_at <= :to', { to: this.parseDate(filters.to, 'to') })

    const orders = await query.orderBy('order.requested_at', 'DESC').getMany()
    await this.auditService.record({
      action: 'READ',
      resourceType: 'clinical_order',
      tenantId,
      facilityId,
      afterSummary: { count: orders.length, patientId: filters.patientId ?? null, status: filters.status ?? null }
    })
    return orders.map(order => mapClinicalOrderToDto(order))
  }

  async findById(id: string, tenantId: string, facilityId: string): Promise<ClinicalOrderResponseDto> {
    this.assertFacility(facilityId)
    const order = await this.orderRepository.findOne({
      where: { id, tenantId, facilityId },
      relations: { labResults: true, imagingStudies: true, attachments: true }
    })
    if (!order) throw new NotFoundException('Order not found')

    order.labResults?.sort((a, b) => a.reportedAt.getTime() - b.reportedAt.getTime())
    order.imagingStudies?.sort((a, b) => a.reportedAt.getTime() - b.reportedAt.getTime())
    order.attachments?.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    await this.auditService.record({
      action: 'READ',
      resourceType: 'clinical_order',
      resourceId: order.id,
      tenantId,
      facilityId,
      afterSummary: { patientId: order.patientId }
    })
    return mapClinicalOrderToDto(order, {
      labResults: order.labResults,
      imagingStudies: order.imagingStudies,
      attachments: order.attachments
    })
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusRequestDto,
    tenantId: string,
    facilityId: string,
    actorUserId: string
  ): Promise<ClinicalOrderResponseDto> {
    this.assertFacility(facilityId)
    const order = await this.getOrderOrFail(id, tenantId, facilityId)
    const previousStatus = order.status
    const now = new Date()

    if (previousStatus === 'completed' || previousStatus === 'cancelled') {
      throw new ConflictException('Order is already closed')
    }

    if (dto.status === 'in_progress') {
      if (previousStatus !== 'requested') throw new ConflictException('Order can only move from requested to in_progress')
      order.status = 'in_progress'
      order.startedAt = now
    } else if (dto.status === 'completed') {
      order.status = 'completed'
      order.startedAt = order.startedAt ?? now
      order.completedAt = now
    } else {
      if (!dto.reason) throw new BadRequestException('reason is required when cancelling an order')
      order.status = 'cancelled'
      order.cancelledAt = now
      order.cancelledBy = actorUserId
      order.cancelReason = dto.reason
    }

    const saved = await this.orderRepository.save(order)
    await this.auditService.record({
      action: 'STATE_CHANGE',
      resourceType: 'clinical_order',
      resourceId: saved.id,
      tenantId,
      facilityId,
      beforeSummary: { status: previousStatus },
      afterSummary: { status: saved.status, reason: dto.reason ?? null }
    })
    return mapClinicalOrderToDto(saved)
  }

  async addLabResult(
    orderId: string,
    dto: CreateLabResultRequestDto,
    tenantId: string,
    facilityId: string,
    actorUserId: string
  ): Promise<LabResultResponseDto> {
    this.assertFacility(facilityId)
    const order = await this.getOrderOrFail(orderId, tenantId, facilityId)
    if (order.orderType !== 'lab') throw new BadRequestException('Order is not a laboratory order')
    if (order.status === 'cancelled') throw new ConflictException('Cannot add results to a cancelled order')

    let amended: LabResult | null = null
    if (dto.amendsResultId) {
      amended = await this.labResultRepository.findOne({ where: { id: dto.amendsResultId, orderId, tenantId, facilityId } })
      if (!amended) throw new BadRequestException('Amended result does not belong to this order')
      if (!dto.amendmentReason) throw new BadRequestException('amendmentReason is required when amending a result')
    } else if (dto.amendmentReason) {
      throw new BadRequestException('amendmentReason requires amendsResultId')
    }

    const result = this.labResultRepository.create({
      tenantId,
      facilityId,
      orderId,
      analyteCode: dto.analyteCode,
      analyteName: dto.analyteName,
      value: dto.value,
      unit: dto.unit ?? null,
      referenceRange: dto.referenceRange ?? null,
      interpretation: dto.interpretation ?? 'unknown',
      status: amended ? 'corrected' : (dto.status ?? 'final'),
      reportedBy: actorUserId,
      reportedAt: dto.reportedAt ? this.parseDate(dto.reportedAt, 'reportedAt') : new Date(),
      amendsResultId: dto.amendsResultId ?? null,
      amendmentReason: dto.amendmentReason ?? null
    })
    const saved = await this.labResultRepository.save(result)
    await this.startOrderIfRequested(order)

    await this.auditService.record({
      action: 'CREATE',
      resourceType: 'lab_result',
      resourceId: saved.id,
      tenantId,
      facilityId,
      afterSummary: { orderId, analyteCode: saved.analyteCode, status: saved.status, amendsResultId: saved.amendsResultId }
    })
    return mapLabResultToDto(saved)
  }

  async findLabResults(orderId: string, tenantId: string, facilityId: string): Promise<LabResultResponseDto[]> {
    this.assertFacility(facilityId)
    await this.getOrderOrFail(orderId, tenantId, facilityId)
    const results = await this.labResultRepository.find({
      where: { orderId, tenantId, facilityId },
      order: { reportedAt: 'ASC' }
    })
    await this.auditService.record({
      action: 'READ',
      resourceType: 'lab_result',
      resourceId: orderId,
      tenantId,
      facilityId,
      afterSummary: { count: results.length }
    })
    return results.map(mapLabResultToDto)
  }

  async addImagingStudy(
    orderId: string,
    dto: CreateImagingStudyRequestDto,
    tenantId: string,
    facilityId: string,
    actorUserId: string
  ): Promise<ImagingStudyResponseDto> {
    this.assertFacility(facilityId)
    const order = await this.getOrderOrFail(orderId, tenantId, facilityId)
    if (order.orderType !== 'imaging') throw new BadRequestException('Order is not an imaging order')
    if (order.status === 'cancelled') throw new ConflictException('Cannot add studies to a cancelled order')

    if (dto.amendsStudyId) {
      const amended = await this.imagingStudyRepository.findOne({ where: { id: dto.amendsStudyId, orderId, tenantId, facilityId } })
      if (!amended) throw new BadRequestException('Amended study does not belong to this order')
      if (!dto.amendmentReason) throw new BadRequestException('amendmentReason is required when amending a study')
    } else if (dto.amendmentReason) {
      throw new BadRequestException('amendmentReason requires amendsStudyId')
    }

    const study = this.imagingStudyRepository.create({
      tenantId,
      facilityId,
      orderId,
      studyType: dto.studyType,
      modality: dto.modality ?? null,
      bodySite: dto.bodySite ?? null,
      findings: dto.findings,
      impression: dto.impression ?? null,
      performedAt: dto.performedAt ? this.parseDate(dto.performedAt, 'performedAt') : new Date(),
      status: dto.amendsStudyId ? 'corrected' : (dto.status ?? 'final'),
      reportedBy: actorUserId,
      reportedAt: dto.reportedAt ? this.parseDate(dto.reportedAt, 'reportedAt') : new Date(),
      amendsStudyId: dto.amendsStudyId ?? null,
      amendmentReason: dto.amendmentReason ?? null
    })
    const saved = await this.imagingStudyRepository.save(study)
    await this.startOrderIfRequested(order)

    await this.auditService.record({
      action: 'CREATE',
      resourceType: 'imaging_study',
      resourceId: saved.id,
      tenantId,
      facilityId,
      afterSummary: { orderId, studyType: saved.studyType, status: saved.status, amendsStudyId: saved.amendsStudyId }
    })
    return mapImagingStudyToDto(saved)
  }

  async findImagingStudies(orderId: string, tenantId: string, facilityId: string): Promise<ImagingStudyResponseDto[]> {
    this.assertFacility(facilityId)
    await this.getOrderOrFail(orderId, tenantId, facilityId)
    const studies = await this.imagingStudyRepository.find({
      where: { orderId, tenantId, facilityId },
      order: { reportedAt: 'ASC' }
    })
    await this.auditService.record({
      action: 'READ',
      resourceType: 'imaging_study',
      resourceId: orderId,
      tenantId,
      facilityId,
      afterSummary: { count: studies.length }
    })
    return studies.map(mapImagingStudyToDto)
  }

  async uploadAttachment(
    orderId: string,
    dto: UploadAttachmentRequestDto,
    file: UploadedFileLike,
    tenantId: string,
    facilityId: string,
    actorUserId: string
  ): Promise<AttachmentResponseDto> {
    this.assertFacility(facilityId)
    if (!file?.buffer?.length) throw new BadRequestException('file is required')
    this.assertAllowedFile(file)

    const order = await this.getOrderOrFail(orderId, tenantId, facilityId)
    if (order.status === 'cancelled') throw new ConflictException('Cannot attach files to a cancelled order')

    const category = dto.category ?? 'order'
    if (category === 'lab_result') {
      if (!dto.labResultId) throw new BadRequestException('labResultId is required when category is lab_result')
      const result = await this.labResultRepository.findOne({ where: { id: dto.labResultId, orderId, tenantId, facilityId } })
      if (!result) throw new BadRequestException('Lab result does not belong to this order')
      if (dto.imagingStudyId) throw new BadRequestException('imagingStudyId is not allowed for lab_result attachments')
    } else if (category === 'imaging') {
      if (!dto.imagingStudyId) throw new BadRequestException('imagingStudyId is required when category is imaging')
      const study = await this.imagingStudyRepository.findOne({ where: { id: dto.imagingStudyId, orderId, tenantId, facilityId } })
      if (!study) throw new BadRequestException('Imaging study does not belong to this order')
      if (dto.labResultId) throw new BadRequestException('labResultId is not allowed for imaging attachments')
    } else if (dto.labResultId || dto.imagingStudyId) {
      throw new BadRequestException('order attachments cannot reference a result or study')
    }

    const stored = await this.storageService.upload({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      tenantId,
      facilityId,
      orderId
    })

    const attachment = this.attachmentRepository.create({
      tenantId,
      facilityId,
      orderId,
      labResultId: category === 'lab_result' ? dto.labResultId : null,
      imagingStudyId: category === 'imaging' ? dto.imagingStudyId : null,
      category,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: stored.sizeBytes,
      checksumSha256: stored.checksumSha256,
      publicId: stored.publicId,
      resourceType: stored.resourceType,
      format: stored.format,
      uploadedBy: actorUserId
    })
    const saved = await this.attachmentRepository.save(attachment)

    await this.auditService.record({
      action: 'CREATE',
      resourceType: 'attachment',
      resourceId: saved.id,
      tenantId,
      facilityId,
      afterSummary: { orderId, category: saved.category, sizeBytes: saved.sizeBytes, checksumSha256: saved.checksumSha256 }
    })
    return mapAttachmentToDto(saved)
  }

  async findAttachments(orderId: string, tenantId: string, facilityId: string): Promise<AttachmentResponseDto[]> {
    this.assertFacility(facilityId)
    await this.getOrderOrFail(orderId, tenantId, facilityId)
    const attachments = await this.attachmentRepository.find({
      where: { orderId, tenantId, facilityId },
      order: { createdAt: 'ASC' }
    })
    await this.auditService.record({
      action: 'READ',
      resourceType: 'attachment',
      resourceId: orderId,
      tenantId,
      facilityId,
      afterSummary: { count: attachments.length }
    })
    return attachments.map(mapAttachmentToDto)
  }

  async downloadAttachment(orderId: string, attachmentId: string, tenantId: string, facilityId: string): Promise<AttachmentDownload> {
    this.assertFacility(facilityId)
    await this.getOrderOrFail(orderId, tenantId, facilityId)
    const attachment = await this.attachmentRepository.findOne({ where: { id: attachmentId, orderId, tenantId, facilityId } })
    if (!attachment) throw new NotFoundException('Attachment not found')

    const stream = await this.storageService.openDownload(attachment.publicId, attachment.format, attachment.resourceType)

    await this.auditService.record({
      action: 'READ',
      resourceType: 'attachment',
      resourceId: attachment.id,
      tenantId,
      facilityId,
      afterSummary: { orderId, downloaded: true }
    })
    return {
      stream,
      fileName: this.sanitizeFileName(attachment.originalName),
      mimeType: attachment.mimeType
    }
  }

  private async startOrderIfRequested(order: ClinicalOrder): Promise<void> {
    if (order.status !== 'requested') return
    order.status = 'in_progress'
    order.startedAt = new Date()
    await this.orderRepository.save(order)
    await this.auditService.record({
      action: 'STATE_CHANGE',
      resourceType: 'clinical_order',
      resourceId: order.id,
      tenantId: order.tenantId,
      facilityId: order.facilityId,
      beforeSummary: { status: 'requested' },
      afterSummary: { status: 'in_progress' }
    })
  }

  private async getOrderOrFail(id: string, tenantId: string, facilityId: string): Promise<ClinicalOrder> {
    const order = await this.orderRepository.findOne({ where: { id, tenantId, facilityId } })
    if (!order) throw new NotFoundException('Order not found')
    return order
  }

  private async getEncounterOrFail(id: string, tenantId: string, facilityId: string): Promise<Encounter> {
    const encounter = await this.encounterRepository.findOne({ where: { id, tenantId, facilityId } })
    if (!encounter) throw new NotFoundException('Encounter not found')
    return encounter
  }

  private assertAllowedFile(file: UploadedFileLike): void {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Unsupported file type')
    }
    const maxBytes = this.maxAttachmentBytes()
    if (file.size > maxBytes) {
      throw new BadRequestException(`File exceeds the maximum size of ${maxBytes} bytes`)
    }
  }

  private maxAttachmentBytes(): number {
    const configured = Number(this.configService.get<string>('ATTACHMENT_MAX_SIZE_BYTES'))
    return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_ATTACHMENT_BYTES
  }

  private sanitizeFileName(name: string): string {
    return name.replace(/["\\\r\n]/g, '_')
  }

  private assertFacility(facilityId: string): void {
    if (!facilityId) throw new ForbiddenException('An active facility context is required')
  }

  private parseDate(value: string, field: string): Date {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) throw new BadRequestException(`${field} must be a valid date`)
    return date
  }
}
