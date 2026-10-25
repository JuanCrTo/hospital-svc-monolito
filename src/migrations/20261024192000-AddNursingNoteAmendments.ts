import { MigrationInterface, QueryRunner } from 'typeorm'
export class AddNursingNoteAmendments20261024192000 implements MigrationInterface {
  name = 'AddNursingNoteAmendments20261024192000'
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TABLE "nursing_note_amendments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL, "facility_id" uuid NOT NULL, "nursing_note_id" uuid NOT NULL, "author_user_id" uuid NOT NULL, "content" text NOT NULL, "reason" varchar(500) NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_nursing_note_amendments" PRIMARY KEY ("id"), CONSTRAINT "FK_amendments_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT, CONSTRAINT "FK_amendments_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT, CONSTRAINT "FK_amendments_note" FOREIGN KEY ("nursing_note_id") REFERENCES "nursing_notes"("id") ON DELETE RESTRICT, CONSTRAINT "FK_amendments_author" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT)`
    )
    await q.query(
      `CREATE INDEX "IDX_nursing_note_amendments_scope" ON "nursing_note_amendments" ("tenant_id", "facility_id", "nursing_note_id", "created_at")`
    )
    await q.query(`ALTER TABLE "nursing_note_amendments" ENABLE ROW LEVEL SECURITY`)
    await q.query(`ALTER TABLE "nursing_note_amendments" FORCE ROW LEVEL SECURITY`)
    await q.query(
      `CREATE POLICY "nursing_note_amendments_tenant_isolation" ON "nursing_note_amendments" USING ("tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true)::uuid)`
    )
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "nursing_note_amendments"`)
  }
}
