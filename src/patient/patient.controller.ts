import { Body, Controller, Get, HttpCode, Param, Patch, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { PatientService } from './patient.service'
import { UpdatePatientRequestDto } from './dto/request/update-patient-request.dto'
import { CurrentUser } from 'src/decorators/request/current-user.decorator'
import { RequirePermission } from 'src/decorators/request/require-permission.decorator'
import { ApiStandardError } from 'src/decorators/swagger/error.decorator'
import { ApiStandardResponse } from 'src/decorators/swagger/response.decorator'
import { AuthContext } from 'src/iam/interfaces/auth-context.interface'
import { PatientResponseDto } from './dto/response/patient-response.dto'

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @ApiBearerAuth('JWT-auth')
  @Get()
  @RequirePermission('patient:read')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get all patients or filter by query params' })
  @ApiQuery({ name: 'identification', required: false, description: 'Filter by identification' })
  @ApiQuery({ name: 'age', required: false, description: 'Filter by age' })
  @ApiQuery({ name: 'firstname', required: false, description: 'Filter by firstname' })
  @ApiQuery({ name: 'lastname', required: false, description: 'Filter by lastname' })
  @ApiStandardResponse(PatientResponseDto, 200)
  @ApiStandardError()
  async findAll(
    @CurrentUser() ctx: AuthContext,
    @Query('identification') identification?: string,
    @Query('age') age?: string,
    @Query('firstname') firstname?: string,
    @Query('lastname') lastname?: string
  ): Promise<PatientResponseDto[]> {
    return this.patientService.findAll(ctx.tenantId, {
      identification,
      age: age !== undefined ? Number(age) : undefined,
      firstname,
      lastname
    })
  }

  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @RequirePermission('patient:read')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get patient by ID' })
  @ApiStandardResponse(PatientResponseDto, 200)
  @ApiStandardError()
  async findById(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<PatientResponseDto> {
    return this.patientService.findById(id, ctx.tenantId)
  }

  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @RequirePermission('patient:write')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update a patient by ID' })
  @ApiStandardResponse(PatientResponseDto, 200)
  @ApiStandardError()
  @ApiBody({
    description: 'Patient data',
    type: UpdatePatientRequestDto
  })
  async update(@CurrentUser() ctx: AuthContext, @Param('id') id: string, @Body() dto: UpdatePatientRequestDto): Promise<PatientResponseDto> {
    return this.patientService.update(id, ctx.tenantId, dto)
  }
}
