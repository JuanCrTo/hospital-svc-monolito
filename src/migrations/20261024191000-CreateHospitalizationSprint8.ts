import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateHospitalizationSprint820261024191000 implements MigrationInterface {
  name = 'CreateHospitalizationSprint820261024191000'
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "beds" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL, "facility_id" uuid NOT NULL, "code" varchar(40) NOT NULL, "ward" varchar(80) NOT NULL, "status" varchar(20) NOT NULL DEFAULT 'available', CONSTRAINT "PK_beds" PRIMARY KEY ("id"), CONSTRAINT "UQ_beds_scope_code" UNIQUE ("tenant_id", "facility_id", "code"), CONSTRAINT "CHK_beds_status" CHECK ("status" IN ('available','maintenance')), CONSTRAINT "FK_beds_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT, CONSTRAINT "FK_beds_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT)`
    )
    await queryRunner.query(
      `CREATE TABLE "admissions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL, "facility_id" uuid NOT NULL, "patient_id" uuid NOT NULL, "encounter_id" uuid NOT NULL, "admitted_by" uuid NOT NULL, "status" varchar(20) NOT NULL DEFAULT 'active', "admitted_at" timestamptz NOT NULL, "discharged_at" timestamptz, "created_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_admissions" PRIMARY KEY ("id"), CONSTRAINT "CHK_admissions_status" CHECK ("status" IN ('active','discharged')), CONSTRAINT "FK_admissions_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT, CONSTRAINT "FK_admissions_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT, CONSTRAINT "FK_admissions_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT, CONSTRAINT "FK_admissions_encounter" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id") ON DELETE RESTRICT, CONSTRAINT "FK_admissions_user" FOREIGN KEY ("admitted_by") REFERENCES "users"("id") ON DELETE RESTRICT)`
    )
    await queryRunner.query(
      `CREATE TABLE "bed_assignments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL, "facility_id" uuid NOT NULL, "admission_id" uuid NOT NULL, "bed_id" uuid NOT NULL, "assigned_by" uuid NOT NULL, "assigned_at" timestamptz NOT NULL, "released_at" timestamptz, "created_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_bed_assignments" PRIMARY KEY ("id"), CONSTRAINT "FK_assignments_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT, CONSTRAINT "FK_assignments_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT, CONSTRAINT "FK_assignments_admission" FOREIGN KEY ("admission_id") REFERENCES "admissions"("id") ON DELETE RESTRICT, CONSTRAINT "FK_assignments_bed" FOREIGN KEY ("bed_id") REFERENCES "beds"("id") ON DELETE RESTRICT, CONSTRAINT "FK_assignments_user" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT)`
    )
    await queryRunner.query(`CREATE INDEX "IDX_admissions_scope_status" ON "admissions" ("tenant_id", "facility_id", "status")`)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_bed_assignments_active_bed" ON "bed_assignments" ("tenant_id", "facility_id", "bed_id") WHERE "released_at" IS NULL`
    )
    for (const table of ['beds', 'admissions', 'bed_assignments']) {
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`)
      await queryRunner.query(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`)
      await queryRunner.query(
        `CREATE POLICY "${table}_tenant_isolation" ON "${table}" USING ("tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true)::uuid)`
      )
    }
    await queryRunner.query(
      `CREATE TABLE "nursing_notes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL, "facility_id" uuid NOT NULL, "admission_id" uuid NOT NULL, "author_user_id" uuid NOT NULL, "content" text NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_nursing_notes" PRIMARY KEY ("id"), CONSTRAINT "FK_notes_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT, CONSTRAINT "FK_notes_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT, CONSTRAINT "FK_notes_admission" FOREIGN KEY ("admission_id") REFERENCES "admissions"("id") ON DELETE RESTRICT, CONSTRAINT "FK_notes_author" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT)`
    )
    await queryRunner.query(`CREATE INDEX "IDX_nursing_notes_scope" ON "nursing_notes" ("tenant_id", "facility_id", "admission_id", "created_at")`)
    await queryRunner.query(
      `CREATE OR REPLACE FUNCTION prevent_nursing_note_modification() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'nursing_notes is append-only'; END; $$ LANGUAGE plpgsql`
    )
    await queryRunner.query(
      `CREATE TRIGGER "trg_nursing_notes_immutable" BEFORE UPDATE OR DELETE ON "nursing_notes" FOR EACH ROW EXECUTE FUNCTION prevent_nursing_note_modification()`
    )
    await queryRunner.query(`ALTER TABLE "nursing_notes" ENABLE ROW LEVEL SECURITY`)
    await queryRunner.query(`ALTER TABLE "nursing_notes" FORCE ROW LEVEL SECURITY`)
    await queryRunner.query(
      `CREATE POLICY "nursing_notes_tenant_isolation" ON "nursing_notes" USING ("tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true)::uuid)`
    )
    await queryRunner.query(
      `INSERT INTO "permissions" ("code", "description") VALUES ('bed:read','Leer camas'), ('bed:write','Administrar camas'), ('admission:read','Leer admisiones'), ('admission:write','Admitir y trasladar pacientes'), ('nursing:read','Leer notas de enfermería'), ('nursing:write','Registrar notas de enfermería') ON CONFLICT ("code") DO NOTHING`
    )
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "permissions" WHERE "code" IN ('bed:read','bed:write','admission:read','admission:write','nursing:read','nursing:write')`
    )
    await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_nursing_notes_immutable" ON "nursing_notes"`)
    await queryRunner.query(`DROP FUNCTION IF EXISTS prevent_nursing_note_modification()`)
    await queryRunner.query(`DROP TABLE "nursing_notes"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_bed_assignments_active_bed"`)
    await queryRunner.query(`DROP TABLE "bed_assignments"`)
    await queryRunner.query(`DROP TABLE "admissions"`)
    await queryRunner.query(`DROP TABLE "beds"`)
  }
}
