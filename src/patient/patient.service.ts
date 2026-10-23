import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Patient } from './model/patient.schema'
import { Model } from 'mongoose'
import { CreatePatientDto } from './dto/request/create-patient-request.dto'
import { UpdatePatientDto } from './dto/request/update-user-request.dto'
import { addLocationToHistory, calculateAge, calculateClinicalAge, getCoordinatesFromLocation } from 'src/utils/utils'
import { PatientResponseDto } from './dto/response/patient-response.dto'
import { mapPatientToDto } from './mapper/patient-response.mapper'

@Injectable()
export class PatientService {
  constructor(@InjectModel(Patient.name) private readonly patientModel: Model<Patient>) {}

  // create
  async create(createPatientDto: CreatePatientDto): Promise<void> {
    const { location } = createPatientDto
    let latitude: number
    let longitude: number

    if (location) {
      const coords = await getCoordinatesFromLocation(location)
      latitude = coords.latitude
      longitude = coords.longitude
    }

    const age = calculateAge(createPatientDto.birth)
    const clinicalage = calculateClinicalAge(createPatientDto.birth)

    const patientWithCalculatedData = {
      ...createPatientDto,
      age,
      clinicalage,
      latitude,
      longitude
    }

    await this.patientModel.create(patientWithCalculatedData)
  }

  // update
  async update(id: string, patient: UpdatePatientDto): Promise<PatientResponseDto> {
    const updateData: any = { ...patient }

    if (updateData.birth) {
      updateData.age = calculateAge(updateData.birth)
      updateData.clinicalage = calculateClinicalAge(updateData.birth)
    }

    const { location } = updateData
    if (location) {
      const { latitude, longitude } = await getCoordinatesFromLocation(location)
      updateData.latitude = latitude
      updateData.longitude = longitude

      const existingPatient = await this.patientModel.findById(id)
      updateData.locationHistory = addLocationToHistory(existingPatient?.locationHistory || [], { location, latitude, longitude })
    }

    return this.patientModel
      .findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
        lean: true
      })
      .select('-_id')
      .lean()
  }

  // delete
  async delete(userId: string): Promise<void> {
    await this.patientModel.deleteOne({ userId })
  }

  // findAll
  async findAll(filters: { identification?: string; age?: number; firstname?: string; lastname?: string } = {}): Promise<PatientResponseDto[]> {
    const query: Record<string, unknown> = {}
    if (filters.identification) query.identification = filters.identification
    if (filters.age !== undefined && !Number.isNaN(filters.age)) query.age = filters.age
    if (filters.firstname) query.firstname = filters.firstname
    if (filters.lastname) query.lastname = filters.lastname

    const patients = await this.patientModel.find(query).select('-_id').lean()
    return patients.map(mapPatientToDto)
  }

  // findById
  async findById(id: string): Promise<PatientResponseDto> {
    const patient = await this.patientModel.findById(id).select('-_id').lean()
    return mapPatientToDto(patient)
  }

  // findByUserId
  async findByUserId(userId: string): Promise<Patient> {
    return this.patientModel.findOne({ userId }).select('-_id').lean()
  }

  // findByIdentification
  async findByIdentification(identification: string): Promise<PatientResponseDto> {
    const patient = await this.patientModel.findOne({ identification }).select('-_id').lean()
    return mapPatientToDto(patient)
  }

  // findByAge
  async findByAge(age: number): Promise<PatientResponseDto[]> {
    const patients = await this.patientModel.find({ age }).select('-_id').lean()
    return patients.map(mapPatientToDto)
  }

  // findByFirstname
  async findByFirstname(firstname: string): Promise<PatientResponseDto[]> {
    const patients = await this.patientModel.find({ firstname }).select('-_id').lean()
    return patients.map(mapPatientToDto)
  }

  // findByLastname
  async findByLastname(lastname: string): Promise<PatientResponseDto[]> {
    const patients = await this.patientModel.find({ lastname }).select('-_id').lean()
    return patients.map(mapPatientToDto)
  }

  // getUserByPatientId
}
