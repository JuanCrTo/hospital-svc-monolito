import 'reflect-metadata'
import 'dotenv/config'
import { join } from 'path'
import { DataSource, DataSourceOptions } from 'typeorm'

export const buildTypeOrmOptions = (env: (key: string) => string | undefined): DataSourceOptions => ({
  type: 'postgres',
  host: env('DB_HOST') ?? 'localhost',
  port: Number(env('DB_PORT') ?? 5432),
  username: env('DB_USER'),
  password: env('DB_PASSWORD'),
  database: env('DB_NAME'),
  ssl: env('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
  entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, '..', 'migrations', '*{.ts,.js}')],
  migrationsTableName: 'migrations',
  synchronize: false,
  migrationsRun: false,
  uuidExtension: 'pgcrypto',
  logging: env('DB_LOGGING') === 'true'
})

export default new DataSource(buildTypeOrmOptions(key => process.env[key]))
