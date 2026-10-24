import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, EntityManager, Repository } from 'typeorm'
import { Appointment, AppointmentStatus } from './model/appointment.entity'
import { ProviderSchedule } from './model/provider-schedule.entity'
import { Membership } from 'src/iam/model/membership.entity'
import { FacilityAssignment } from 'src/iam/model/facility-assignment.entity'
import { PatientService } from 'src/patient/patient.service'
import { CreateProviderScheduleRequestDto } from './dto/request/create-provider-schedule-request.dto'
import { UpdateProviderScheduleRequestDto } from './dto/request/update-provider-schedule-request.dto'
import { CreateAppointmentRequestDto } from './dto/request/create-appointment-request.dto'
import { RescheduleAppointmentRequestDto } from './dto/request/reschedule-appointment-request.dto'
import { CancelAppointmentRequestDto } from './dto/request/cancel-appointment-request.dto'
import { AppointmentResponseDto } from './dto/response/appointment-response.dto'
import { ProviderScheduleResponseDto } from './dto/response/provider-schedule-response.dto'
import { mapAppointmentToDto, mapProviderScheduleToDto } from './mapper/appointment-response.mapper'

export interface AppointmentFilters {
  patientId?: string
  providerId?: string
  status?: AppointmentStatus
  from?: string
  to?: string
}

