import { MigrationInterface, QueryRunner } from 'typeorm'

const TENANT = `NULLIF(current_setting('app.tenant_id', true), '')::uuid`
const PLATFORM = `current_setting('app.is_platform', true) = 'true'`

export class CreateAppointments20261024150000 implements MigrationInterface {
  name = 'CreateAppointments20261024150000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "provider_schedules" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "facility_id" uuid NOT NULL,
        "provider_user_id" uuid NOT NULL,
        "weekday" smallint NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "slot_minutes" smallint NOT NULL DEFAULT 30,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_provider_schedules_provider_slot" UNIQUE ("tenant_id", "facility_id", "provider_user_id", "weekday", "start_time"),
        CONSTRAINT "chk_provider_schedules_weekday" CHECK ("weekday" BETWEEN 0 AND 6),
        CONSTRAINT "chk_provider_schedules_time" CHECK ("start_time" < "end_time"),
        CONSTRAINT "chk_provider_schedules_slot" CHECK ("slot_minutes" BETWEEN 5 AND 240),
        CONSTRAINT "chk_provider_schedules_status" CHECK ("status" IN ('active', 'inactive')),
        CONSTRAINT "fk_provider_schedules_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_provider_schedules_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_provider_schedules_provider" FOREIGN KEY ("provider_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_provider_schedules_tenant_facility" ON "provider_schedules" ("tenant_id", "facility_id")')
    await queryRunner.query('CREATE INDEX "idx_provider_schedules_provider" ON "provider_schedules" ("provider_user_id")')

    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "facility_id" uuid NOT NULL,
        "patient_id" uuid NOT NULL,
        "provider_user_id" uuid NOT NULL,
        "schedule_id" uuid,
        "starts_at" timestamptz NOT NULL,
        "ends_at" timestamptz NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'scheduled',
        "reason" varchar(500),
        "cancellation_reason" varchar(500),
        "canceled_at" timestamptz,
        "created_by" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_appointments_time" CHECK ("starts_at" < "ends_at"),
        CONSTRAINT "chk_appointments_status" CHECK ("status" IN ('scheduled', 'checked_in', 'cancelled', 'completed', 'no_show')),
        CONSTRAINT "fk_appointments_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_appointments_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_appointments_patient" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_appointments_provider" FOREIGN KEY ("provider_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_appointments_schedule" FOREIGN KEY ("schedule_id") REFERENCES "provider_schedules" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "fk_appointments_created_by" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_appointments_tenant_facility_start" ON "appointments" ("tenant_id", "facility_id", "starts_at")')
    await queryRunner.query('CREATE INDEX "idx_appointments_patient" ON "appointments" ("patient_id", "starts_at")')
    await queryRunner.query('CREATE INDEX "idx_appointments_provider" ON "appointments" ("provider_user_id", "starts_at")')

    await queryRunner.query('ALTER TABLE "provider_schedules" ENABLE ROW LEVEL SECURITY')
    await queryRunner.query(`
      CREATE POLICY "provider_schedules_select" ON "provider_schedules" FOR SELECT
      USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
    `)
    await queryRunner.query(`
      CREATE POLICY "provider_schedules_insert" ON "provider_schedules" FOR INSERT
      WITH CHECK (
        ("tenant_id" = ${TENANT} OR ${PLATFORM})
        AND EXISTS (
          SELECT 1 FROM "facilities" f
          WHERE f."id" = "provider_schedules"."facility_id"
            AND (f."tenant_id" = ${TENANT} OR ${PLATFORM})
        )
      )
    `)
    await queryRunner.query(`
      CREATE POLICY "provider_schedules_update" ON "provider_schedules" FOR UPDATE
      USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
      WITH CHECK (
        ("tenant_id" = ${TENANT} OR ${PLATFORM})
        AND EXISTS (
          SELECT 1 FROM "facilities" f
          WHERE f."id" = "provider_schedules"."facility_id"
            AND (f."tenant_id" = ${TENANT} OR ${PLATFORM})
        )
      )
    `)
    await queryRunner.query(`
      CREATE POLICY "provider_schedules_delete" ON "provider_schedules" FOR DELETE
      USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
    `)

    await queryRunner.query('ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY')
    await queryRunner.query(`
      CREATE POLICY "appointments_select" ON "appointments" FOR SELECT
      USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
    `)
    await queryRunner.query(`
      CREATE POLICY "appointments_insert" ON "appointments" FOR INSERT
      WITH CHECK (
        ("tenant_id" = ${TENANT} OR ${PLATFORM})
        AND EXISTS (
          SELECT 1 FROM "patients" p
          WHERE p."id" = "appointments"."patient_id"
            AND (p."tenant_id" = ${TENANT} OR ${PLATFORM})
        )
        AND EXISTS (
          SELECT 1 FROM "facilities" f
          WHERE f."id" = "appointments"."facility_id"
            AND (f."tenant_id" = ${TENANT} OR ${PLATFORM})
        )
      )
    `)
    await queryRunner.query(`
      CREATE POLICY "appointments_update" ON "appointments" FOR UPDATE
      USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
      WITH CHECK (
        ("tenant_id" = ${TENANT} OR ${PLATFORM})
        AND EXISTS (
          SELECT 1 FROM "patients" p
          WHERE p."id" = "appointments"."patient_id"
            AND (p."tenant_id" = ${TENANT} OR ${PLATFORM})
        )
      )
    `)

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hospital_app') THEN
          GRANT SELECT, INSERT, UPDATE, DELETE ON "provider_schedules" TO hospital_app;
          GRANT SELECT, INSERT, UPDATE ON "appointments" TO hospital_app;
        END IF;
      END
      $$;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "appointments"')
    await queryRunner.query('DROP TABLE IF EXISTS "provider_schedules"')
  }
}
