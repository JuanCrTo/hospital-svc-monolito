import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { AppointmentService } from './appointment.service'
import { CurrentUser } from 'src/decorators/request/current-user.decorator'
import { RequirePermission } from 'src/decorators/request/require-permission.decorator'
import { ApiStandardError } from 'src/decorators/swagger/error.decorator'
import { ApiStandardResponse } from 'src/decorators/swagger/response.decorator'
import { AuthContext } from 'src/iam/interfaces/auth-context.interface'
import { CreateAppointmentRequestDto } from './dto/request/create-appointment-request.dto'
import { RescheduleAppointmentRequestDto } from './dto/request/reschedule-appointment-request.dto'
import { CancelAppointmentRequestDto } from './dto/request/cancel-appointment-request.dto'
import { CreateProviderScheduleRequestDto } from './dto/request/create-provider-schedule-request.dto'
import { UpdateProviderScheduleRequestDto } from './dto/request/update-provider-schedule-request.dto'
import { AppointmentResponseDto } from './dto/response/appointment-response.dto'
import { ProviderScheduleResponseDto } from './dto/response/provider-schedule-response.dto'
import { AppointmentStatus } from './model/appointment.entity'

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @ApiBearerAuth('JWT-auth')
  @Post()
  @HttpCode(201)
  @RequirePermission('appointment:write')
  @ApiOperation({ summary: 'Book an appointment' })
  @ApiStandardResponse(AppointmentResponseDto, 201)
  @ApiStandardError()
  async create(@CurrentUser() ctx: AuthContext, @Body() dto: CreateAppointmentRequestDto): Promise<AppointmentResponseDto> {
    return this.appointmentService.createAppointment(dto, ctx.tenantId, ctx.facilityId, ctx.userId)
  }

  @ApiBearerAuth('JWT-auth')
  @Get()
  @HttpCode(200)
  @RequirePermission('appointment:read')
  @ApiOperation({ summary: 'List appointments' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'providerId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['scheduled', 'checked_in', 'cancelled', 'completed', 'no_show'] })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date lower bound' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date upper bound' })
  @ApiStandardResponse(AppointmentResponseDto, 200)
  @ApiStandardError()
  async findAll(
    @CurrentUser() ctx: AuthContext,
    @Query('patientId') patientId?: string,
    @Query('providerId') providerId?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('from') from?: string,
    @Query('to') to?: string
  ): Promise<AppointmentResponseDto[]> {
    return this.appointmentService.findAll(ctx.tenantId, ctx.facilityId, { patientId, providerId, status, from, to })
  }

  @ApiBearerAuth('JWT-auth')
  @Post('schedules')
  @HttpCode(201)
  @RequirePermission('appointment:write')
  @ApiOperation({ summary: 'Create a provider schedule slot' })
  @ApiStandardResponse(ProviderScheduleResponseDto, 201)
  @ApiStandardError()
  async createSchedule(@CurrentUser() ctx: AuthContext, @Body() dto: CreateProviderScheduleRequestDto): Promise<ProviderScheduleResponseDto> {
    return this.appointmentService.createSchedule(dto, ctx.tenantId, ctx.facilityId)
  }

  @ApiBearerAuth('JWT-auth')
  @Get('schedules')
  @HttpCode(200)
  @RequirePermission('appointment:read')
  @ApiOperation({ summary: 'List provider schedules' })
  @ApiQuery({ name: 'providerId', required: false })
  @ApiStandardResponse(ProviderScheduleResponseDto, 200)
  @ApiStandardError()
  async findSchedules(@CurrentUser() ctx: AuthContext, @Query('providerId') providerId?: string): Promise<ProviderScheduleResponseDto[]> {
    return this.appointmentService.findSchedules(ctx.tenantId, ctx.facilityId, providerId)
  }

  @ApiBearerAuth('JWT-auth')
  @Patch('schedules/:id')
  @HttpCode(200)
  @RequirePermission('appointment:write')
  @ApiOperation({ summary: 'Update a provider schedule' })
  @ApiStandardResponse(ProviderScheduleResponseDto, 200)
  @ApiStandardError()
  async updateSchedule(
    @CurrentUser() ctx: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateProviderScheduleRequestDto
  ): Promise<ProviderScheduleResponseDto> {
    return this.appointmentService.updateSchedule(id, dto, ctx.tenantId, ctx.facilityId)
  }

  @ApiBearerAuth('JWT-auth')
  @Delete('schedules/:id')
  @HttpCode(204)
  @RequirePermission('appointment:write')
  @ApiOperation({ summary: 'Delete a provider schedule' })
  @ApiStandardError()
  async deleteSchedule(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<void> {
    return this.appointmentService.deleteSchedule(id, ctx.tenantId, ctx.facilityId)
  }

  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @HttpCode(200)
  @RequirePermission('appointment:read')
  @ApiOperation({ summary: 'Get an appointment by ID' })
  @ApiStandardResponse(AppointmentResponseDto, 200)
  @ApiStandardError()
  async findById(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<AppointmentResponseDto> {
    return this.appointmentService.findById(id, ctx.tenantId, ctx.facilityId)
  }

  @ApiBearerAuth('JWT-auth')
  @Patch(':id/reschedule')
  @HttpCode(200)
  @RequirePermission('appointment:write')
  @ApiOperation({ summary: 'Reschedule an appointment' })
  @ApiStandardResponse(AppointmentResponseDto, 200)
  @ApiStandardError()
  @ApiBody({ type: RescheduleAppointmentRequestDto })
  async reschedule(
    @CurrentUser() ctx: AuthContext,
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentRequestDto
  ): Promise<AppointmentResponseDto> {
    return this.appointmentService.reschedule(id, dto, ctx.tenantId, ctx.facilityId)
  }

  @ApiBearerAuth('JWT-auth')
  @Patch(':id/cancel')
  @HttpCode(200)
  @RequirePermission('appointment:write')
  @ApiOperation({ summary: 'Cancel an appointment' })
  @ApiStandardResponse(AppointmentResponseDto, 200)
  @ApiStandardError()
  @ApiBody({ type: CancelAppointmentRequestDto })
  async cancel(@CurrentUser() ctx: AuthContext, @Param('id') id: string, @Body() dto: CancelAppointmentRequestDto): Promise<AppointmentResponseDto> {
    return this.appointmentService.cancel(id, dto, ctx.tenantId, ctx.facilityId)
  }

  @ApiBearerAuth('JWT-auth')
  @Patch(':id/check-in')
  @HttpCode(200)
  @RequirePermission('appointment:write')
  @ApiOperation({ summary: 'Check in an appointment' })
  @ApiStandardResponse(AppointmentResponseDto, 200)
  @ApiStandardError()
  async checkIn(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<AppointmentResponseDto> {
    return this.appointmentService.checkIn(id, ctx.tenantId, ctx.facilityId)
  }
}
