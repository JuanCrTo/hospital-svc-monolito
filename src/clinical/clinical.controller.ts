import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { CurrentUser } from 'src/decorators/request/current-user.decorator'
import { RequirePermission } from 'src/decorators/request/require-permission.decorator'
import { ApiStandardError } from 'src/decorators/swagger/error.decorator'
import { ApiStandardResponse } from 'src/decorators/swagger/response.decorator'
import { AuthContext } from 'src/iam/interfaces/auth-context.interface'
import { ClinicalService } from './clinical.service'
import { CreateEncounterRequestDto } from './dto/request/create-encounter-request.dto'
import { CreateClinicalNoteRequestDto } from './dto/request/create-clinical-note-request.dto'
import { CreateVitalSignsRequestDto } from './dto/request/create-vital-signs-request.dto'
import { CreateDiagnosisRequestDto } from './dto/request/create-diagnosis-request.dto'
import { EncounterResponseDto } from './dto/response/encounter-response.dto'
import { ClinicalNoteResponseDto } from './dto/response/clinical-note-response.dto'
import { VitalSignResponseDto } from './dto/response/vital-sign-response.dto'
import { DiagnosisResponseDto } from './dto/response/diagnosis-response.dto'
import { EncounterStatus } from './model/encounter.entity'

@Controller('clinical/encounters')
export class ClinicalController {
  constructor(private readonly clinicalService: ClinicalService) {}

  @ApiBearerAuth('JWT-auth')
  @Post()
  @HttpCode(201)
  @RequirePermission('clinical:write')
  @ApiOperation({ summary: 'Open a clinical encounter' })
  @ApiStandardResponse(EncounterResponseDto, 201)
  @ApiStandardError()
  async openEncounter(@CurrentUser() ctx: AuthContext, @Body() dto: CreateEncounterRequestDto): Promise<EncounterResponseDto> {
    return this.clinicalService.openEncounter(dto, ctx.tenantId, ctx.facilityId, ctx.userId)
  }

  @ApiBearerAuth('JWT-auth')
  @Get()
  @HttpCode(200)
  @RequirePermission('clinical:read')
  @ApiOperation({ summary: 'List clinical encounters' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'closed'] })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiStandardResponse(EncounterResponseDto, 200)
  @ApiStandardError()
  async findAll(
    @CurrentUser() ctx: AuthContext,
    @Query('patientId') patientId?: string,
    @Query('status') status?: EncounterStatus,
    @Query('from') from?: string,
    @Query('to') to?: string
  ): Promise<EncounterResponseDto[]> {
    return this.clinicalService.findAll(ctx.tenantId, ctx.facilityId, { patientId, status, from, to })
  }

  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @HttpCode(200)
  @RequirePermission('clinical:read')
  @ApiOperation({ summary: 'Get an encounter with notes, vital signs and diagnoses' })
  @ApiStandardResponse(EncounterResponseDto, 200)
  @ApiStandardError()
  async findById(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<EncounterResponseDto> {
    return this.clinicalService.findById(id, ctx.tenantId, ctx.facilityId)
  }

  @ApiBearerAuth('JWT-auth')
  @Patch(':id/close')
  @HttpCode(200)
  @RequirePermission('clinical:write')
  @ApiOperation({ summary: 'Close a clinical encounter' })
  @ApiStandardResponse(EncounterResponseDto, 200)
  @ApiStandardError()
  async closeEncounter(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<EncounterResponseDto> {
    return this.clinicalService.closeEncounter(id, ctx.tenantId, ctx.facilityId, ctx.userId)
  }

  @ApiBearerAuth('JWT-auth')
  @Post(':id/notes')
  @HttpCode(201)
  @RequirePermission('clinical:write')
  @ApiOperation({ summary: 'Append a clinical note or amendment' })
  @ApiStandardResponse(ClinicalNoteResponseDto, 201)
  @ApiStandardError()
  async addNote(
    @CurrentUser() ctx: AuthContext,
    @Param('id') id: string,
    @Body() dto: CreateClinicalNoteRequestDto
  ): Promise<ClinicalNoteResponseDto> {
    return this.clinicalService.addNote(id, dto, ctx.tenantId, ctx.facilityId, ctx.userId)
  }

  @ApiBearerAuth('JWT-auth')
  @Get(':id/notes')
  @HttpCode(200)
  @RequirePermission('clinical:read')
  @ApiOperation({ summary: 'List clinical notes' })
  @ApiStandardResponse(ClinicalNoteResponseDto, 200)
  @ApiStandardError()
  async findNotes(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<ClinicalNoteResponseDto[]> {
    return this.clinicalService.findNotes(id, ctx.tenantId, ctx.facilityId)
  }

  @ApiBearerAuth('JWT-auth')
  @Post(':id/vital-signs')
  @HttpCode(201)
  @RequirePermission('clinical:write')
  @ApiOperation({ summary: 'Record vital signs' })
  @ApiStandardResponse(VitalSignResponseDto, 201)
  @ApiStandardError()
  async addVitalSigns(
    @CurrentUser() ctx: AuthContext,
    @Param('id') id: string,
    @Body() dto: CreateVitalSignsRequestDto
  ): Promise<VitalSignResponseDto> {
    return this.clinicalService.addVitalSigns(id, dto, ctx.tenantId, ctx.facilityId, ctx.userId)
  }

  @ApiBearerAuth('JWT-auth')
  @Get(':id/vital-signs')
  @HttpCode(200)
  @RequirePermission('clinical:read')
  @ApiOperation({ summary: 'List vital signs' })
  @ApiStandardResponse(VitalSignResponseDto, 200)
  @ApiStandardError()
  async findVitalSigns(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<VitalSignResponseDto[]> {
    return this.clinicalService.findVitalSigns(id, ctx.tenantId, ctx.facilityId)
  }

  @ApiBearerAuth('JWT-auth')
  @Post(':id/diagnoses')
  @HttpCode(201)
  @RequirePermission('clinical:write')
  @ApiOperation({ summary: 'Append a diagnosis or amendment' })
  @ApiStandardResponse(DiagnosisResponseDto, 201)
  @ApiStandardError()
  async addDiagnosis(
    @CurrentUser() ctx: AuthContext,
    @Param('id') id: string,
    @Body() dto: CreateDiagnosisRequestDto
  ): Promise<DiagnosisResponseDto> {
    return this.clinicalService.addDiagnosis(id, dto, ctx.tenantId, ctx.facilityId, ctx.userId)
  }

  @ApiBearerAuth('JWT-auth')
  @Get(':id/diagnoses')
  @HttpCode(200)
  @RequirePermission('clinical:read')
  @ApiOperation({ summary: 'List diagnoses' })
  @ApiStandardResponse(DiagnosisResponseDto, 200)
  @ApiStandardError()
  async findDiagnoses(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<DiagnosisResponseDto[]> {
    return this.clinicalService.findDiagnoses(id, ctx.tenantId, ctx.facilityId)
  }
}
