import { MigrationInterface, QueryRunner } from 'typeorm'

const TENANT = `NULLIF(current_setting('app.tenant_id', true), '')::uuid`
const PLATFORM = `current_setting('app.is_platform', true) = 'true'`

const ENCOUNTER_TENANT_CHECK = `
  ("tenant_id" = ${TENANT} OR ${PLATFORM})
  AND EXISTS (
    SELECT 1 FROM "patients" p
    WHERE p."id" = "encounters"."patient_id"
      AND (p."tenant_id" = ${TENANT} OR ${PLATFORM})
  )
  AND EXISTS (
    SELECT 1 FROM "facilities" f
    WHERE f."id" = "encounters"."facility_id"
      AND (f."tenant_id" = ${TENANT} OR ${PLATFORM})
  )
`

const CHILD_TENANT_CHECK = (table: string) => `
  ("tenant_id" = ${TENANT} OR ${PLATFORM})
  AND EXISTS (
    SELECT 1 FROM "encounters" e
    WHERE e."id" = "${table}"."encounter_id"
      AND (e."tenant_id" = ${TENANT} OR ${PLATFORM})
  )
`

export class CreateClinical20261024160000 implements MigrationInterface {
  name = 'CreateClinical20261024160000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "encounters" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "facility_id" uuid NOT NULL,
        "patient_id" uuid NOT NULL,
        "provider_user_id" uuid NOT NULL,
        "appointment_id" uuid,
        "reason" varchar(500),
        "status" varchar(20) NOT NULL DEFAULT 'open',
        "opened_at" timestamptz NOT NULL,
        "opened_by" uuid NOT NULL,
        "closed_at" timestamptz,
        "closed_by" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_encounters_tenant_appointment" UNIQUE ("tenant_id", "appointment_id"),
        CONSTRAINT "chk_encounters_status" CHECK ("status" IN ('open', 'closed')),
        CONSTRAINT "chk_encounters_closed" CHECK (
          ("status" = 'open' AND "closed_at" IS NULL AND "closed_by" IS NULL)
          OR ("status" = 'closed' AND "closed_at" IS NOT NULL AND "closed_by" IS NOT NULL)
        ),
        CONSTRAINT "fk_encounters_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_encounters_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_encounters_patient" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_encounters_provider" FOREIGN KEY ("provider_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_encounters_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "fk_encounters_opened_by" FOREIGN KEY ("opened_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_encounters_closed_by" FOREIGN KEY ("closed_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_encounters_tenant_facility_opened" ON "encounters" ("tenant_id", "facility_id", "opened_at")')
    await queryRunner.query('CREATE INDEX "idx_encounters_patient" ON "encounters" ("patient_id", "opened_at")')

    await queryRunner.query(`
      CREATE TABLE "clinical_notes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "facility_id" uuid NOT NULL,
        "encounter_id" uuid NOT NULL,
        "author_user_id" uuid NOT NULL,
        "note_type" varchar(20) NOT NULL,
        "content" text NOT NULL,
        "amends_note_id" uuid,
        "amendment_reason" varchar(500),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_clinical_notes_type" CHECK ("note_type" IN ('evolution', 'admission', 'discharge')),
        CONSTRAINT "chk_clinical_notes_amendment" CHECK (
          ("amends_note_id" IS NULL AND "amendment_reason" IS NULL)
          OR ("amends_note_id" IS NOT NULL AND "amendment_reason" IS NOT NULL)
        ),
        CONSTRAINT "fk_clinical_notes_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_clinical_notes_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_clinical_notes_encounter" FOREIGN KEY ("encounter_id") REFERENCES "encounters" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_clinical_notes_author" FOREIGN KEY ("author_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_clinical_notes_amends" FOREIGN KEY ("amends_note_id") REFERENCES "clinical_notes" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_clinical_notes_encounter" ON "clinical_notes" ("encounter_id", "created_at")')

    await queryRunner.query(`
      CREATE TABLE "vital_signs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "facility_id" uuid NOT NULL,
        "encounter_id" uuid NOT NULL,
        "recorded_by" uuid NOT NULL,
        "measured_at" timestamptz NOT NULL,
        "temperature" numeric(4,1),
        "systolic" smallint,
        "diastolic" smallint,
        "heart_rate" smallint,
        "respiratory_rate" smallint,
        "oxygen_saturation" numeric(5,2),
        "weight" numeric(6,2),
        "height" numeric(5,1),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_vital_signs_temperature" CHECK ("temperature" IS NULL OR ("temperature" >= 25 AND "temperature" <= 45)),
        CONSTRAINT "chk_vital_signs_systolic" CHECK ("systolic" IS NULL OR ("systolic" >= 40 AND "systolic" <= 300)),
        CONSTRAINT "chk_vital_signs_diastolic" CHECK ("diastolic" IS NULL OR ("diastolic" >= 20 AND "diastolic" <= 200)),
        CONSTRAINT "chk_vital_signs_heart_rate" CHECK ("heart_rate" IS NULL OR ("heart_rate" >= 20 AND "heart_rate" <= 300)),
        CONSTRAINT "chk_vital_signs_respiratory_rate" CHECK ("respiratory_rate" IS NULL OR ("respiratory_rate" >= 5 AND "respiratory_rate" <= 100)),
        CONSTRAINT "chk_vital_signs_oxygen" CHECK ("oxygen_saturation" IS NULL OR ("oxygen_saturation" >= 0 AND "oxygen_saturation" <= 100)),
        CONSTRAINT "chk_vital_signs_weight" CHECK ("weight" IS NULL OR ("weight" >= 0 AND "weight" <= 1000)),
        CONSTRAINT "chk_vital_signs_height" CHECK ("height" IS NULL OR ("height" >= 0 AND "height" <= 300)),
        CONSTRAINT "fk_vital_signs_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_vital_signs_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_vital_signs_encounter" FOREIGN KEY ("encounter_id") REFERENCES "encounters" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_vital_signs_recorded_by" FOREIGN KEY ("recorded_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_vital_signs_encounter" ON "vital_signs" ("encounter_id", "measured_at")')

    await queryRunner.query(`
      CREATE TABLE "diagnoses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "facility_id" uuid NOT NULL,
        "encounter_id" uuid NOT NULL,
        "code" varchar(20) NOT NULL,
        "description" varchar(500) NOT NULL,
        "diagnosis_type" varchar(20) NOT NULL DEFAULT 'secondary',
        "diagnosed_by" uuid NOT NULL,
        "diagnosed_at" timestamptz NOT NULL,
        "amends_diagnosis_id" uuid,
        "amendment_reason" varchar(500),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_diagnoses_type" CHECK ("diagnosis_type" IN ('primary', 'secondary')),
        CONSTRAINT "chk_diagnoses_amendment" CHECK (
          ("amends_diagnosis_id" IS NULL AND "amendment_reason" IS NULL)
          OR ("amends_diagnosis_id" IS NOT NULL AND "amendment_reason" IS NOT NULL)
        ),
        CONSTRAINT "fk_diagnoses_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_diagnoses_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_diagnoses_encounter" FOREIGN KEY ("encounter_id") REFERENCES "encounters" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_diagnoses_diagnosed_by" FOREIGN KEY ("diagnosed_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_diagnoses_amends" FOREIGN KEY ("amends_diagnosis_id") REFERENCES "diagnoses" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_diagnoses_encounter" ON "diagnoses" ("encounter_id", "diagnosed_at")')

    for (const table of ['clinical_notes', 'vital_signs', 'diagnoses']) {
      await queryRunner.query(
        `CREATE TRIGGER "trg_${table}_immutable" BEFORE UPDATE OR DELETE ON "${table}" FOR EACH ROW EXECUTE FUNCTION prevent_modification()`
      )
    }

    await queryRunner.query('ALTER TABLE "encounters" ENABLE ROW LEVEL SECURITY')
    await queryRunner.query(`
      CREATE POLICY "encounters_select" ON "encounters" FOR SELECT
      USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
    `)
    await queryRunner.query(`
      CREATE POLICY "encounters_insert" ON "encounters" FOR INSERT
      WITH CHECK (${ENCOUNTER_TENANT_CHECK})
    `)
    await queryRunner.query(`
      CREATE POLICY "encounters_update" ON "encounters" FOR UPDATE
      USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
      WITH CHECK (${ENCOUNTER_TENANT_CHECK})
    `)

    for (const table of ['clinical_notes', 'vital_signs', 'diagnoses']) {
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`)
      await queryRunner.query(`
        CREATE POLICY "${table}_select" ON "${table}" FOR SELECT
        USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
      `)
      await queryRunner.query(`
        CREATE POLICY "${table}_insert" ON "${table}" FOR INSERT
        WITH CHECK (${CHILD_TENANT_CHECK(table)})
      `)
    }

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hospital_app') THEN
          GRANT SELECT, INSERT, UPDATE ON "encounters" TO hospital_app;
          GRANT SELECT, INSERT ON "clinical_notes" TO hospital_app;
          GRANT SELECT, INSERT ON "vital_signs" TO hospital_app;
          GRANT SELECT, INSERT ON "diagnoses" TO hospital_app;
        END IF;
      END
      $$;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "diagnoses"')
    await queryRunner.query('DROP TABLE IF EXISTS "vital_signs"')
    await queryRunner.query('DROP TABLE IF EXISTS "clinical_notes"')
    await queryRunner.query('DROP TABLE IF EXISTS "encounters"')
  }
}
