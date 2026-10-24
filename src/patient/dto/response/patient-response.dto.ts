import { ApiProperty } from '@nestjs/swagger'

export class LocationHistoryItemDto {
  @ApiProperty({ example: 'Ciudad de México', required: false, nullable: true })
  location?: string

  @ApiProperty({ example: 19.4326, required: false, nullable: true })
  latitude?: number

  @ApiProperty({ example: -99.1332, required: false, nullable: true })
  longitude?: number

  @ApiProperty({ example: '2026-10-24T15:00:00.000Z', required: false })
  updatedAt?: Date
}

export class PatientIdentifierResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ example: 'passport' })
  type: string

  @ApiProperty({ example: 'AB1234567' })
  value: string

  @ApiProperty({ example: '2026-10-24T15:00:00.000Z' })
  createdAt: Date
}

export class PatientContactResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ example: 'phone' })
  type: string

  @ApiProperty({ example: '+573001112233' })
  value: string

  @ApiProperty({ example: false })
  isPrimary: boolean

  @ApiProperty({ example: '2026-10-24T15:00:00.000Z' })
  createdAt: Date
}

export class InsuranceCoverageResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ example: 'Seguros Salud Colombia' })
  providerName: string

  @ApiProperty({ example: 'POL-2026-0001' })
  policyNumber: string

  @ApiProperty({ example: 'Plan Familiar', required: false, nullable: true })
  planName?: string

  @ApiProperty({ example: '2026-01-01' })
  validFrom: string

  @ApiProperty({ example: '2026-12-31', required: false, nullable: true })
  validTo?: string

  @ApiProperty({ example: true })
  isActive: boolean

  @ApiProperty({ example: '2026-10-24T15:00:00.000Z' })
  createdAt: Date

  @ApiProperty({ example: '2026-10-24T15:00:00.000Z' })
  updatedAt: Date
}

export class PatientResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ format: 'uuid' })
  userId: string

  @ApiProperty({ example: '1234567890' })
  identification: string

  @ApiProperty({ example: 'Juan' })
  firstname: string

  @ApiProperty({ example: 'Carlos' })
  middlename: string

  @ApiProperty({ example: 'Pérez' })
  lastname: string

  @ApiProperty({ example: 'Gómez' })
  secondlastname: string

  @ApiProperty({ example: '1990-01-01' })
  birth: string

  @ApiProperty({ example: 34 })
  age: number

  @ApiProperty({ example: '34 años' })
  clinicalage: string

  @ApiProperty({ example: 'Ciudad de México', required: false, nullable: true })
  location?: string

  @ApiProperty({ example: 19.4326, required: false, nullable: true })
  latitude?: number

  @ApiProperty({ example: -99.1332, required: false, nullable: true })
  longitude?: number

  @ApiProperty({
    type: [LocationHistoryItemDto],
    required: false,
    nullable: true
  })
  locationHistory?: LocationHistoryItemDto[]

  @ApiProperty({ type: [PatientIdentifierResponseDto], required: false })
  identifiers?: PatientIdentifierResponseDto[]

  @ApiProperty({ type: [PatientContactResponseDto], required: false })
  contacts?: PatientContactResponseDto[]

  @ApiProperty({ type: [InsuranceCoverageResponseDto], required: false })
  insuranceCoverages?: InsuranceCoverageResponseDto[]
}
