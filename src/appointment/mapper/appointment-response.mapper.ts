import { Appointment } from '../model/appointment.entity'
import { ProviderSchedule } from '../model/provider-schedule.entity'
import { AppointmentResponseDto } from '../dto/response/appointment-response.dto'
import { ProviderScheduleResponseDto } from '../dto/response/provider-schedule-response.dto'

export function mapAppointmentToDto(appointment: Appointment): AppointmentResponseDto {
  return {
    id: appointment.id,
    facilityId: appointment.facilityId,
    patientId: appointment.patientId,
    providerId: appointment.providerUserId,
    scheduleId: appointment.scheduleId,
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    status: appointment.status,
    reason: appointment.reason,
    cancellationReason: appointment.cancellationReason,
    canceledAt: appointment.canceledAt,
    createdBy: appointment.createdBy,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt
  }
}

export function mapProviderScheduleToDto(schedule: ProviderSchedule): ProviderScheduleResponseDto {
  return {
    id: schedule.id,
    facilityId: schedule.facilityId,
    providerId: schedule.providerUserId,
    weekday: schedule.weekday,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    slotMinutes: schedule.slotMinutes,
    status: schedule.status,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt
  }
}
