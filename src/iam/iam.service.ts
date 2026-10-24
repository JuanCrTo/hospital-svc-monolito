import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Repository } from 'typeorm'
import { AuditService } from 'src/common/logging/audit/audit.service'
import { Facility } from 'src/facility/model/facility.entity'
import { Tenant } from 'src/tenant/model/tenant.entity'
import { UserEntity } from 'src/user/model/user.entity'
import { UserService } from 'src/user/user.service'
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
import { AuthContext } from './interfaces/auth-context.interface'
import { IamAccessService } from './iam-access.service'
import { mapDepartmentToDto } from './mapper/department-response.mapper'
import { mapFacilityToDto } from './mapper/facility-response.mapper'
import { mapMembershipToDto } from './mapper/membership-response.mapper'
import { mapPermissionToDto } from './mapper/permission-response.mapper'
import { mapRoleToDto } from './mapper/role-response.mapper'
import { Department } from './model/department.entity'
import { FacilityAssignment } from './model/facility-assignment.entity'
import { MembershipRole } from './model/membership-role.entity'
import { Membership } from './model/membership.entity'
import { Permission } from './model/permission.entity'
import { RefreshTokenService } from './refresh-token.service'
import { RolePermission } from './model/role-permission.entity'
import { Role } from './model/role.entity'

export interface AvailableContext {
  tenantId: string
  facilityId: string | null
  permissionsVersion: number
}

