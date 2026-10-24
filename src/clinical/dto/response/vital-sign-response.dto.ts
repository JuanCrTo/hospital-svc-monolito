import { ApiProperty } from '@nestjs/swagger'

export class VitalSignResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ format: 'uuid' })
  encounterId: string

  @ApiProperty({ format: 'uuid' })
  recordedBy: string

  @ApiProperty()
  measuredAt: Date

  @ApiProperty({ nullable: true })
  temperature: number | null

  @ApiProperty({ nullable: true })
  systolic: number | null

  @ApiProperty({ nullable: true })
  diastolic: number | null

  @ApiProperty({ nullable: true })
  heartRate: number | null

  @ApiProperty({ nullable: true })
  respiratoryRate: number | null

  @ApiProperty({ nullable: true })
  oxygenSaturation: number | null

  @ApiProperty({ nullable: true })
  weight: number | null

  @ApiProperty({ nullable: true })
  height: number | null

  @ApiProperty()
  createdAt: Date
}
