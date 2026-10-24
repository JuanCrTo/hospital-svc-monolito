import { MigrationInterface, QueryRunner } from 'typeorm'

const TENANT = `NULLIF(current_setting('app.tenant_id', true), '')::uuid`
const PLATFORM = `current_setting('app.is_platform', true) = 'true'`

export class CreatePatients20261024140000 implements MigrationInterface {
  name = 'CreatePatients20261024140000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "patients" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "identification" varchar(40) NOT NULL,
        "firstname" varchar(120) NOT NULL,
        "middlename" varchar(120) NOT NULL,
        "lastname" varchar(120) NOT NULL,
        "secondlastname" varchar(120) NOT NULL,
        "birth_date" date NOT NULL,
        "location" varchar(500),
        "latitude" numeric(9,6),
        "longitude" numeric(9,6),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_patients_tenant_user" UNIQUE ("tenant_id", "user_id"),
        CONSTRAINT "uq_patients_tenant_identification" UNIQUE ("tenant_id", "identification"),
        CONSTRAINT "chk_patients_latitude" CHECK ("latitude" IS NULL OR ("latitude" >= -90 AND "latitude" <= 90)),
        CONSTRAINT "chk_patients_longitude" CHECK ("longitude" IS NULL OR ("longitude" >= -180 AND "longitude" <= 180)),
        CONSTRAINT "fk_patients_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_patients_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_patients_tenant_id" ON "patients" ("tenant_id")')

    await queryRunner.query(`
      CREATE TABLE "patient_location_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "patient_id" uuid NOT NULL,
        "location" varchar(500) NOT NULL,
        "latitude" numeric(9,6),
        "longitude" numeric(9,6),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_patient_location_history_patient" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "fk_patient_location_history_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_patient_location_history_patient" ON "patient_location_history" ("patient_id", "updated_at")')
    await queryRunner.query('CREATE INDEX "idx_patient_location_history_tenant" ON "patient_location_history" ("tenant_id")')

    await queryRunner.query('ALTER TABLE "patients" ENABLE ROW LEVEL SECURITY')
    await queryRunner.query(`
      CREATE POLICY "patients_select" ON "patients" FOR SELECT
      USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
    `)
    await queryRunner.query(`
      CREATE POLICY "patients_insert" ON "patients" FOR INSERT
      WITH CHECK ("tenant_id" = ${TENANT} OR ${PLATFORM})
    `)
    await queryRunner.query(`
      CREATE POLICY "patients_update" ON "patients" FOR UPDATE
      USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
      WITH CHECK ("tenant_id" = ${TENANT} OR ${PLATFORM})
    `)
    await queryRunner.query(`
      CREATE POLICY "patients_delete" ON "patients" FOR DELETE
      USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
    `)

    await queryRunner.query('ALTER TABLE "patient_location_history" ENABLE ROW LEVEL SECURITY')
    await queryRunner.query(`
      CREATE POLICY "patient_location_history_select" ON "patient_location_history" FOR SELECT
      USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
    `)
    await queryRunner.query(`
      CREATE POLICY "patient_location_history_insert" ON "patient_location_history" FOR INSERT
      WITH CHECK (
        ("tenant_id" = ${TENANT} OR ${PLATFORM})
        AND EXISTS (
          SELECT 1 FROM "patients" p
          WHERE p."id" = "patient_location_history"."patient_id"
            AND (p."tenant_id" = ${TENANT} OR ${PLATFORM})
        )
      )
    `)
    await queryRunner.query(`
      CREATE POLICY "patient_location_history_update" ON "patient_location_history" FOR UPDATE
      USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
      WITH CHECK (
        ("tenant_id" = ${TENANT} OR ${PLATFORM})
        AND EXISTS (
          SELECT 1 FROM "patients" p
          WHERE p."id" = "patient_location_history"."patient_id"
            AND (p."tenant_id" = ${TENANT} OR ${PLATFORM})
        )
      )
    `)
    await queryRunner.query(`
      CREATE POLICY "patient_location_history_delete" ON "patient_location_history" FOR DELETE
      USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
    `)

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hospital_app') THEN
          GRANT SELECT, INSERT, UPDATE, DELETE ON "patients" TO hospital_app;
          GRANT SELECT, INSERT, UPDATE, DELETE ON "patient_location_history" TO hospital_app;
        END IF;
      END
      $$;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "patient_location_history"')
    await queryRunner.query('DROP TABLE IF EXISTS "patients"')
  }
}
