import { MigrationInterface, QueryRunner } from 'typeorm'

const TENANT = `NULLIF(current_setting('app.tenant_id', true), '')::uuid`
const PLATFORM = `current_setting('app.is_platform', true) = 'true'`

const ORDER_TENANT_CHECK = `
  ("tenant_id" = ${TENANT} OR ${PLATFORM})
  AND EXISTS (
    SELECT 1 FROM "patients" p
    WHERE p."id" = "clinical_orders"."patient_id"
      AND (p."tenant_id" = ${TENANT} OR ${PLATFORM})
  )
  AND EXISTS (
    SELECT 1 FROM "facilities" f
    WHERE f."id" = "clinical_orders"."facility_id"
      AND (f."tenant_id" = ${TENANT} OR ${PLATFORM})
  )
  AND EXISTS (
    SELECT 1 FROM "encounters" e
    WHERE e."id" = "clinical_orders"."encounter_id"
      AND (e."tenant_id" = ${TENANT} OR ${PLATFORM})
  )
`

const CHILD_TENANT_CHECK = (table: string) => `
  ("tenant_id" = ${TENANT} OR ${PLATFORM})
  AND EXISTS (
    SELECT 1 FROM "clinical_orders" o
    WHERE o."id" = "${table}"."order_id"
      AND (o."tenant_id" = ${TENANT} OR ${PLATFORM})
  )
`

