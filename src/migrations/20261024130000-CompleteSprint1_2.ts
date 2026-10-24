import { MigrationInterface, QueryRunner } from 'typeorm'

const TENANT = `NULLIF(current_setting('app.tenant_id', true), '')::uuid`
const ACTOR = `NULLIF(current_setting('app.user_id', true), '')::uuid`
const PLATFORM = `current_setting('app.is_platform', true) = 'true'`

export class CompleteSprint1_2_20261024130000 implements MigrationInterface {
  name = 'CompleteSprint1_2_20261024130000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN "is_platform_admin" boolean NOT NULL DEFAULT false')

    await queryRunner.query(`
      CREATE TABLE "user_invitations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "token_hash" varchar(128) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "accepted_at" timestamptz,
        "revoked_at" timestamptz,
        "created_by" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_user_invitations_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "fk_user_invitations_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "fk_user_invitations_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_user_invitations_created_by" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_user_invitations_user_id" ON "user_invitations" ("user_id")')
    await queryRunner.query('CREATE INDEX "idx_user_invitations_tenant_id" ON "user_invitations" ("tenant_id")')

    await queryRunner.query(`
      INSERT INTO "permissions" ("code", "description") VALUES
        ('user:read', 'Leer usuarios'),
        ('user:write', 'Crear y modificar usuarios')
      ON CONFLICT ("code") DO NOTHING
    `)

    await queryRunner.query('ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY')
    await queryRunner.query(`
      CREATE POLICY "tenants_select" ON "tenants" FOR SELECT
      USING ("id" = ${TENANT} OR ${PLATFORM})
    `)
    await queryRunner.query(`
      CREATE POLICY "tenants_insert" ON "tenants" FOR INSERT
      WITH CHECK (${PLATFORM})
    `)
    await queryRunner.query(`
      CREATE POLICY "tenants_update" ON "tenants" FOR UPDATE
      USING ("id" = ${TENANT} OR ${PLATFORM})
      WITH CHECK ("id" = ${TENANT} OR ${PLATFORM})
    `)

    for (const table of ['facilities', 'departments', 'roles']) {
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`)
      await queryRunner.query(`
        CREATE POLICY "${table}_select" ON "${table}" FOR SELECT
        USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
      `)
      await queryRunner.query(`
        CREATE POLICY "${table}_insert" ON "${table}" FOR INSERT
        WITH CHECK ("tenant_id" = ${TENANT} OR ${PLATFORM})
      `)
      await queryRunner.query(`
        CREATE POLICY "${table}_update" ON "${table}" FOR UPDATE
        USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
        WITH CHECK ("tenant_id" = ${TENANT} OR ${PLATFORM})
      `)
    }

    await queryRunner.query('ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY')
    await queryRunner.query(`
      CREATE POLICY "memberships_select" ON "memberships" FOR SELECT
      USING ("tenant_id" = ${TENANT} OR "user_id" = ${ACTOR} OR ${PLATFORM})
    `)
    await queryRunner.query(`
      CREATE POLICY "memberships_insert" ON "memberships" FOR INSERT
      WITH CHECK ("tenant_id" = ${TENANT} OR ${PLATFORM})
    `)
    await queryRunner.query(`
      CREATE POLICY "memberships_update" ON "memberships" FOR UPDATE
      USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
      WITH CHECK ("tenant_id" = ${TENANT} OR ${PLATFORM})
    `)

    await queryRunner.query('ALTER TABLE "membership_roles" ENABLE ROW LEVEL SECURITY')
    await queryRunner.query(`
      CREATE POLICY "membership_roles_select" ON "membership_roles" FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM "memberships" m
          WHERE m."id" = "membership_roles"."membership_id"
            AND (m."tenant_id" = ${TENANT} OR m."user_id" = ${ACTOR} OR ${PLATFORM})
        )
      )
    `)
    await queryRunner.query(`
      CREATE POLICY "membership_roles_insert" ON "membership_roles" FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM "memberships" m
          WHERE m."id" = "membership_roles"."membership_id"
            AND (m."tenant_id" = ${TENANT} OR ${PLATFORM})
        )
      )
    `)
    await queryRunner.query(`
      CREATE POLICY "membership_roles_update" ON "membership_roles" FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM "memberships" m
          WHERE m."id" = "membership_roles"."membership_id"
            AND (m."tenant_id" = ${TENANT} OR ${PLATFORM})
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM "memberships" m
          WHERE m."id" = "membership_roles"."membership_id"
            AND (m."tenant_id" = ${TENANT} OR ${PLATFORM})
        )
      )
    `)
    await queryRunner.query(`
      CREATE POLICY "membership_roles_delete" ON "membership_roles" FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM "memberships" m
          WHERE m."id" = "membership_roles"."membership_id"
            AND (m."tenant_id" = ${TENANT} OR ${PLATFORM})
        )
      )
    `)

    await queryRunner.query('ALTER TABLE "facility_assignments" ENABLE ROW LEVEL SECURITY')
    await queryRunner.query(`
      CREATE POLICY "facility_assignments_select" ON "facility_assignments" FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM "memberships" m
          WHERE m."id" = "facility_assignments"."membership_id"
            AND (m."tenant_id" = ${TENANT} OR m."user_id" = ${ACTOR} OR ${PLATFORM})
        )
      )
    `)
    await queryRunner.query(`
      CREATE POLICY "facility_assignments_insert" ON "facility_assignments" FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM "memberships" m
          WHERE m."id" = "facility_assignments"."membership_id"
            AND (m."tenant_id" = ${TENANT} OR ${PLATFORM})
        )
      )
    `)
    await queryRunner.query(`
      CREATE POLICY "facility_assignments_update" ON "facility_assignments" FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM "memberships" m
          WHERE m."id" = "facility_assignments"."membership_id"
            AND (m."tenant_id" = ${TENANT} OR ${PLATFORM})
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM "memberships" m
          WHERE m."id" = "facility_assignments"."membership_id"
            AND (m."tenant_id" = ${TENANT} OR ${PLATFORM})
        )
      )
    `)
    await queryRunner.query(`
      CREATE POLICY "facility_assignments_delete" ON "facility_assignments" FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM "memberships" m
          WHERE m."id" = "facility_assignments"."membership_id"
            AND (m."tenant_id" = ${TENANT} OR ${PLATFORM})
        )
      )
    `)

    await queryRunner.query('ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY')
    await queryRunner.query(`
      CREATE POLICY "role_permissions_select" ON "role_permissions" FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM "roles" r
          WHERE r."id" = "role_permissions"."role_id"
            AND (r."tenant_id" = ${TENANT} OR ${PLATFORM})
        )
      )
    `)
    await queryRunner.query(`
      CREATE POLICY "role_permissions_write" ON "role_permissions" FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM "roles" r
          WHERE r."id" = "role_permissions"."role_id"
            AND (r."tenant_id" = ${TENANT} OR ${PLATFORM})
        )
      )
    `)
    await queryRunner.query(`
      CREATE POLICY "role_permissions_delete" ON "role_permissions" FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM "roles" r
          WHERE r."id" = "role_permissions"."role_id"
            AND (r."tenant_id" = ${TENANT} OR ${PLATFORM})
        )
      )
    `)

    await queryRunner.query('ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY')
    await queryRunner.query(`
      CREATE POLICY "audit_logs_select" ON "audit_logs" FOR SELECT
      USING ("tenant_id" = ${TENANT} OR ${PLATFORM})
    `)
    await queryRunner.query(`
      CREATE POLICY "audit_logs_insert" ON "audit_logs" FOR INSERT
      WITH CHECK ("tenant_id" = ${TENANT} OR ${PLATFORM})
    `)

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hospital_app') THEN
          GRANT USAGE ON SCHEMA public TO hospital_app;
          GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hospital_app;
          GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hospital_app;
        END IF;
      END
      $$;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'tenants',
      'facilities',
      'departments',
      'roles',
      'memberships',
      'membership_roles',
      'facility_assignments',
      'role_permissions',
      'audit_logs'
    ]
    for (const table of tables) {
      await queryRunner.query(`DROP POLICY IF EXISTS "${table}_select" ON "${table}"`)
      await queryRunner.query(`DROP POLICY IF EXISTS "${table}_insert" ON "${table}"`)
      await queryRunner.query(`DROP POLICY IF EXISTS "${table}_update" ON "${table}"`)
      await queryRunner.query(`DROP POLICY IF EXISTS "${table}_write" ON "${table}"`)
      await queryRunner.query(`DROP POLICY IF EXISTS "${table}_delete" ON "${table}"`)
      await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`)
    }

    await queryRunner.query('DROP TABLE IF EXISTS "user_invitations"')
    await queryRunner.query(
      `DELETE FROM "permissions" p
       WHERE p."code" IN ('user:read', 'user:write')
         AND NOT EXISTS (SELECT 1 FROM "role_permissions" rp WHERE rp."permission_id" = p."id")`
    )
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "is_platform_admin"')
  }
}
