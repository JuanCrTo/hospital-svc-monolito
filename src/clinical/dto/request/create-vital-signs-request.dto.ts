import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsISO8601, IsNumber, IsOptional, Max, Min } from 'class-validator'

export class CreateVitalSignsRequestDto {
  @ApiPropertyOptional({ example: '2026-10-24T14:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  measuredAt?: string

  @ApiPropertyOptional({ example: 36.8 })
  @IsOptional()
  @IsNumber()
  @Min(25)
  @Max(45)
  temperature?: number

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(300)
  systolic?: number

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(200)
  diastolic?: number

  @ApiPropertyOptional({ example: 78 })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  heartRate?: number

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(100)
  respiratoryRate?: number

  @ApiPropertyOptional({ example: 98.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  oxygenSaturation?: number

  @ApiPropertyOptional({ example: 72.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  weight?: number

  @ApiPropertyOptional({ example: 172.4 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  height?: number
}