export class CreateOrdersAndResults20261024180000 implements MigrationInterface {
  name = 'CreateOrdersAndResults20261024180000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "clinical_orders" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "facility_id" uuid NOT NULL,
        "encounter_id" uuid NOT NULL,
        "patient_id" uuid NOT NULL,
        "ordered_by" uuid NOT NULL,
        "order_type" varchar(20) NOT NULL,
        "code" varchar(40) NOT NULL,
        "name" varchar(255) NOT NULL,
        "priority" varchar(20) NOT NULL DEFAULT 'routine',
        "status" varchar(20) NOT NULL DEFAULT 'requested',
        "clinical_notes" text,
        "requested_at" timestamptz NOT NULL,
        "started_at" timestamptz,
        "completed_at" timestamptz,
        "cancelled_at" timestamptz,
        "cancelled_by" uuid,
        "cancel_reason" varchar(500),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_clinical_orders_type" CHECK ("order_type" IN ('lab', 'imaging')),
        CONSTRAINT "chk_clinical_orders_priority" CHECK ("priority" IN ('routine', 'urgent', 'stat')),
        CONSTRAINT "chk_clinical_orders_status" CHECK ("status" IN ('requested', 'in_progress', 'completed', 'cancelled')),
        CONSTRAINT "chk_clinical_orders_lifecycle" CHECK (
          ("status" = 'requested' AND "started_at" IS NULL AND "completed_at" IS NULL AND "cancelled_at" IS NULL)
          OR ("status" = 'in_progress' AND "started_at" IS NOT NULL AND "completed_at" IS NULL AND "cancelled_at" IS NULL)
          OR ("status" = 'completed' AND "started_at" IS NOT NULL AND "completed_at" IS NOT NULL AND "cancelled_at" IS NULL)
          OR ("status" = 'cancelled' AND "cancelled_at" IS NOT NULL AND "cancelled_by" IS NOT NULL AND "cancel_reason" IS NOT NULL)
        ),
        CONSTRAINT "fk_clinical_orders_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_clinical_orders_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_clinical_orders_encounter" FOREIGN KEY ("encounter_id") REFERENCES "encounters" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_clinical_orders_patient" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_clinical_orders_ordered_by" FOREIGN KEY ("ordered_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_clinical_orders_cancelled_by" FOREIGN KEY ("cancelled_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_clinical_orders_tenant_facility_status" ON "clinical_orders" ("tenant_id", "facility_id", "status")')
    await queryRunner.query('CREATE INDEX "idx_clinical_orders_patient_requested" ON "clinical_orders" ("patient_id", "requested_at")')
    await queryRunner.query('CREATE INDEX "idx_clinical_orders_encounter" ON "clinical_orders" ("encounter_id", "requested_at")')

    await queryRunner.query(`
      CREATE TABLE "lab_results" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "facility_id" uuid NOT NULL,
        "order_id" uuid NOT NULL,
        "analyte_code" varchar(40) NOT NULL,
        "analyte_name" varchar(255) NOT NULL,
        "value" text NOT NULL,
        "unit" varchar(40),
        "reference_range" varchar(120),
        "interpretation" varchar(20) NOT NULL DEFAULT 'unknown',
        "status" varchar(20) NOT NULL DEFAULT 'final',
        "reported_by" uuid NOT NULL,
        "reported_at" timestamptz NOT NULL,
        "amends_result_id" uuid,
        "amendment_reason" varchar(500),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_lab_results_interpretation" CHECK ("interpretation" IN ('normal', 'abnormal', 'critical', 'unknown')),
        CONSTRAINT "chk_lab_results_status" CHECK ("status" IN ('preliminary', 'final', 'corrected')),
        CONSTRAINT "chk_lab_results_amendment" CHECK (
          ("amends_result_id" IS NULL AND "amendment_reason" IS NULL AND "status" <> 'corrected')
          OR ("amends_result_id" IS NOT NULL AND "amendment_reason" IS NOT NULL AND "status" = 'corrected')
        ),
        CONSTRAINT "fk_lab_results_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_lab_results_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_lab_results_order" FOREIGN KEY ("order_id") REFERENCES "clinical_orders" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_lab_results_reported_by" FOREIGN KEY ("reported_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_lab_results_amends" FOREIGN KEY ("amends_result_id") REFERENCES "lab_results" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_lab_results_order" ON "lab_results" ("order_id", "reported_at")')

    await queryRunner.query(`
      CREATE TABLE "imaging_studies" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "facility_id" uuid NOT NULL,
        "order_id" uuid NOT NULL,
        "study_type" varchar(120) NOT NULL,
        "modality" varchar(40),
        "body_site" varchar(120),
        "findings" text NOT NULL,
        "impression" text,
        "performed_at" timestamptz NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'final',
        "reported_by" uuid NOT NULL,
        "reported_at" timestamptz NOT NULL,
        "amends_study_id" uuid,
        "amendment_reason" varchar(500),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_imaging_studies_status" CHECK ("status" IN ('preliminary', 'final', 'corrected')),
        CONSTRAINT "chk_imaging_studies_amendment" CHECK (
          ("amends_study_id" IS NULL AND "amendment_reason" IS NULL AND "status" <> 'corrected')
          OR ("amends_study_id" IS NOT NULL AND "amendment_reason" IS NOT NULL AND "status" = 'corrected')
        ),
        CONSTRAINT "fk_imaging_studies_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_imaging_studies_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_imaging_studies_order" FOREIGN KEY ("order_id") REFERENCES "clinical_orders" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_imaging_studies_reported_by" FOREIGN KEY ("reported_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_imaging_studies_amends" FOREIGN KEY ("amends_study_id") REFERENCES "imaging_studies" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_imaging_studies_order" ON "imaging_studies" ("order_id", "reported_at")')

    await queryRunner.query(`
      CREATE TABLE "attachments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "facility_id" uuid NOT NULL,
        "order_id" uuid NOT NULL,
        "lab_result_id" uuid,
        "imaging_study_id" uuid,
        "category" varchar(20) NOT NULL,
        "original_name" varchar(255) NOT NULL,
        "mime_type" varchar(120) NOT NULL,
        "size_bytes" integer NOT NULL,
        "checksum_sha256" char(64) NOT NULL,
        "public_id" varchar(255) NOT NULL,
        "resource_type" varchar(20) NOT NULL,
        "format" varchar(20) NOT NULL,
        "uploaded_by" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_attachments_public_id" UNIQUE ("public_id"),
        CONSTRAINT "chk_attachments_category" CHECK ("category" IN ('order', 'lab_result', 'imaging')),
        CONSTRAINT "chk_attachments_links" CHECK (
          ("category" = 'order' AND "lab_result_id" IS NULL AND "imaging_study_id" IS NULL)
          OR ("category" = 'lab_result' AND "lab_result_id" IS NOT NULL AND "imaging_study_id" IS NULL)
          OR ("category" = 'imaging' AND "imaging_study_id" IS NOT NULL AND "lab_result_id" IS NULL)
        ),
        CONSTRAINT "fk_attachments_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_attachments_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_attachments_order" FOREIGN KEY ("order_id") REFERENCES "clinical_orders" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_attachments_lab_result" FOREIGN KEY ("lab_result_id") REFERENCES "lab_results" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_attachments_imaging_study" FOREIGN KEY ("imaging_study_id") REFERENCES "imaging_studies" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_attachments_uploaded_by" FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_attachments_order" ON "attachments" ("order_id", "created_at")')

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION prevent_deletion() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION '% does not permit deletions', TG_TABLE_NAME;
      END;
      $$ LANGUAGE plpgsql;
    `)
    await queryRunner.query(`
      CREATE TRIGGER "trg_clinical_orders_no_delete"
      BEFORE DELETE ON "clinical_orders"
      FOR EACH ROW EXECUTE FUNCTION prevent_deletion()
    `)

    for (const table of ['lab_results', 'imaging_studies', 'attachments']) {
      await queryRunner.query(
        `CREATE TRIGGER "trg_${table}_immutable" BEFORE UPDATE OR DELETE ON "${table}" FOR EACH ROW EXECUTE FUNCTION prevent_modification()`
      )
    }

    await queryRunner.query('ALTER TABLE "clinical_orders" ENABLE ROW LEVEL SECURITY')
    await queryRunner.query(`
      CREATE POLICY "clinical_orders_select" ON "clinical_orders" FOR SELECT
      USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
    `)
    await queryRunner.query(`
      CREATE POLICY "clinical_orders_insert" ON "clinical_orders" FOR INSERT
      WITH CHECK (${ORDER_TENANT_CHECK})
    `)
    await queryRunner.query(`
      CREATE POLICY "clinical_orders_update" ON "clinical_orders" FOR UPDATE
      USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
      WITH CHECK (${ORDER_TENANT_CHECK})
    `)

    for (const table of ['lab_results', 'imaging_studies', 'attachments']) {
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
      INSERT INTO "permissions" ("code", "description") VALUES
        ('order:read', 'Leer órdenes clínicas'),
        ('order:write', 'Crear y modificar estado de órdenes clínicas'),
        ('result:read', 'Leer resultados de laboratorio y estudios de imagen'),
        ('result:write', 'Registrar y enmendar resultados y estudios'),
        ('attachment:read', 'Descargar y listar adjuntos clínicos'),
        ('attachment:write', 'Subir adjuntos clínicos')
      ON CONFLICT ("code") DO NOTHING
    `)

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hospital_app') THEN
          GRANT SELECT, INSERT, UPDATE ON "clinical_orders" TO hospital_app;
          GRANT SELECT, INSERT ON "lab_results" TO hospital_app;
          GRANT SELECT, INSERT ON "imaging_studies" TO hospital_app;
          GRANT SELECT, INSERT ON "attachments" TO hospital_app;
        END IF;
      END
      $$;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "attachments"')
    await queryRunner.query('DROP TABLE IF EXISTS "imaging_studies"')
    await queryRunner.query('DROP TABLE IF EXISTS "lab_results"')
    await queryRunner.query('DROP TABLE IF EXISTS "clinical_orders"')
    await queryRunner.query(`
      DELETE FROM "permissions" WHERE "code" IN (
        'order:read',
        'order:write',
        'result:read',
        'result:write',
        'attachment:read',
        'attachment:write'
      )
    `)
  }
}
