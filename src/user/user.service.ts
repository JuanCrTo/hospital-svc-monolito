import { ConflictException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateUserDto } from './dto/request/create-user-request.dto'
import { UserEntity } from './model/user.entity'
import { hashPassword } from 'src/utils/utils'
import { PatientService } from 'src/patient/patient.service'
import { USER_ROLES } from './enums/user-role.enum'
import { CreatePatientDto } from 'src/patient/dto/request/create-patient-request.dto'
import { EmailService } from 'src/email/email.service'
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
    private readonly patientService: PatientService,
    private readonly emailService: EmailService
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDetailsResponseDto> {
    const userId = await this.createRaw(createUserDto)

    let patientDetails = undefined
    if (createUserDto.role === 'patient' && createUserDto.patientDetails) {
      const createPatientDto: CreatePatientDto & { userId: string } = {
        ...createUserDto.patientDetails,
        userId
      }
      await this.patientService.create(createPatientDto)
      const patient = await this.patientService.findByUserId(userId)
      patientDetails = mapPatientToDto(patient)
    }

    await this.emailService.sendEmailWelcome(userId)

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

  async findById(id: string): Promise<UserDetailsResponseDto> {
    if (!UUID_PATTERN.test(id)) return null

    const user = await this.userRepository.findOne({ where: { id } })
    if (!user) return null

    let patientDetails = undefined
    if (user.role === 'patient') {
      const patient = await this.patientService.findByUserId(id)
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

  async findByIdRaw(id: string): Promise<UserEntity | null> {
    if (!UUID_PATTERN.test(id)) return null
    return this.userRepository.findOne({ where: { id } })
  }

  async findByEmailRaw(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } })
  }

  async findByEmailDto(email: string): Promise<UserDetailsResponseDto> {
    const user = await this.userRepository.findOne({ where: { email } })
    if (!user) return null

    let patientDetails = undefined
    if (user.role === USER_ROLES[2]) {
      const patient = await this.patientService.findByUserId(user.id)
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

  async findAll(): Promise<UserResumenResponseDto[]> {
    const users = await this.userRepository.find()
    return users.map(mapUserResumenToDto)
  }

  async delete(id: string): Promise<void> {
    const user = await this.findByIdRaw(id)
    if (!user) return

    if (user.role === USER_ROLES[2]) {
      await this.patientService.delete(user.id)
    }

    await this.userRepository.delete(user.id)
  }

  async updatePassword(id: string, password: string): Promise<UserResumenResponseDto> {
    const user = await this.findByIdRaw(id)
    if (!user) return null

    user.passwordHash = await hashPassword(password)
    const saved = await this.userRepository.save(user)
    return mapUserResumenToDto(saved)
  }
}
