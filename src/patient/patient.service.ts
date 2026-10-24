import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { addLocationToHistory, getCoordinatesFromLocation } from 'src/utils/utils'
import { AuditService } from 'src/common/logging/audit/audit.service'
import { Membership } from 'src/iam/model/membership.entity'
import { UserEntity } from 'src/user/model/user.entity'
import { CreatePatientRequestDto } from './dto/request/create-patient-request.dto'
import { RegisterPatientRequestDto } from './dto/request/register-patient-request.dto'
import { UpdatePatientRequestDto } from './dto/request/update-patient-request.dto'
import { PatientResponseDto } from './dto/response/patient-response.dto'
import { mapPatientToDto } from './mapper/patient-response.mapper'
import { PatientEntity } from './model/patient.entity'
import { PatientLocationHistory } from './model/patient-location-history.entity'
import { PatientIdentifier } from './model/patient-identifier.entity'
import { PatientContact } from './model/patient-contact.entity'
import { InsuranceCoverage } from './model/insurance-coverage.entity'

export interface PatientFilters {
  identification?: string
  age?: number
  firstname?: string
  lastname?: string
}

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(PatientEntity)
    private readonly patientRepository: Repository<PatientEntity>,
    @InjectRepository(PatientLocationHistory)
    private readonly locationHistoryRepository: Repository<PatientLocationHistory>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    private readonly auditService: AuditService
  ) {}

  async create(dto: CreatePatientRequestDto, tenantId: string, userId: string): Promise<PatientResponseDto> {
    const patientId = await this.persist(dto, tenantId, userId)
    await this.auditService.record({
      action: 'CREATE',
      resourceType: 'patient',
      resourceId: patientId,
      tenantId,
      afterSummary: { userId, identification: dto.identification }
    })
    return this.findById(patientId, tenantId)
  }

  async register(dto: RegisterPatientRequestDto, tenantId: string): Promise<PatientResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: dto.userId } })
    if (!user) throw new NotFoundException('User not found')

    const membership = await this.membershipRepository.findOne({
      where: { userId: dto.userId, tenantId, status: 'active' }
    })
    if (!membership) throw new NotFoundException('User is not an active member of this tenant')

    const patientId = await this.persist(dto, tenantId, dto.userId)
    await this.auditService.record({
      action: 'CREATE',
      resourceType: 'patient',
      resourceId: patientId,
      tenantId,
      afterSummary: { userId: dto.userId, identification: dto.identification }
    })
    return this.findById(patientId, tenantId)
  }

  private async persist(dto: CreatePatientRequestDto, tenantId: string, userId: string): Promise<string> {
    const { latitude, longitude } = await this.resolveCoordinates(dto.location)

    try {
      return await this.patientRepository.manager.transaction(async manager => {
        const patient = await manager.getRepository(PatientEntity).save(
          manager.getRepository(PatientEntity).create({
            tenantId,
            userId,
            identification: dto.identification,
            firstname: dto.firstname,
            middlename: dto.middlename,
            lastname: dto.lastname,
            secondlastname: dto.secondlastname,
            birthDate: dto.birth,
            location: dto.location,
            latitude,
            longitude
          })
        )

        if (dto.identifiers?.length) {
          await manager.getRepository(PatientIdentifier).save(
            dto.identifiers.map(identifier =>
              manager.getRepository(PatientIdentifier).create({
                tenantId,
                patientId: patient.id,
                type: identifier.type,
                value: identifier.value
              })
            )
          )
        }

        if (dto.contacts?.length) {
          await manager.getRepository(PatientContact).save(
            dto.contacts.map(contact =>
              manager.getRepository(PatientContact).create({
                tenantId,
                patientId: patient.id,
                type: contact.type,
                value: contact.value,
                isPrimary: contact.isPrimary ?? false
              })
            )
          )
        }

        if (dto.insuranceCoverages?.length) {
          await manager.getRepository(InsuranceCoverage).save(
            dto.insuranceCoverages.map(coverage =>
              manager.getRepository(InsuranceCoverage).create({
                tenantId,
                patientId: patient.id,
                providerName: coverage.providerName,
                policyNumber: coverage.policyNumber,
                planName: coverage.planName ?? null,
                validFrom: coverage.validFrom,
                validTo: coverage.validTo ?? null,
                isActive: coverage.isActive ?? true
              })
            )
          )
        }

        return patient.id
      })
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new ConflictException('Patient identification or related data already exists in this tenant')
      throw error
    }
  }

  async update(id: string, tenantId: string, dto: UpdatePatientRequestDto): Promise<PatientResponseDto> {
    const patient = await this.patientRepository.findOne({ where: { id, tenantId } })
    if (!patient) throw new NotFoundException('Patient not found')

    const beforeIdentification = patient.identification

    if (dto.identification !== undefined) patient.identification = dto.identification
    if (dto.firstname !== undefined) patient.firstname = dto.firstname
    if (dto.middlename !== undefined) patient.middlename = dto.middlename
    if (dto.lastname !== undefined) patient.lastname = dto.lastname
    if (dto.secondlastname !== undefined) patient.secondlastname = dto.secondlastname
    if (dto.birth !== undefined) patient.birthDate = dto.birth

    if (dto.location !== undefined) {
      const { latitude, longitude } = await this.resolveCoordinates(dto.location)
      patient.location = dto.location
      patient.latitude = latitude
      patient.longitude = longitude

      const currentHistory = await this.locationHistoryRepository.find({
        where: { patientId: patient.id },
        order: { updatedAt: 'ASC' }
      })

      const history = addLocationToHistory(
        currentHistory.map(entry => ({
          location: entry.location,
          latitude: entry.latitude,
          longitude: entry.longitude,
          updatedAt: entry.updatedAt
        })),
        { location: dto.location, latitude, longitude }
      )

      if (history.length > currentHistory.length) {
        await this.locationHistoryRepository.save(
          this.locationHistoryRepository.create({
            tenantId,
            patientId: patient.id,
            location: dto.location,
            latitude,
            longitude
          })
        )
      }
    }

    try {
      const saved = await this.patientRepository.save(patient)
      await this.auditService.record({
        action: 'UPDATE',
        resourceType: 'patient',
        resourceId: saved.id,
        tenantId,
        beforeSummary: { identification: beforeIdentification },
        afterSummary: { identification: saved.identification }
      })
      return this.findById(saved.id, tenantId)
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new ConflictException('Patient identification already exists in this tenant')
      throw error
    }
  }

  async findAll(tenantId: string, filters: PatientFilters = {}): Promise<PatientResponseDto[]> {
    const query = this.patientRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.locationHistory', 'history')
      .leftJoinAndSelect('patient.identifiers', 'identifiers')
      .leftJoinAndSelect('patient.contacts', 'contacts')
      .leftJoinAndSelect('patient.insuranceCoverages', 'insuranceCoverages')
      .where('patient.tenant_id = :tenantId', { tenantId })

    if (filters.identification) query.andWhere('patient.identification = :identification', { identification: filters.identification })
    if (filters.firstname) query.andWhere('patient.firstname = :firstname', { firstname: filters.firstname })
    if (filters.lastname) query.andWhere('patient.lastname = :lastname', { lastname: filters.lastname })
    if (filters.age !== undefined && !Number.isNaN(filters.age)) {
      query.andWhere("date_part('year', age(patient.birth_date)) = :age", { age: filters.age })
    }

    const patients = await query.orderBy('patient.created_at', 'DESC').addOrderBy('history.updated_at', 'ASC').getMany()
    return patients.map(mapPatientToDto)
  }

  async findById(id: string, tenantId: string): Promise<PatientResponseDto> {
    const patient = await this.patientRepository.findOne({
      where: { id, tenantId },
      relations: {
        locationHistory: true,
        identifiers: true,
        contacts: true,
        insuranceCoverages: true
      }
    })
    if (!patient) throw new NotFoundException('Patient not found')
    return mapPatientToDto(patient)
  }

  async findByUserId(userId: string, tenantId?: string): Promise<PatientEntity | null> {
    return this.patientRepository.findOne({
      where: tenantId ? { userId, tenantId } : { userId }
    })
  }

  async findByIdentification(identification: string, tenantId: string): Promise<PatientResponseDto> {
    const patient = await this.patientRepository.findOne({
      where: { identification, tenantId },
      relations: { identifiers: true, contacts: true, insuranceCoverages: true }
    })
    if (!patient) throw new NotFoundException('Patient not found')
    return mapPatientToDto(patient)
  }

  async deleteByUserAndTenant(userId: string, tenantId: string): Promise<void> {
    await this.patientRepository.delete({ userId, tenantId })
  }

  private async resolveCoordinates(location: string): Promise<{ latitude: number | null; longitude: number | null }> {
    try {
      return await getCoordinatesFromLocation(location)
    } catch {
      return { latitude: null, longitude: null }
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
  }
}