const BLOCKING_STATUSES: AppointmentStatus[] = ['scheduled', 'checked_in']

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(ProviderSchedule)
    private readonly scheduleRepository: Repository<ProviderSchedule>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(FacilityAssignment)
    private readonly facilityAssignmentRepository: Repository<FacilityAssignment>,
    private readonly patientService: PatientService,
    private readonly dataSource: DataSource
  ) {}

  async createAppointment(
    dto: CreateAppointmentRequestDto,
    tenantId: string,
    facilityId: string,
    actorUserId: string
  ): Promise<AppointmentResponseDto> {
    this.assertFacility(facilityId)
    const startsAt = this.parseDate(dto.startsAt, 'startsAt')
    const durationMinutes = dto.durationMinutes ?? 30
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000)

    await this.patientService.findById(dto.patientId, tenantId)
    await this.assertProviderAssigned(dto.providerId, tenantId, facilityId)
    const schedule = await this.findCoveringSchedule(dto.providerId, tenantId, facilityId, startsAt, durationMinutes, dto.scheduleId)

    return this.dataSource.transaction(async manager => {
      await this.lockProvider(manager, tenantId, facilityId, dto.providerId)
      await this.assertNoOverlap(manager, tenantId, facilityId, dto.providerId, startsAt, endsAt)

      const repository = manager.getRepository(Appointment)
      const appointment = repository.create({
        tenantId,
        facilityId,
        patientId: dto.patientId,
        providerUserId: dto.providerId,
        scheduleId: schedule?.id ?? null,
        startsAt,
        endsAt,
        status: 'scheduled',
        reason: dto.reason ?? null,
        createdBy: actorUserId
      })
      return mapAppointmentToDto(await repository.save(appointment))
    })
  }

  async findAll(tenantId: string, facilityId: string, filters: AppointmentFilters = {}): Promise<AppointmentResponseDto[]> {
    this.assertFacility(facilityId)
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.tenant_id = :tenantId', { tenantId })
      .andWhere('appointment.facility_id = :facilityId', { facilityId })

    if (filters.patientId) query.andWhere('appointment.patient_id = :patientId', { patientId: filters.patientId })
    if (filters.providerId) query.andWhere('appointment.provider_user_id = :providerId', { providerId: filters.providerId })
    if (filters.status) query.andWhere('appointment.status = :status', { status: filters.status })
    if (filters.from) query.andWhere('appointment.starts_at >= :from', { from: this.parseDate(filters.from, 'from') })
    if (filters.to) query.andWhere('appointment.starts_at <= :to', { to: this.parseDate(filters.to, 'to') })

    const appointments = await query.orderBy('appointment.starts_at', 'ASC').getMany()
    return appointments.map(mapAppointmentToDto)
  }

  async findById(id: string, tenantId: string, facilityId: string): Promise<AppointmentResponseDto> {
    this.assertFacility(facilityId)
    const appointment = await this.appointmentRepository.findOne({ where: { id, tenantId, facilityId } })
    if (!appointment) throw new NotFoundException('Appointment not found')
    return mapAppointmentToDto(appointment)
  }

  async reschedule(id: string, dto: RescheduleAppointmentRequestDto, tenantId: string, facilityId: string): Promise<AppointmentResponseDto> {
    this.assertFacility(facilityId)
    const appointment = await this.appointmentRepository.findOne({ where: { id, tenantId, facilityId } })
    if (!appointment) throw new NotFoundException('Appointment not found')
    if (appointment.status !== 'scheduled') throw new ConflictException('Only scheduled appointments can be rescheduled')

    const startsAt = this.parseDate(dto.startsAt, 'startsAt')
    const durationMinutes = dto.durationMinutes ?? 30
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000)
    const schedule = await this.findCoveringSchedule(appointment.providerUserId, tenantId, facilityId, startsAt, durationMinutes)

    return this.dataSource.transaction(async manager => {
      await this.lockProvider(manager, tenantId, facilityId, appointment.providerUserId)
      await this.assertNoOverlap(manager, tenantId, facilityId, appointment.providerUserId, startsAt, endsAt, id)

      appointment.startsAt = startsAt
      appointment.endsAt = endsAt
      appointment.scheduleId = schedule?.id ?? null
      const saved = await manager.getRepository(Appointment).save(appointment)
      return mapAppointmentToDto(saved)
    })
  }

  async cancel(id: string, dto: CancelAppointmentRequestDto, tenantId: string, facilityId: string): Promise<AppointmentResponseDto> {
    this.assertFacility(facilityId)
    const appointment = await this.appointmentRepository.findOne({ where: { id, tenantId, facilityId } })
    if (!appointment) throw new NotFoundException('Appointment not found')
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      throw new ConflictException('Appointment cannot be cancelled in its current status')
    }

    appointment.status = 'cancelled'
    appointment.cancellationReason = dto.reason
    appointment.canceledAt = new Date()
    return mapAppointmentToDto(await this.appointmentRepository.save(appointment))
  }

  async checkIn(id: string, tenantId: string, facilityId: string): Promise<AppointmentResponseDto> {
    this.assertFacility(facilityId)
    const appointment = await this.appointmentRepository.findOne({ where: { id, tenantId, facilityId } })
    if (!appointment) throw new NotFoundException('Appointment not found')
    if (appointment.status !== 'scheduled') throw new ConflictException('Only scheduled appointments can be checked in')

    appointment.status = 'checked_in'
    return mapAppointmentToDto(await this.appointmentRepository.save(appointment))
  }

  async createSchedule(dto: CreateProviderScheduleRequestDto, tenantId: string, facilityId: string): Promise<ProviderScheduleResponseDto> {
    this.assertFacility(facilityId)
    if (dto.startTime >= dto.endTime) throw new BadRequestException('startTime must be before endTime')
    await this.assertProviderAssigned(dto.providerId, tenantId, facilityId)

    const schedule = this.scheduleRepository.create({
      tenantId,
      facilityId,
      providerUserId: dto.providerId,
      weekday: dto.weekday,
      startTime: dto.startTime,
      endTime: dto.endTime,
      slotMinutes: dto.slotMinutes ?? 30,
      status: dto.status ?? 'active'
    })

    try {
      return mapProviderScheduleToDto(await this.scheduleRepository.save(schedule))
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new ConflictException('Provider schedule already exists')
      throw error
    }
  }

  async findSchedules(tenantId: string, facilityId: string, providerId?: string): Promise<ProviderScheduleResponseDto[]> {
    this.assertFacility(facilityId)
    const where = providerId ? { tenantId, facilityId, providerUserId: providerId } : { tenantId, facilityId }
    const schedules = await this.scheduleRepository.find({ where, order: { weekday: 'ASC', startTime: 'ASC' } })
    return schedules.map(mapProviderScheduleToDto)
  }

  async updateSchedule(
    id: string,
    dto: UpdateProviderScheduleRequestDto,
    tenantId: string,
    facilityId: string
  ): Promise<ProviderScheduleResponseDto> {
    this.assertFacility(facilityId)
    const schedule = await this.scheduleRepository.findOne({ where: { id, tenantId, facilityId } })
    if (!schedule) throw new NotFoundException('Provider schedule not found')
    if (dto.status !== undefined) schedule.status = dto.status
    return mapProviderScheduleToDto(await this.scheduleRepository.save(schedule))
  }

  async deleteSchedule(id: string, tenantId: string, facilityId: string): Promise<void> {
    this.assertFacility(facilityId)
    const result = await this.scheduleRepository.delete({ id, tenantId, facilityId })
    if (!result.affected) throw new NotFoundException('Provider schedule not found')
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

  private async findCoveringSchedule(
    providerId: string,
    tenantId: string,
    facilityId: string,
    startsAt: Date,
    durationMinutes: number,
    scheduleId?: string
  ): Promise<ProviderSchedule | null> {
    const query = this.scheduleRepository
      .createQueryBuilder('schedule')
      .innerJoin('facilities', 'facility', 'facility.id = schedule.facility_id')
      .where('schedule.tenant_id = :tenantId', { tenantId })
      .andWhere('schedule.facility_id = :facilityId', { facilityId })
      .andWhere('schedule.provider_user_id = :providerId', { providerId })
      .andWhere("schedule.status = 'active'")
      .andWhere('schedule.weekday = EXTRACT(DOW FROM ((:startsAt)::timestamptz AT TIME ZONE facility.timezone))', {
        startsAt: startsAt.toISOString()
      })
      .andWhere('((:startsAt)::timestamptz AT TIME ZONE facility.timezone)::time >= schedule.start_time')
      .andWhere("((:startsAt)::timestamptz AT TIME ZONE facility.timezone)::time + (:durationMinutes * INTERVAL '1 minute') <= schedule.end_time", {
        durationMinutes
      })
    if (scheduleId) query.andWhere('schedule.id = :scheduleId', { scheduleId })

    const schedule = await query.orderBy('schedule.start_time', 'ASC').getOne()
    if (!schedule) throw new ConflictException('No active provider schedule covers the requested time')
    return schedule
  }

  private async assertNoOverlap(
    manager: EntityManager,
    tenantId: string,
    facilityId: string,
    providerId: string,
    startsAt: Date,
    endsAt: Date,
    excludeId?: string
  ): Promise<void> {
    const query = manager
      .getRepository(Appointment)
      .createQueryBuilder('appointment')
      .where('appointment.tenant_id = :tenantId', { tenantId })
      .andWhere('appointment.facility_id = :facilityId', { facilityId })
      .andWhere('appointment.provider_user_id = :providerId', { providerId })
      .andWhere('appointment.status IN (:...statuses)', { statuses: BLOCKING_STATUSES })
      .andWhere('appointment.starts_at < :endsAt', { endsAt })
      .andWhere('appointment.ends_at > :startsAt', { startsAt })
    if (excludeId) query.andWhere('appointment.id != :excludeId', { excludeId })

    if (await query.getExists()) throw new ConflictException('Provider already has an appointment in that time range')
  }

  private async lockProvider(manager: EntityManager, tenantId: string, facilityId: string, providerId: string): Promise<void> {
    await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`appointment:${tenantId}:${facilityId}:${providerId}`])
  }

  private assertFacility(facilityId: string): void {
    if (!facilityId) throw new ForbiddenException('An active facility context is required')
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
