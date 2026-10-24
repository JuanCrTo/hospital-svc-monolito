import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { addLocationToHistory, getCoordinatesFromLocation } from 'src/utils/utils'
import { CreatePatientRequestDto } from './dto/request/create-patient-request.dto'
import { UpdatePatientRequestDto } from './dto/request/update-patient-request.dto'
import { PatientResponseDto } from './dto/response/patient-response.dto'
import { mapPatientToDto } from './mapper/patient-response.mapper'
import { PatientEntity } from './model/patient.entity'
import { PatientLocationHistory } from './model/patient-location-history.entity'

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
    private readonly locationHistoryRepository: Repository<PatientLocationHistory>
  ) {}

  async create(dto: CreatePatientRequestDto, tenantId: string, userId: string): Promise<PatientResponseDto> {
    const { latitude, longitude } = await getCoordinatesFromLocation(dto.location)

    const patient = this.patientRepository.create({
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

    try {
      const saved = await this.patientRepository.save(patient)
      return mapPatientToDto(saved)
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new ConflictException('Patient identification already exists in this tenant')
      throw error
    }
  }

  async update(id: string, tenantId: string, dto: UpdatePatientRequestDto): Promise<PatientResponseDto> {
    const patient = await this.patientRepository.findOne({ where: { id, tenantId } })
    if (!patient) throw new NotFoundException('Patient not found')

    if (dto.identification !== undefined) patient.identification = dto.identification
    if (dto.firstname !== undefined) patient.firstname = dto.firstname
    if (dto.middlename !== undefined) patient.middlename = dto.middlename
    if (dto.lastname !== undefined) patient.lastname = dto.lastname
    if (dto.secondlastname !== undefined) patient.secondlastname = dto.secondlastname
    if (dto.birth !== undefined) patient.birthDate = dto.birth

    if (dto.location !== undefined) {
      const { latitude, longitude } = await getCoordinatesFromLocation(dto.location)
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
      relations: { locationHistory: true }
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
    const patient = await this.patientRepository.findOne({ where: { identification, tenantId } })
    if (!patient) throw new NotFoundException('Patient not found')
    return mapPatientToDto(patient)
  }

  async deleteByUserAndTenant(userId: string, tenantId: string): Promise<void> {
    await this.patientRepository.delete({ userId, tenantId })
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
  }
}
