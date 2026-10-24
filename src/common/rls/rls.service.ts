import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { getLogContext } from '../logging/log-context.storage'

interface PgClient {
  query(sql: string, values: unknown[]): Promise<unknown>
}

interface PgPool {
  on(event: 'acquire', listener: (client: PgClient) => void): void
}

const SET_CONTEXT_SQL = `
  SELECT set_config('app.tenant_id', $1, false),
         set_config('app.facility_id', $2, false),
         set_config('app.user_id', $3, false),
         set_config('app.is_platform', $4, false)
`

@Injectable()
export class RlsService implements OnModuleInit {
  private readonly logger = new Logger(RlsService.name)

  constructor(private readonly dataSource: DataSource) {}

  onModuleInit(): void {
    const pool = (this.dataSource.driver as unknown as { master?: PgPool }).master
    if (!pool?.on) return

    pool.on('acquire', client => {
      const context = getLogContext()
      client
        .query(SET_CONTEXT_SQL, [
          context?.tenantId ?? '',
          context?.facilityId ?? '',
          context?.actorUserId ?? '',
          context?.isPlatformAdmin ? 'true' : 'false'
        ])
        .catch((error: Error) => this.logger.warn(`RLS context not applied: ${error.message}`))
    })
  }
}
