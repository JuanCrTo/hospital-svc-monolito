import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { CurrentUser } from 'src/decorators/request/current-user.decorator'
import { RequirePermission } from 'src/decorators/request/require-permission.decorator'
import { ApiStandardError } from 'src/decorators/swagger/error.decorator'
import { ApiStandardResponse } from 'src/decorators/swagger/response.decorator'
import { PermissionsGuard } from 'src/common/guards/permissions.guard'
import { AssignFacilityRequestDto } from './dto/request/assign-facility-request.dto'
import { AssignRoleRequestDto } from './dto/request/assign-role-request.dto'
import { CreateDepartmentRequestDto } from './dto/request/create-department-request.dto'
import { CreateFacilityRequestDto } from './dto/request/create-facility-request.dto'
import { CreateMembershipRequestDto } from './dto/request/create-membership-request.dto'
import { CreateRoleRequestDto } from './dto/request/create-role-request.dto'
import { UpdateDepartmentRequestDto } from './dto/request/update-department-request.dto'
import { UpdateFacilityRequestDto } from './dto/request/update-facility-request.dto'
import { UpdateMembershipStatusRequestDto } from './dto/request/update-membership-status-request.dto'
import { UpdateRoleRequestDto } from './dto/request/update-role-request.dto'
import { DepartmentResponseDto } from './dto/response/department-response.dto'
import { FacilityResponseDto } from './dto/response/facility-response.dto'
import { MembershipResponseDto } from './dto/response/membership-response.dto'
import { PermissionResponseDto } from './dto/response/permission-response.dto'
import { RoleResponseDto } from './dto/response/role-response.dto'
import { TenantResponseDto } from './dto/response/tenant-response.dto'
import { IamService } from './iam.service'
import { AuthContext } from './interfaces/auth-context.interface'
import { mapTenantToDto } from './mapper/tenant-response.mapper'

@ApiBearerAuth('JWT-auth')
@UseGuards(PermissionsGuard)
@Controller('iam')
export class IamController {
  constructor(private readonly iamService: IamService) {}

  @Get('tenant')
  @HttpCode(200)
  @RequirePermission('tenant:read')
  @ApiOperation({ summary: 'Get the active tenant' })
  @ApiStandardResponse(TenantResponseDto, 200)
  @ApiStandardError()
  async getTenant(@CurrentUser() ctx: AuthContext): Promise<TenantResponseDto> {
    return mapTenantToDto(await this.iamService.getCurrentTenant(ctx))
  }

  @Get('facilities')
  @HttpCode(200)
  @RequirePermission('facility:read')
  @ApiOperation({ summary: 'List facilities of the active tenant' })
  @ApiStandardResponse(FacilityResponseDto, 200)
  @ApiStandardError()
  listFacilities(@CurrentUser() ctx: AuthContext): Promise<FacilityResponseDto[]> {
    return this.iamService.listFacilities(ctx)
  }

