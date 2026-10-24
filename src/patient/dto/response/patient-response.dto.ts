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

export class PatientResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

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
}
