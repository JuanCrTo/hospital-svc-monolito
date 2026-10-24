import { Body, Controller, Get, HttpCode, Param, Patch, Query } from '@nestjs/common'
import { PatientService } from './patient.service'
import { UpdatePatientDto } from './dto/request/update-user-request.dto'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { RequirePermission } from 'src/decorators/request/require-permission.decorator'
import { ApiStandardError } from 'src/decorators/swagger/error.decorator'
import { ApiStandardResponse } from 'src/decorators/swagger/response.decorator'
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
    @Query('identification') identification?: string,
    @Query('age') age?: string,
    @Query('firstname') firstname?: string,
    @Query('lastname') lastname?: string
  ): Promise<PatientResponseDto[]> {
    return this.patientService.findAll({
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
  async findById(@Param('id') id: string): Promise<PatientResponseDto> {
    return this.patientService.findById(id)
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
    type: UpdatePatientDto
  })
  async update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto): Promise<PatientResponseDto> {
    return this.patientService.update(id, updatePatientDto)
  }
}