  @Get('facilities/:id')
  @HttpCode(200)
  @RequirePermission('facility:read')
  @ApiOperation({ summary: 'Get a facility by id' })
  @ApiStandardResponse(FacilityResponseDto, 200)
  @ApiStandardError()
  getFacility(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<FacilityResponseDto> {
    return this.iamService.getFacility(ctx, id)
  }

  @Post('facilities')
  @HttpCode(201)
  @RequirePermission('facility:write')
  @ApiOperation({ summary: 'Create a facility' })
  @ApiStandardResponse(FacilityResponseDto, 201)
  @ApiStandardError()
  createFacility(@CurrentUser() ctx: AuthContext, @Body() dto: CreateFacilityRequestDto): Promise<FacilityResponseDto> {
    return this.iamService.createFacility(ctx, dto)
  }

  @Patch('facilities/:id')
  @HttpCode(200)
  @RequirePermission('facility:write')
  @ApiOperation({ summary: 'Update a facility' })
  @ApiStandardResponse(FacilityResponseDto, 200)
  @ApiStandardError()
  updateFacility(@CurrentUser() ctx: AuthContext, @Param('id') id: string, @Body() dto: UpdateFacilityRequestDto): Promise<FacilityResponseDto> {
    return this.iamService.updateFacility(ctx, id, dto)
  }

  @Get('departments')
  @HttpCode(200)
  @RequirePermission('department:read')
  @ApiOperation({ summary: 'List departments of the active tenant' })
  @ApiQuery({ name: 'facilityId', required: false })
  @ApiStandardResponse(DepartmentResponseDto, 200)
  @ApiStandardError()
  listDepartments(@CurrentUser() ctx: AuthContext, @Query('facilityId') facilityId?: string): Promise<DepartmentResponseDto[]> {
    return this.iamService.listDepartments(ctx, facilityId)
  }

  @Get('departments/:id')
  @HttpCode(200)
  @RequirePermission('department:read')
  @ApiOperation({ summary: 'Get a department by id' })
  @ApiStandardResponse(DepartmentResponseDto, 200)
  @ApiStandardError()
  getDepartment(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<DepartmentResponseDto> {
    return this.iamService.getDepartment(ctx, id)
  }

  @Post('departments')
  @HttpCode(201)
  @RequirePermission('department:write')
  @ApiOperation({ summary: 'Create a department' })
  @ApiStandardResponse(DepartmentResponseDto, 201)
  @ApiStandardError()
  createDepartment(@CurrentUser() ctx: AuthContext, @Body() dto: CreateDepartmentRequestDto): Promise<DepartmentResponseDto> {
    return this.iamService.createDepartment(ctx, dto)
  }

  @Patch('departments/:id')
  @HttpCode(200)
  @RequirePermission('department:write')
  @ApiOperation({ summary: 'Update a department' })
  @ApiStandardResponse(DepartmentResponseDto, 200)
  @ApiStandardError()
  updateDepartment(
    @CurrentUser() ctx: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentRequestDto
  ): Promise<DepartmentResponseDto> {
    return this.iamService.updateDepartment(ctx, id, dto)
  }

  @Get('permissions')
  @HttpCode(200)
  @RequirePermission('role:read')
  @ApiOperation({ summary: 'List available permissions' })
  @ApiStandardResponse(PermissionResponseDto, 200)
  @ApiStandardError()
  listPermissions(): Promise<PermissionResponseDto[]> {
    return this.iamService.listPermissions()
  }

  @Get('roles')
  @HttpCode(200)
  @RequirePermission('role:read')
  @ApiOperation({ summary: 'List roles of the active tenant' })
  @ApiStandardResponse(RoleResponseDto, 200)
  @ApiStandardError()
  listRoles(@CurrentUser() ctx: AuthContext): Promise<RoleResponseDto[]> {
    return this.iamService.listRoles(ctx)
  }

  @Get('roles/:id')
  @HttpCode(200)
  @RequirePermission('role:read')
  @ApiOperation({ summary: 'Get a role by id' })
  @ApiStandardResponse(RoleResponseDto, 200)
  @ApiStandardError()
  getRole(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<RoleResponseDto> {
    return this.iamService.getRole(ctx, id)
  }

  @Post('roles')
  @HttpCode(201)
  @RequirePermission('role:write')
  @ApiOperation({ summary: 'Create a role with permissions' })
  @ApiStandardResponse(RoleResponseDto, 201)
  @ApiStandardError()
  createRole(@CurrentUser() ctx: AuthContext, @Body() dto: CreateRoleRequestDto): Promise<RoleResponseDto> {
    return this.iamService.createRole(ctx, dto)
  }

  @Patch('roles/:id')
  @HttpCode(200)
  @RequirePermission('role:write')
  @ApiOperation({ summary: 'Update a role and its permissions' })
  @ApiStandardResponse(RoleResponseDto, 200)
  @ApiStandardError()
  updateRole(@CurrentUser() ctx: AuthContext, @Param('id') id: string, @Body() dto: UpdateRoleRequestDto): Promise<RoleResponseDto> {
    return this.iamService.updateRole(ctx, id, dto)
  }

  @Get('memberships')
  @HttpCode(200)
  @RequirePermission('membership:read')
  @ApiOperation({ summary: 'List memberships of the active tenant' })
  @ApiStandardResponse(MembershipResponseDto, 200)
  @ApiStandardError()
  listMemberships(@CurrentUser() ctx: AuthContext): Promise<MembershipResponseDto[]> {
    return this.iamService.listMemberships(ctx)
  }

  @Get('memberships/:id')
  @HttpCode(200)
  @RequirePermission('membership:read')
  @ApiOperation({ summary: 'Get a membership by id' })
  @ApiStandardResponse(MembershipResponseDto, 200)
  @ApiStandardError()
  getMembership(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<MembershipResponseDto> {
    return this.iamService.getMembership(ctx, id)
  }

  @Post('memberships')
  @HttpCode(201)
  @RequirePermission('membership:write')
  @ApiOperation({ summary: 'Create a membership for an existing user' })
  @ApiStandardResponse(MembershipResponseDto, 201)
  @ApiStandardError()
  createMembership(@CurrentUser() ctx: AuthContext, @Body() dto: CreateMembershipRequestDto): Promise<MembershipResponseDto> {
    return this.iamService.createMembership(ctx, dto)
  }

  @Patch('memberships/:id/status')
  @HttpCode(200)
  @RequirePermission('membership:write')
  @ApiOperation({ summary: 'Change membership status' })
  @ApiStandardResponse(MembershipResponseDto, 200)
  @ApiStandardError()
  updateMembershipStatus(
    @CurrentUser() ctx: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateMembershipStatusRequestDto
  ): Promise<MembershipResponseDto> {
    return this.iamService.updateMembershipStatus(ctx, id, dto)
  }

  @Post('memberships/:id/roles')
  @HttpCode(201)
  @RequirePermission('membership:write')
  @ApiOperation({ summary: 'Assign a role to a membership' })
  @ApiStandardResponse(MembershipResponseDto, 201)
  @ApiStandardError()
  assignRole(@CurrentUser() ctx: AuthContext, @Param('id') id: string, @Body() dto: AssignRoleRequestDto): Promise<MembershipResponseDto> {
    return this.iamService.assignRole(ctx, id, dto)
  }

  @Delete('memberships/:id/roles/:membershipRoleId')
  @HttpCode(204)
  @RequirePermission('membership:write')
  @ApiOperation({ summary: 'Remove a role from a membership' })
  @ApiStandardResponse(null, 204)
  @ApiStandardError()
  removeRole(@CurrentUser() ctx: AuthContext, @Param('id') id: string, @Param('membershipRoleId') membershipRoleId: string): Promise<void> {
    return this.iamService.removeRole(ctx, id, membershipRoleId)
  }

  @Post('memberships/:id/facilities')
  @HttpCode(201)
  @RequirePermission('membership:write')
  @ApiOperation({ summary: 'Assign a facility to a membership' })
  @ApiStandardResponse(MembershipResponseDto, 201)
  @ApiStandardError()
  assignFacility(@CurrentUser() ctx: AuthContext, @Param('id') id: string, @Body() dto: AssignFacilityRequestDto): Promise<MembershipResponseDto> {
    return this.iamService.assignFacility(ctx, id, dto)
  }
}
