import { ConflictException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull } from 'typeorm'
import { In, Repository } from 'typeorm'
import { CreateUserDto } from './dto/request/create-user-request.dto'
import { UserEntity } from './model/user.entity'
import { hashPassword } from 'src/utils/utils'
import { PatientService } from 'src/patient/patient.service'
import { USER_ROLES } from './enums/user-role.enum'
import { EmailService } from 'src/email/email.service'
import { Membership } from 'src/iam/model/membership.entity'
import { RefreshToken } from 'src/iam/model/refresh-token.entity'
import { UserDetailsResponseDto } from './dto/response/user-details-response.dto'
import { UserResumenResponseDto } from './dto/response/user-resumen-response.dto'
import { mapUserDetailsToDto } from './mapper/user-details-response.mapper'
import { mapUserResumenToDto } from './mapper/user-resumen-response.mapper'
import { mapPatientToDto } from 'src/patient/mapper/patient-response.mapper'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly patientService: PatientService,
    private readonly emailService: EmailService
  ) {}

  async createForTenant(createUserDto: CreateUserDto, tenantId: string): Promise<UserDetailsResponseDto> {
    const userId = await this.createRaw(createUserDto)

    let patientDetails = undefined
    try {
      await this.membershipRepository.save(this.membershipRepository.create({ userId, tenantId }))
      if (createUserDto.role === 'patient' && createUserDto.patientDetails) {
        patientDetails = await this.patientService.create(createUserDto.patientDetails, tenantId, userId)
      }
    } catch (error) {
      await this.userRepository.delete(userId)
      throw error
    }

    await this.emailService.sendEmailWelcome(userId, tenantId)

    return mapUserDetailsToDto({
      email: createUserDto.email,
      role: createUserDto.role,
      patientDetails
    })
  }

  async createRaw(createUserDto: CreateUserDto): Promise<string> {
    const existing = await this.userRepository.findOne({ where: { email: createUserDto.email } })
    if (existing) {
      throw new ConflictException('Email already registered')
    }

    const user = this.userRepository.create({
      email: createUserDto.email,
      passwordHash: await hashPassword(createUserDto.password),
      role: createUserDto.role
    })

    const saved = await this.userRepository.save(user)
    return saved.id
  }

  async findById(id: string, tenantId?: string): Promise<UserDetailsResponseDto> {
    if (!UUID_PATTERN.test(id)) return null

    const user = await this.userRepository.findOne({ where: { id } })
    if (!user) return null

    let patientDetails = undefined
    if (user.role === 'patient') {
      const patient = await this.patientService.findByUserId(id, tenantId)
      if (patient) {
        patientDetails = mapPatientToDto(patient)
      }
    }

    return mapUserDetailsToDto({
      email: user.email,
      role: user.role,
      patientDetails
    })
  }

  async findByIdForTenant(id: string, tenantId: string): Promise<UserDetailsResponseDto> {
    if (!(await this.isTenantMember(id, tenantId))) return null
    return this.findById(id, tenantId)
  }

  async findByEmailForTenant(email: string, tenantId: string): Promise<UserDetailsResponseDto> {
    const user = await this.userRepository.findOne({ where: { email } })
    if (!user || !(await this.isTenantMember(user.id, tenantId))) return null
    return this.findByEmailDto(email, tenantId)
  }

  async findAllForTenant(tenantId: string): Promise<UserResumenResponseDto[]> {
    const memberships = await this.membershipRepository.find({
      where: { tenantId, status: 'active' },
      select: { userId: true }
    })
    const ids = memberships.map(membership => membership.userId)
    if (ids.length === 0) return []
    const users = await this.userRepository.find({ where: { id: In(ids) } })
    return users.map(mapUserResumenToDto)
  }

  async updatePasswordForTenant(id: string, tenantId: string, password: string): Promise<UserResumenResponseDto> {
    if (!(await this.isTenantMember(id, tenantId))) return null
    return this.updatePassword(id, password)
  }

  async deleteForTenant(id: string, tenantId: string): Promise<boolean> {
    if (!(await this.isTenantMember(id, tenantId))) return false
    await this.patientService.deleteByUserAndTenant(id, tenantId)
    await this.refreshTokenRepository.update({ userId: id, tenantId, revokedAt: IsNull() }, { revokedAt: new Date() })
    await this.membershipRepository.delete({ userId: id, tenantId })
    return true
  }

  async findByIdRaw(id: string): Promise<UserEntity | null> {
    if (!UUID_PATTERN.test(id)) return null
    return this.userRepository.findOne({ where: { id } })
  }

  async findByEmailRaw(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } })
  }

  async findByEmailDto(email: string, tenantId?: string): Promise<UserDetailsResponseDto> {
    const user = await this.userRepository.findOne({ where: { email } })
    if (!user) return null

    let patientDetails = undefined
    if (user.role === USER_ROLES[2]) {
      const patient = await this.patientService.findByUserId(user.id, tenantId)
      if (patient) {
        patientDetails = mapPatientToDto(patient)
      }
    }

    return mapUserDetailsToDto({
      email: user.email,
      role: user.role,
      patientDetails
    })
  }

  private async isTenantMember(userId: string, tenantId: string): Promise<boolean> {
    if (!UUID_PATTERN.test(userId)) return false
    const membership = await this.membershipRepository.findOne({
      where: { userId, tenantId, status: 'active' }
    })
    return Boolean(membership)
  }

  async updatePassword(id: string, password: string): Promise<UserResumenResponseDto> {
    const user = await this.findByIdRaw(id)
    if (!user) return null

    user.passwordHash = await hashPassword(password)
    const saved = await this.userRepository.save(user)
    return mapUserResumenToDto(saved)
  }
}
