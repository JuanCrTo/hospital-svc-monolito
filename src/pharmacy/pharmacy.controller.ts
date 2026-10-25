import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { CurrentUser } from 'src/decorators/request/current-user.decorator'
import { RequirePermission } from 'src/decorators/request/require-permission.decorator'
import { AuthContext } from 'src/iam/interfaces/auth-context.interface'
import { PharmacyService } from './pharmacy.service'
import { CreateMedicationRequestDto } from './dto/request/create-medication-request.dto'
import { CreateStockMovementRequestDto } from './dto/request/create-stock-movement-request.dto'
import { CreatePrescriptionRequestDto } from './dto/request/create-prescription-request.dto'
import { UpdateMedicationStatusRequestDto } from './dto/request/update-medication-status-request.dto'
@Controller('pharmacy')
@ApiBearerAuth('JWT-auth')
export class PharmacyController {
  constructor(private readonly service: PharmacyService) {}
  @Post('medications') @RequirePermission('medication:write') @ApiOperation({ summary: 'Crear medicamento' }) create(
    @CurrentUser() c: AuthContext,
    @Body() dto: CreateMedicationRequestDto
  ) {
    return this.service.createMedication(dto, c.tenantId, c.userId)
  }
  @Get('medications') @RequirePermission('medication:read') list(@CurrentUser() c: AuthContext) {
    return this.service.listMedications(c.tenantId)
  }
  @Patch('medications/:id/status') @RequirePermission('medication:write') status(
    @CurrentUser() c: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateMedicationStatusRequestDto
  ) {
    return this.service.updateStatus(id, dto, c.tenantId)
  }
  @Get('inventory') @RequirePermission('inventory:read') inventory(@CurrentUser() c: AuthContext) {
    return this.service.listInventory(c.tenantId, c.facilityId)
  }
  @Post('prescriptions')
  @RequirePermission('prescription:write')
  @ApiOperation({ summary: 'Crear prescripción clínica' })
  prescription(@CurrentUser() c: AuthContext, @Body() dto: CreatePrescriptionRequestDto) {
    return this.service.createPrescription(dto, c.tenantId, c.facilityId, c.userId)
  }

  @Get('prescriptions')
  @RequirePermission('prescription:read')
  prescriptions(@CurrentUser() c: AuthContext) {
    return this.service.listPrescriptions(c.tenantId, c.facilityId)
  }

  @Post('prescriptions/:id/dispense')
  @RequirePermission('dispensing:write')
  dispense(@CurrentUser() c: AuthContext, @Param('id') id: string) {
    return this.service.dispense(id, c.tenantId, c.facilityId, c.userId)
  }

  @Post('inventory/movements') @RequirePermission('inventory:write') movement(
    @CurrentUser() c: AuthContext,
    @Body() dto: CreateStockMovementRequestDto
  ) {
    return this.service.recordMovement(dto, c.tenantId, c.facilityId, c.userId)
  }
}
