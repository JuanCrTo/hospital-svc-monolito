import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { DataSource } from 'typeorm'
import { Public } from '../decorators/request/public.decorator'
import { ApiStandardResponse } from '../decorators/swagger/response.decorator'
import { HealthLiveResponseDto } from './dto/health-live-response.dto'
import { HealthReadyResponseDto } from './dto/health-ready-response.dto'

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiStandardResponse(HealthLiveResponseDto)
  live(): HealthLiveResponseDto {
    return { status: 'ok' }
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe with PostgreSQL check' })
  @ApiStandardResponse(HealthReadyResponseDto)
  async ready(): Promise<HealthReadyResponseDto> {
    try {
      await this.dataSource.query('SELECT 1')
      return { status: 'ok', database: 'up' }
    } catch {
      throw new ServiceUnavailableException('Database unavailable')
    }
  }
}
