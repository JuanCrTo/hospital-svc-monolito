import { Body, Controller, Get, Param, Post, Patch } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { CurrentUser } from 'src/decorators/request/current-user.decorator'
import { RequirePermission } from 'src/decorators/request/require-permission.decorator'
import { AuthContext } from 'src/iam/interfaces/auth-context.interface'
import { HospitalizationService } from './hospitalization.service'
import { CreateBedRequestDto } from './dto/request/create-bed-request.dto'
import { TransferBedRequestDto } from './dto/request/transfer-bed-request.dto'
import { CreateNursingNoteRequestDto } from './dto/request/create-nursing-note-request.dto'
import { AdmitPatientRequestDto } from './dto/request/admit-patient-request.dto'
@Controller('hospitalization')
@ApiBearerAuth('JWT-auth')
export class HospitalizationController {
  constructor(private readonly service: HospitalizationService) {}
  @Post('beds') @RequirePermission('bed:write') @ApiOperation({ summary: 'Crear cama' }) createBed(
    @CurrentUser() c: AuthContext,
    @Body() dto: CreateBedRequestDto
  ) {
    return this.service.createBed(dto, c.tenantId, c.facilityId)
  }
  @Get('beds') @RequirePermission('bed:read') listBeds(@CurrentUser() c: AuthContext) {
    return this.service.listBeds(c.tenantId, c.facilityId)
  }
  @Post('admissions') @RequirePermission('admission:write') admit(@CurrentUser() c: AuthContext, @Body() dto: AdmitPatientRequestDto) {
    return this.service.admit(dto, c.tenantId, c.facilityId, c.userId)
  }
  @Post('admissions/:id/transfer')
  @RequirePermission('admission:write')
  transfer(@CurrentUser() c: AuthContext, @Param('id') id: string, @Body() dto: TransferBedRequestDto) {
    return this.service.transfer(id, dto, c.tenantId, c.facilityId, c.userId)
  }
  @Post('admissions/:id/nursing-notes')
  @RequirePermission('nursing:write')
  addNote(@CurrentUser() c: AuthContext, @Param('id') id: string, @Body() dto: CreateNursingNoteRequestDto) {
    return this.service.addNursingNote(id, dto, c.tenantId, c.facilityId, c.userId)
  }
  @Get('admissions/:id/nursing-notes')
  @RequirePermission('nursing:read')
  notes(@CurrentUser() c: AuthContext, @Param('id') id: string) {
    return this.service.listNursingNotes(id, c.tenantId, c.facilityId)
  }
  @Patch('admissions/:id/discharge') @RequirePermission('admission:write') discharge(@CurrentUser() c: AuthContext, @Param('id') id: string) {
    return this.service.discharge(id, c.tenantId, c.facilityId)
  }
}
