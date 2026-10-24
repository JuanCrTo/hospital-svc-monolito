import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateIamSprint1_20261024120000 implements MigrationInterface {
  name = 'CreateIamSprint1_20261024120000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN "role" varchar(20) NOT NULL DEFAULT \'patient\'')
    await queryRunner.query(
      'ALTER TABLE "users" ADD CONSTRAINT "chk_users_role" CHECK ("role" IN (\'doctor\', \'nurse\', \'patient\'))'
    )

    await queryRunner.query(`
      CREATE TABLE "departments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "facility_id" uuid NOT NULL,
        "name" varchar(200) NOT NULL,
        "code" varchar(50) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_departments_tenant_facility_code" UNIQUE ("tenant_id", "facility_id", "code"),
        CONSTRAINT "chk_departments_status" CHECK ("status" IN ('active', 'inactive')),
        CONSTRAINT "fk_departments_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_departments_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_departments_tenant_id" ON "departments" ("tenant_id")')
    await queryRunner.query('CREATE INDEX "idx_departments_facility_id" ON "departments" ("facility_id")')

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "code" varchar(100) NOT NULL,
        "description" varchar(255),
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_roles_tenant_code" UNIQUE ("tenant_id", "code"),
        CONSTRAINT "chk_roles_status" CHECK ("status" IN ('active', 'inactive')),
        CONSTRAINT "fk_roles_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_roles_tenant_id" ON "roles" ("tenant_id")')

    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(120) NOT NULL,
        "description" varchar(255),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_permissions_code" UNIQUE ("code")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "fk_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "fk_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "memberships" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "permissions_version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_memberships_user_tenant" UNIQUE ("user_id", "tenant_id"),
        CONSTRAINT "chk_memberships_status" CHECK ("status" IN ('active', 'suspended', 'revoked')),
        CONSTRAINT "fk_memberships_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_memberships_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_memberships_tenant_id" ON "memberships" ("tenant_id")')
    await queryRunner.query('CREATE INDEX "idx_memberships_user_id" ON "memberships" ("user_id")')

    await queryRunner.query(`
      CREATE TABLE "membership_roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "membership_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "facility_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_membership_roles_membership" FOREIGN KEY ("membership_id") REFERENCES "memberships" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "fk_membership_roles_role" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_membership_roles_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query(
      'CREATE UNIQUE INDEX "uq_membership_roles_tenant_wide" ON "membership_roles" ("membership_id", "role_id") WHERE "facility_id" IS NULL'
    )
    await queryRunner.query(
      'CREATE UNIQUE INDEX "uq_membership_roles_facility" ON "membership_roles" ("membership_id", "role_id", "facility_id") WHERE "facility_id" IS NOT NULL'
    )
    await queryRunner.query('CREATE INDEX "idx_membership_roles_membership_id" ON "membership_roles" ("membership_id")')

    await queryRunner.query(`
      CREATE TABLE "facility_assignments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "membership_id" uuid NOT NULL,
        "facility_id" uuid NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_facility_assignments_membership_facility" UNIQUE ("membership_id", "facility_id"),
        CONSTRAINT "chk_facility_assignments_status" CHECK ("status" IN ('active', 'inactive')),
        CONSTRAINT "fk_facility_assignments_membership" FOREIGN KEY ("membership_id") REFERENCES "memberships" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "fk_facility_assignments_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_facility_assignments_membership_id" ON "facility_assignments" ("membership_id")')
    await queryRunner.query('CREATE INDEX "idx_facility_assignments_facility_id" ON "facility_assignments" ("facility_id")')

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" varchar(128) NOT NULL,
        "family_id" uuid NOT NULL,
        "tenant_id" uuid,
        "facility_id" uuid,
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        "replaced_by_token_id" uuid,
        "ip" varchar(64),
        "user_agent" varchar(255),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_refresh_tokens_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "fk_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")')
    await queryRunner.query('CREATE INDEX "idx_refresh_tokens_family_id" ON "refresh_tokens" ("family_id")')

    await queryRunner.query(`
      INSERT INTO "permissions" ("code", "description") VALUES
        ('tenant:read', 'Leer datos del tenant activo'),
        ('facility:read', 'Leer sedes'),
        ('facility:write', 'Crear y modificar sedes'),
        ('department:read', 'Leer departamentos'),
        ('department:write', 'Crear y modificar departamentos'),
        ('membership:read', 'Leer membresías del tenant'),
        ('membership:write', 'Crear y modificar membresías, roles y asignaciones'),
        ('role:read', 'Leer roles y permisos'),
        ('role:write', 'Crear y modificar roles'),
        ('patient:read', 'Leer pacientes'),
        ('patient:write', 'Crear y modificar pacientes'),
        ('appointment:read', 'Leer citas'),
        ('appointment:write', 'Crear y modificar citas'),
        ('clinical:read', 'Leer historia clínica'),
        ('clinical:write', 'Registrar atención clínica'),
        ('audit:read', 'Leer auditoría')
      ON CONFLICT ("code") DO NOTHING
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "refresh_tokens"')
    await queryRunner.query('DROP TABLE IF EXISTS "facility_assignments"')
    await queryRunner.query('DROP TABLE IF EXISTS "membership_roles"')
    await queryRunner.query('DROP TABLE IF EXISTS "memberships"')
    await queryRunner.query('DROP TABLE IF EXISTS "role_permissions"')
    await queryRunner.query('DROP TABLE IF EXISTS "permissions"')
    await queryRunner.query('DROP TABLE IF EXISTS "roles"')
    await queryRunner.query('DROP TABLE IF EXISTS "departments"')
    await queryRunner.query('ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_role"')
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "role"')
  }
}