@Injectable()
export class IamService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(MembershipRole)
    private readonly membershipRoleRepository: Repository<MembershipRole>,
    @InjectRepository(FacilityAssignment)
    private readonly facilityAssignmentRepository: Repository<FacilityAssignment>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly dataSource: DataSource,
    private readonly accessService: IamAccessService,
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly auditService: AuditService
  ) {}

  async getCurrentTenant(ctx: AuthContext): Promise<Tenant> {
    const tenantId = this.requireTenant(ctx)
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } })
    if (!tenant) throw new NotFoundException('Tenant not found')
    return tenant
  }

  async listFacilities(ctx: AuthContext): Promise<FacilityResponseDto[]> {
    const tenantId = this.requireTenant(ctx)
    const facilities = await this.facilityRepository.find({ where: { tenantId }, order: { name: 'ASC' } })
    return facilities.map(mapFacilityToDto)
  }

  async getFacility(ctx: AuthContext, id: string): Promise<FacilityResponseDto> {
    const facility = await this.findFacility(ctx, id)
    return mapFacilityToDto(facility)
  }

  async createFacility(ctx: AuthContext, dto: CreateFacilityRequestDto): Promise<FacilityResponseDto> {
    const tenantId = this.requireTenant(ctx)
    const duplicated = await this.facilityRepository.findOne({ where: { tenantId, code: dto.code } })
    if (duplicated) throw new ConflictException('Facility code already exists')

    const facility = this.facilityRepository.create({
      tenantId,
      name: dto.name,
      code: dto.code,
      timezone: dto.timezone ?? 'America/Bogota',
      status: dto.status ?? 'active'
    })
    const saved = await this.facilityRepository.save(facility)

    await this.auditService.record({
      action: 'CREATE',
      resourceType: 'facility',
      resourceId: saved.id,
      afterSummary: { name: saved.name, code: saved.code, status: saved.status }
    })

    return mapFacilityToDto(saved)
  }

  async updateFacility(ctx: AuthContext, id: string, dto: UpdateFacilityRequestDto): Promise<FacilityResponseDto> {
    const facility = await this.findFacility(ctx, id)
    const before = { name: facility.name, code: facility.code, status: facility.status }

    if (dto.code && dto.code !== facility.code) {
      const duplicated = await this.facilityRepository.findOne({
        where: { tenantId: facility.tenantId, code: dto.code }
      })
      if (duplicated) throw new ConflictException('Facility code already exists')
      facility.code = dto.code
    }
    if (dto.name !== undefined) facility.name = dto.name
    if (dto.timezone !== undefined) facility.timezone = dto.timezone
    if (dto.status !== undefined) facility.status = dto.status

    const saved = await this.facilityRepository.save(facility)

    await this.auditService.record({
      action: 'UPDATE',
      resourceType: 'facility',
      resourceId: saved.id,
      beforeSummary: before,
      afterSummary: { name: saved.name, code: saved.code, status: saved.status }
    })

    return mapFacilityToDto(saved)
  }

  async listDepartments(ctx: AuthContext, facilityId?: string): Promise<DepartmentResponseDto[]> {
    const tenantId = this.requireTenant(ctx)
    const where: Record<string, unknown> = { tenantId }
    if (facilityId) where.facilityId = facilityId
    const departments = await this.departmentRepository.find({ where, order: { name: 'ASC' } })
    return departments.map(mapDepartmentToDto)
  }

  async getDepartment(ctx: AuthContext, id: string): Promise<DepartmentResponseDto> {
    const department = await this.findDepartment(ctx, id)
    return mapDepartmentToDto(department)
  }

  async createDepartment(ctx: AuthContext, dto: CreateDepartmentRequestDto): Promise<DepartmentResponseDto> {
    const tenantId = this.requireTenant(ctx)
    await this.findFacility(ctx, dto.facilityId)

    const duplicated = await this.departmentRepository.findOne({
      where: { tenantId, facilityId: dto.facilityId, code: dto.code }
    })
    if (duplicated) throw new ConflictException('Department code already exists in this facility')

    const department = this.departmentRepository.create({
      tenantId,
      facilityId: dto.facilityId,
      name: dto.name,
      code: dto.code
    })
    const saved = await this.departmentRepository.save(department)

    await this.auditService.record({
      action: 'CREATE',
      resourceType: 'department',
      resourceId: saved.id,
      afterSummary: { name: saved.name, code: saved.code, facilityId: saved.facilityId }
    })

    return mapDepartmentToDto(saved)
  }

  async updateDepartment(ctx: AuthContext, id: string, dto: UpdateDepartmentRequestDto): Promise<DepartmentResponseDto> {
    const department = await this.findDepartment(ctx, id)
    const before = { name: department.name, code: department.code, status: department.status }

    if (dto.code && dto.code !== department.code) {
      const duplicated = await this.departmentRepository.findOne({
        where: { tenantId: department.tenantId, facilityId: department.facilityId, code: dto.code }
      })
      if (duplicated) throw new ConflictException('Department code already exists in this facility')
      department.code = dto.code
    }
    if (dto.name !== undefined) department.name = dto.name
    if (dto.status !== undefined) department.status = dto.status

    const saved = await this.departmentRepository.save(department)

    await this.auditService.record({
      action: 'UPDATE',
      resourceType: 'department',
      resourceId: saved.id,
      beforeSummary: before,
      afterSummary: { name: saved.name, code: saved.code, status: saved.status }
    })

    return mapDepartmentToDto(saved)
  }

  async listPermissions(): Promise<PermissionResponseDto[]> {
    const permissions = await this.permissionRepository.find({ order: { code: 'ASC' } })
    return permissions.map(mapPermissionToDto)
  }

  async listRoles(ctx: AuthContext): Promise<RoleResponseDto[]> {
    const tenantId = this.requireTenant(ctx)
    const roles = await this.roleRepository.find({ where: { tenantId }, order: { name: 'ASC' } })
    return Promise.all(roles.map(role => this.roleWithPermissions(role)))
  }

  async getRole(ctx: AuthContext, id: string): Promise<RoleResponseDto> {
    const role = await this.findRole(ctx, id)
    return this.roleWithPermissions(role)
  }

  async createRole(ctx: AuthContext, dto: CreateRoleRequestDto): Promise<RoleResponseDto> {
    const tenantId = this.requireTenant(ctx)
    const duplicated = await this.roleRepository.findOne({ where: { tenantId, code: dto.code } })
    if (duplicated) throw new ConflictException('Role code already exists')

    const permissions = await this.resolvePermissions(dto.permissions)

    const role = await this.dataSource.transaction(async manager => {
      const saved = await manager.save(
        manager.create(Role, {
          tenantId,
          name: dto.name,
          code: dto.code,
          description: dto.description ?? null
        })
      )
      if (permissions.length > 0) {
        await manager.insert(
          RolePermission,
          permissions.map(permission => ({ roleId: saved.id, permissionId: permission.id }))
        )
      }
      return saved
    })

    await this.auditService.record({
      action: 'CREATE',
      resourceType: 'role',
      resourceId: role.id,
      afterSummary: { name: role.name, code: role.code, permissions: dto.permissions }
    })

    return this.roleWithPermissions(role)
  }

  async updateRole(ctx: AuthContext, id: string, dto: UpdateRoleRequestDto): Promise<RoleResponseDto> {
    const role = await this.findRole(ctx, id)
    const before = { name: role.name, status: role.status }
    const permissions = dto.permissions ? await this.resolvePermissions(dto.permissions) : null

    await this.dataSource.transaction(async manager => {
      if (dto.name !== undefined) role.name = dto.name
      if (dto.description !== undefined) role.description = dto.description
      if (dto.status !== undefined) role.status = dto.status
      await manager.save(role)

      if (permissions) {
        await manager.delete(RolePermission, { roleId: role.id })
        if (permissions.length > 0) {
          await manager.insert(
            RolePermission,
            permissions.map(permission => ({ roleId: role.id, permissionId: permission.id }))
          )
        }
      }

      if (permissions || dto.status !== undefined) {
        await this.bumpMembershipsForRole(manager, role.id)
      }
    })

    await this.auditService.record({
      action: 'UPDATE',
      resourceType: 'role',
      resourceId: role.id,
      beforeSummary: before,
      afterSummary: { name: role.name, status: role.status, permissions: dto.permissions ?? undefined }
    })

    return this.roleWithPermissions(role)
  }

  async listMemberships(ctx: AuthContext): Promise<MembershipResponseDto[]> {
    const tenantId = this.requireTenant(ctx)
    const memberships = await this.membershipRepository.find({ where: { tenantId }, order: { createdAt: 'ASC' } })
    return Promise.all(memberships.map(membership => this.membershipResponse(membership)))
  }

  async getMembership(ctx: AuthContext, id: string): Promise<MembershipResponseDto> {
    const membership = await this.findMembership(ctx, id)
    return this.membershipResponse(membership)
  }

  async createMembership(ctx: AuthContext, dto: CreateMembershipRequestDto): Promise<MembershipResponseDto> {
    const tenantId = this.requireTenant(ctx)
    const user = await this.userService.findByEmailRaw(dto.email)
    if (!user) throw new NotFoundException('User not found')

    const existing = await this.membershipRepository.findOne({ where: { userId: user.id, tenantId } })
    if (existing) throw new ConflictException('User already belongs to this tenant')

    const roles = dto.roleIds?.length ? await this.findRolesByIds(tenantId, dto.roleIds) : []

    const membership = await this.dataSource.transaction(async manager => {
      const saved = await manager.save(manager.create(Membership, { userId: user.id, tenantId }))
      if (roles.length > 0) {
        await manager.insert(
          MembershipRole,
          roles.map(role => ({ membershipId: saved.id, roleId: role.id, facilityId: null }))
        )
      }
      return saved
    })

    await this.auditService.record({
      action: 'CREATE',
      resourceType: 'membership',
      resourceId: membership.id,
      afterSummary: { userId: user.id, tenantId, roleIds: roles.map(role => role.id) }
    })

    return this.membershipResponse(membership)
  }

  async updateMembershipStatus(ctx: AuthContext, id: string, dto: UpdateMembershipStatusRequestDto): Promise<MembershipResponseDto> {
    const membership = await this.findMembership(ctx, id)
    const before = { status: membership.status }

    membership.status = dto.status
    membership.permissionsVersion += 1
    await this.membershipRepository.save(membership)

    if (dto.status !== 'active') {
      await this.refreshTokenService.revokeForUserTenant(membership.userId, membership.tenantId)
    }

    await this.auditService.record({
      action: 'STATE_CHANGE',
      resourceType: 'membership',
      resourceId: membership.id,
      beforeSummary: before,
      afterSummary: { status: membership.status }
    })

    return this.membershipResponse(membership)
  }

  async assignRole(ctx: AuthContext, membershipId: string, dto: AssignRoleRequestDto): Promise<MembershipResponseDto> {
    const membership = await this.findMembership(ctx, membershipId)
    const role = await this.findRole(ctx, dto.roleId)

    if (dto.facilityId) {
      await this.findFacility(ctx, dto.facilityId)
      const assignment = await this.facilityAssignmentRepository.findOne({
        where: { membershipId: membership.id, facilityId: dto.facilityId, status: 'active' }
      })
      if (!assignment) throw new BadRequestException('Facility must be assigned to the membership first')
    }

    const duplicated = await this.membershipRoleRepository.findOne({
      where: { membershipId: membership.id, roleId: role.id, facilityId: dto.facilityId ?? null }
    })
    if (duplicated) throw new ConflictException('Role already assigned')

    const saved = await this.membershipRoleRepository.save(
      this.membershipRoleRepository.create({
        membershipId: membership.id,
        roleId: role.id,
        facilityId: dto.facilityId ?? null
      })
    )

    await this.bumpMembershipVersion(membership.id)
    membership.permissionsVersion += 1

    await this.auditService.record({
      action: 'UPDATE',
      resourceType: 'membership',
      resourceId: membership.id,
      afterSummary: { membershipRoleId: saved.id, roleId: role.id, facilityId: saved.facilityId }
    })

    return this.membershipResponse(membership)
  }

  async removeRole(ctx: AuthContext, membershipId: string, membershipRoleId: string): Promise<void> {
    const membership = await this.findMembership(ctx, membershipId)
    const membershipRole = await this.membershipRoleRepository.findOne({
      where: { id: membershipRoleId, membershipId: membership.id }
    })
    if (!membershipRole) throw new NotFoundException('Membership role not found')

    await this.membershipRoleRepository.delete(membershipRole.id)
    await this.bumpMembershipVersion(membership.id)

    await this.auditService.record({
      action: 'UPDATE',
      resourceType: 'membership',
      resourceId: membership.id,
      beforeSummary: { membershipRoleId: membershipRole.id, roleId: membershipRole.roleId }
    })
  }

  async assignFacility(ctx: AuthContext, membershipId: string, dto: AssignFacilityRequestDto): Promise<MembershipResponseDto> {
    const membership = await this.findMembership(ctx, membershipId)
    await this.findFacility(ctx, dto.facilityId)

    const existing = await this.facilityAssignmentRepository.findOne({
      where: { membershipId: membership.id, facilityId: dto.facilityId }
    })
    if (existing) throw new ConflictException('Facility already assigned')

    const saved = await this.facilityAssignmentRepository.save(
      this.facilityAssignmentRepository.create({ membershipId: membership.id, facilityId: dto.facilityId })
    )

    await this.auditService.record({
      action: 'UPDATE',
      resourceType: 'membership',
      resourceId: membership.id,
      afterSummary: { facilityAssignmentId: saved.id, facilityId: saved.facilityId }
    })

    return this.membershipResponse(membership)
  }

  async listAvailableContexts(userId: string): Promise<AvailableContext[]> {
    const memberships = await this.membershipRepository.find({ where: { userId, status: 'active' } })
    const contexts: AvailableContext[] = []

    for (const membership of memberships) {
      const assignments = await this.facilityAssignmentRepository.find({
        where: { membershipId: membership.id, status: 'active' }
      })
      if (assignments.length === 0) {
        contexts.push({
          tenantId: membership.tenantId,
          facilityId: null,
          permissionsVersion: membership.permissionsVersion
        })
        continue
      }
      for (const assignment of assignments) {
        contexts.push({
          tenantId: membership.tenantId,
          facilityId: assignment.facilityId,
          permissionsVersion: membership.permissionsVersion
        })
      }
    }

    return contexts
  }

  async getContext(userId: string, tenantId: string, facilityId: string | null) {
    const resolved = await this.accessService.resolve(userId, tenantId, facilityId)
    if (!resolved) throw new ForbiddenException('No active membership for this context')
    return {
      membership: resolved.membership,
      permissionsVersion: resolved.membership.permissionsVersion,
      permissions: resolved.permissions
    }
  }

  private requireTenant(ctx: AuthContext): string {
    if (!ctx.tenantId) throw new ForbiddenException('Active tenant context is required')
    return ctx.tenantId
  }

  private async findFacility(ctx: AuthContext, id: string): Promise<Facility> {
    const tenantId = this.requireTenant(ctx)
    const facility = await this.facilityRepository.findOne({ where: { id, tenantId } })
    if (!facility) throw new NotFoundException('Facility not found')
    return facility
  }

  private async findDepartment(ctx: AuthContext, id: string): Promise<Department> {
    const tenantId = this.requireTenant(ctx)
    const department = await this.departmentRepository.findOne({ where: { id, tenantId } })
    if (!department) throw new NotFoundException('Department not found')
    return department
  }

  private async findRole(ctx: AuthContext, id: string): Promise<Role> {
    const tenantId = this.requireTenant(ctx)
    const role = await this.roleRepository.findOne({ where: { id, tenantId } })
    if (!role) throw new NotFoundException('Role not found')
    return role
  }

  private async findMembership(ctx: AuthContext, id: string): Promise<Membership> {
    const tenantId = this.requireTenant(ctx)
    const membership = await this.membershipRepository.findOne({ where: { id, tenantId } })
    if (!membership) throw new NotFoundException('Membership not found')
    return membership
  }

  private async findRolesByIds(tenantId: string, ids: string[]): Promise<Role[]> {
    const roles = await this.roleRepository.find({ where: { tenantId, id: In(ids), status: 'active' } })
    if (roles.length !== new Set(ids).size) throw new BadRequestException('Invalid role id')
    return roles
  }

  private async resolvePermissions(codes: string[]): Promise<Permission[]> {
    if (codes.length === 0) return []
    const permissions = await this.permissionRepository.find({ where: { code: In(codes) } })
    if (permissions.length !== new Set(codes).size) throw new BadRequestException('Invalid permission code')
    return permissions
  }

  private async roleWithPermissions(role: Role): Promise<RoleResponseDto> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId: role.id },
      relations: { permission: true }
    })
    return mapRoleToDto(
      role,
      rolePermissions.map(rolePermission => rolePermission.permission)
    )
  }

  private async membershipResponse(membership: Membership): Promise<MembershipResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: membership.userId } })
    const roles = await this.membershipRoleRepository.find({
      where: { membershipId: membership.id },
      relations: { role: true }
    })
    const assignments = await this.facilityAssignmentRepository.find({
      where: { membershipId: membership.id },
      relations: { facility: true }
    })
    return mapMembershipToDto(membership, user?.email ?? '', roles, assignments)
  }

  private async bumpMembershipVersion(membershipId: string): Promise<void> {
    await this.dataSource
      .createQueryBuilder()
      .update(Membership)
      .set({ permissionsVersion: () => 'permissions_version + 1' })
      .where('id = :membershipId', { membershipId })
      .execute()
  }

  private async bumpMembershipsForRole(manager: DataSource['manager'], roleId: string): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(Membership)
      .set({ permissionsVersion: () => 'permissions_version + 1' })
      .where('id IN (SELECT membership_id FROM membership_roles WHERE role_id = :roleId)', { roleId })
      .execute()
  }
}
