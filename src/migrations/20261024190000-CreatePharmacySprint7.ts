import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreatePharmacySprint720261024190000 implements MigrationInterface {
  name = 'CreatePharmacySprint720261024190000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "medications" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL, "code" varchar(40) NOT NULL, "name" varchar(255) NOT NULL, "active_ingredient" varchar(255) NOT NULL, "concentration" varchar(100) NOT NULL, "unit_of_measure" varchar(30) NOT NULL, "status" varchar(20) NOT NULL DEFAULT 'active', "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "PK_medications" PRIMARY KEY ("id"), CONSTRAINT "UQ_medications_tenant_code" UNIQUE ("tenant_id", "code"), CONSTRAINT "FK_medications_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT, CONSTRAINT "CHK_medications_status" CHECK ("status" IN ('active','inactive')))`
    )
    await queryRunner.query(
      `CREATE TABLE "inventory_items" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL, "facility_id" uuid NOT NULL, "medication_id" uuid NOT NULL, "lot_number" varchar(80) NOT NULL, "expires_on" date NOT NULL, "quantity_on_hand" integer NOT NULL DEFAULT 0, "unit_cost" numeric(12,2), "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "PK_inventory_items" PRIMARY KEY ("id"), CONSTRAINT "UQ_inventory_items_lot" UNIQUE ("tenant_id", "facility_id", "medication_id", "lot_number"), CONSTRAINT "CHK_inventory_quantity" CHECK ("quantity_on_hand" >= 0), CONSTRAINT "FK_inventory_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT, CONSTRAINT "FK_inventory_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT, CONSTRAINT "FK_inventory_medication" FOREIGN KEY ("medication_id") REFERENCES "medications"("id") ON DELETE RESTRICT)`
    )
    await queryRunner.query(
      `CREATE TABLE "stock_movements" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL, "facility_id" uuid NOT NULL, "inventory_item_id" uuid NOT NULL, "movement_type" varchar(20) NOT NULL, "quantity" integer NOT NULL, "balance_after" integer NOT NULL, "performed_by" uuid NOT NULL, "reason" varchar(500), "reference_id" uuid, "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "PK_stock_movements" PRIMARY KEY ("id"), CONSTRAINT "CHK_stock_movement_quantity" CHECK ("quantity" <> 0), CONSTRAINT "CHK_stock_movement_balance" CHECK ("balance_after" >= 0), CONSTRAINT "CHK_stock_movement_type" CHECK ("movement_type" IN ('receipt','dispense','adjustment','reversal')), CONSTRAINT "FK_movements_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT, CONSTRAINT "FK_movements_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT, CONSTRAINT "FK_movements_item" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT, CONSTRAINT "FK_movements_user" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT)`
    )
    await queryRunner.query(`CREATE INDEX "IDX_inventory_scope" ON "inventory_items" ("tenant_id", "facility_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_movements_scope" ON "stock_movements" ("tenant_id", "facility_id", "inventory_item_id", "created_at")`)
    await queryRunner.query(
      `CREATE OR REPLACE FUNCTION prevent_pharmacy_movement_modification() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'stock_movements is append-only'; END; $$ LANGUAGE plpgsql`
    )
    await queryRunner.query(
      `CREATE TRIGGER "trg_stock_movements_immutable" BEFORE UPDATE OR DELETE ON "stock_movements" FOR EACH ROW EXECUTE FUNCTION prevent_pharmacy_movement_modification()`
    )
    for (const table of ['medications', 'inventory_items', 'stock_movements']) {
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`)
      await queryRunner.query(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`)
      await queryRunner.query(
        `CREATE POLICY "${table}_tenant_isolation" ON "${table}" USING ("tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true)::uuid)`
      )
    }
    await queryRunner.query(
      `CREATE TABLE "prescriptions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL, "facility_id" uuid NOT NULL, "encounter_id" uuid NOT NULL, "patient_id" uuid NOT NULL, "prescribed_by" uuid NOT NULL, "instructions" varchar(1000), "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "PK_prescriptions" PRIMARY KEY ("id"), CONSTRAINT "FK_prescriptions_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT, CONSTRAINT "FK_prescriptions_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT, CONSTRAINT "FK_prescriptions_encounter" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id") ON DELETE RESTRICT, CONSTRAINT "FK_prescriptions_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT, CONSTRAINT "FK_prescriptions_user" FOREIGN KEY ("prescribed_by") REFERENCES "users"("id") ON DELETE RESTRICT)`
    )
    await queryRunner.query(
      `CREATE TABLE "prescription_lines" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "prescription_id" uuid NOT NULL, "medication_id" uuid NOT NULL, "dosage" varchar(100) NOT NULL, "frequency" varchar(100) NOT NULL, "quantity" integer NOT NULL, "instructions" varchar(500), "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "PK_prescription_lines" PRIMARY KEY ("id"), CONSTRAINT "CHK_prescription_lines_quantity" CHECK ("quantity" > 0), CONSTRAINT "FK_lines_prescription" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE RESTRICT, CONSTRAINT "FK_lines_medication" FOREIGN KEY ("medication_id") REFERENCES "medications"("id") ON DELETE RESTRICT)`
    )
    await queryRunner.query(`CREATE INDEX "IDX_prescriptions_scope" ON "prescriptions" ("tenant_id", "facility_id", "encounter_id")`)
    await queryRunner.query(`ALTER TABLE "prescriptions" ENABLE ROW LEVEL SECURITY`)
    await queryRunner.query(`ALTER TABLE "prescriptions" FORCE ROW LEVEL SECURITY`)
    await queryRunner.query(
      `CREATE POLICY "prescriptions_tenant_isolation" ON "prescriptions" USING ("tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true)::uuid)`
    )
    await queryRunner.query(
      `INSERT INTO "permissions" ("code", "description") VALUES ('medication:read','Leer medicamentos'), ('medication:write','Administrar medicamentos'), ('inventory:read','Leer inventario'), ('inventory:write','Registrar movimientos de inventario'), ('prescription:read','Leer prescripciones'), ('prescription:write','Crear prescripciones'), ('dispensing:write','Dispensar medicamentos') ON CONFLICT ("code") DO NOTHING`
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "permissions" WHERE "code" IN ('medication:read','medication:write','inventory:read','inventory:write','prescription:read','prescription:write','dispensing:write')`
    )
    await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_stock_movements_immutable" ON "stock_movements"`)
    await queryRunner.query(`DROP FUNCTION IF EXISTS prevent_pharmacy_movement_modification()`)
    await queryRunner.query(`DROP TABLE "prescription_lines"`)
    await queryRunner.query(`DROP TABLE "prescriptions"`)
    await queryRunner.query(`DROP TABLE "stock_movements"`)
    await queryRunner.query(`DROP TABLE "inventory_items"`)
    await queryRunner.query(`DROP TABLE "medications"`)
  }
}
