import { Body, Controller, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AuthenticatedOnly } from 'src/decorators/request/authenticated-only.decorator'
import { ApiStandardError } from 'src/decorators/swagger/error.decorator'
import { ApiStandardResponse } from 'src/decorators/swagger/response.decorator'
import { CreateTenantRequestDto, UpdateTenantRequestDto } from './dto/request/create-tenant-request.dto'
import { TenantResponseDto } from './dto/response/tenant-response.dto'
import { IamService } from './iam.service'
import { PlatformAdminGuard } from './platform-admin.guard'

@ApiBearerAuth('JWT-auth')
@AuthenticatedOnly()
@UseGuards(PlatformAdminGuard)
@Controller('platform/tenants')
export class PlatformController {
  constructor(private readonly iamService: IamService) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'List all tenants (platform administrator)' })
  @ApiStandardResponse(TenantResponseDto, 200)
  @ApiStandardError()
  listTenants(): Promise<TenantResponseDto[]> {
    return this.iamService.listTenants()
  }

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get a tenant by id (platform administrator)' })
  @ApiStandardResponse(TenantResponseDto, 200)
  @ApiStandardError()
  getTenant(@Param('id') id: string): Promise<TenantResponseDto> {
    return this.iamService.getTenantById(id)
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a tenant and optional initial facility' })
  @ApiStandardResponse(TenantResponseDto, 201)
  @ApiStandardError()
  createTenant(@Body() dto: CreateTenantRequestDto): Promise<TenantResponseDto> {
    return this.iamService.createTenant(dto)
  }

  @Patch(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update a tenant (platform administrator)' })
  @ApiStandardResponse(TenantResponseDto, 200)
  @ApiStandardError()
  updateTenant(@Param('id') id: string, @Body() dto: UpdateTenantRequestDto): Promise<TenantResponseDto> {
    return this.iamService.updateTenant(id, dto)
  }
}
