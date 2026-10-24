import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateCoreSprint0_20261024110000 implements MigrationInterface {
  name = 'CreateCoreSprint0_20261024110000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(200) NOT NULL,
        "slug" varchar(100) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_tenants_slug" UNIQUE ("slug"),
        CONSTRAINT "chk_tenants_status" CHECK ("status" IN ('active', 'inactive', 'suspended'))
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "facilities" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "name" varchar(200) NOT NULL,
        "code" varchar(50) NOT NULL,
        "timezone" varchar(64) NOT NULL DEFAULT 'America/Bogota',
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_facilities_tenant_code" UNIQUE ("tenant_id", "code"),
        CONSTRAINT "chk_facilities_status" CHECK ("status" IN ('active', 'inactive')),
        CONSTRAINT "fk_facilities_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_facilities_tenant_id" ON "facilities" ("tenant_id")')

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(320) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_users_status" CHECK ("status" IN ('active', 'inactive', 'locked'))
      )
    `)
    await queryRunner.query('CREATE UNIQUE INDEX "idx_users_email" ON "users" ("email")')

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "actor_user_id" uuid,
        "tenant_id" uuid,
        "facility_id" uuid,
        "action" varchar(50) NOT NULL,
        "resource_type" varchar(100) NOT NULL,
        "resource_id" uuid,
        "timestamp" timestamptz NOT NULL DEFAULT now(),
        "ip" varchar(64),
        "request_id" uuid,
        "before_summary" jsonb,
        "after_summary" jsonb,
        CONSTRAINT "chk_audit_logs_action" CHECK (
          "action" IN ('READ', 'CREATE', 'UPDATE', 'DELETE', 'STATE_CHANGE', 'EXPORT', 'PRINT')
        ),
        CONSTRAINT "fk_audit_logs_actor" FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_audit_logs_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_audit_logs_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_audit_logs_tenant_timestamp" ON "audit_logs" ("tenant_id", "timestamp")')
    await queryRunner.query('CREATE INDEX "idx_audit_logs_actor_user_id" ON "audit_logs" ("actor_user_id")')
    await queryRunner.query('CREATE INDEX "idx_audit_logs_resource" ON "audit_logs" ("resource_type", "resource_id")')

    await queryRunner.query(`
      CREATE FUNCTION prevent_modification() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
      END;
      $$ LANGUAGE plpgsql
    `)
    await queryRunner.query(`
      CREATE TRIGGER trg_audit_logs_immutable
      BEFORE UPDATE OR DELETE ON "audit_logs"
      FOR EACH ROW EXECUTE FUNCTION prevent_modification()
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TRIGGER IF EXISTS "trg_audit_logs_immutable" ON "audit_logs"')
    await queryRunner.query('DROP FUNCTION IF EXISTS prevent_modification()')
    await queryRunner.query('DROP TABLE IF EXISTS "audit_logs"')
    await queryRunner.query('DROP TABLE IF EXISTS "users"')
    await queryRunner.query('DROP TABLE IF EXISTS "facilities"')
    await queryRunner.query('DROP TABLE IF EXISTS "tenants"')
  }
}
