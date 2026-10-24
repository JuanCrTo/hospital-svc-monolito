import { MigrationInterface, QueryRunner } from 'typeorm'

const TENANT = `NULLIF(current_setting('app.tenant_id', true), '')::uuid`
const PLATFORM = `current_setting('app.is_platform', true) = 'true'`

const CHILD_TABLES = ['patient_identifiers', 'patient_contacts', 'insurance_coverages']

export class AddPatientProfileDetails20261024170000 implements MigrationInterface {
  name = 'AddPatientProfileDetails20261024170000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "patient_identifiers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "patient_id" uuid NOT NULL,
        "type" varchar(30) NOT NULL,
        "value" varchar(120) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_patient_identifiers_tenant_type_value" UNIQUE ("tenant_id", "type", "value"),
        CONSTRAINT "chk_patient_identifiers_type" CHECK ("type" IN ('national_id', 'passport', 'foreign_id', 'other')),
        CONSTRAINT "fk_patient_identifiers_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_patient_identifiers_patient" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_patient_identifiers_patient" ON "patient_identifiers" ("patient_id")')
    await queryRunner.query('CREATE INDEX "idx_patient_identifiers_tenant" ON "patient_identifiers" ("tenant_id")')

    await queryRunner.query(`
      CREATE TABLE "patient_contacts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "patient_id" uuid NOT NULL,
        "type" varchar(20) NOT NULL,
        "value" varchar(255) NOT NULL,
        "is_primary" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_patient_contacts_tenant_patient_type_value" UNIQUE ("tenant_id", "patient_id", "type", "value"),
        CONSTRAINT "chk_patient_contacts_type" CHECK ("type" IN ('phone', 'email', 'address')),
        CONSTRAINT "fk_patient_contacts_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_patient_contacts_patient" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_patient_contacts_patient" ON "patient_contacts" ("patient_id")')
    await queryRunner.query('CREATE INDEX "idx_patient_contacts_tenant" ON "patient_contacts" ("tenant_id")')

    await queryRunner.query(`
      CREATE TABLE "insurance_coverages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "patient_id" uuid NOT NULL,
        "provider_name" varchar(160) NOT NULL,
        "policy_number" varchar(80) NOT NULL,
        "plan_name" varchar(120),
        "valid_from" date NOT NULL,
        "valid_to" date,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_insurance_coverages_tenant_provider_policy" UNIQUE ("tenant_id", "provider_name", "policy_number"),
        CONSTRAINT "chk_insurance_coverages_dates" CHECK ("valid_to" IS NULL OR "valid_to" >= "valid_from"),
        CONSTRAINT "fk_insurance_coverages_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_insurance_coverages_patient" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_insurance_coverages_patient" ON "insurance_coverages" ("patient_id")')
    await queryRunner.query('CREATE INDEX "idx_insurance_coverages_tenant" ON "insurance_coverages" ("tenant_id")')

    for (const table of CHILD_TABLES) {
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`)
      await queryRunner.query(`
        CREATE POLICY "${table}_select" ON "${table}" FOR SELECT
        USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
      `)
      await queryRunner.query(`
        CREATE POLICY "${table}_insert" ON "${table}" FOR INSERT
        WITH CHECK (
          ("tenant_id" = ${TENANT} OR ${PLATFORM})
          AND EXISTS (
            SELECT 1 FROM "patients" p
            WHERE p."id" = "${table}"."patient_id"
              AND (p."tenant_id" = ${TENANT} OR ${PLATFORM})
          )
        )
      `)
      await queryRunner.query(`
        CREATE POLICY "${table}_update" ON "${table}" FOR UPDATE
        USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
        WITH CHECK ("tenant_id" = ${TENANT} OR ${PLATFORM})
      `)
      await queryRunner.query(`
        CREATE POLICY "${table}_delete" ON "${table}" FOR DELETE
        USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
      `)
    }

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hospital_app') THEN
          GRANT SELECT, INSERT, UPDATE, DELETE ON "patient_identifiers" TO hospital_app;
          GRANT SELECT, INSERT, UPDATE, DELETE ON "patient_contacts" TO hospital_app;
          GRANT SELECT, INSERT, UPDATE, DELETE ON "insurance_coverages" TO hospital_app;
        END IF;
      END
      $$;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "insurance_coverages"')
    await queryRunner.query('DROP TABLE IF EXISTS "patient_contacts"')
    await queryRunner.query('DROP TABLE IF EXISTS "patient_identifiers"')
  }
}
