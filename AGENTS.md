# AGENTS.md — HIS Backend

Backend del **HIS (Sistema Integral de Gestión Hospitalaria)**: monolito modular NestJS. Identificadores de código en inglés (como el árbol actual); documentación y comunicación con el equipo en español (es-CO).

## Stack

- NestJS (monolito modular) + TypeScript
- PostgreSQL + **TypeORM** (único ORM de destino)
- Swagger/OpenAPI generado desde DTOs · class-validator + class-transformer
- Ya existentes: JWT (`auth/`), logging (`common/logging/`), RabbitMQ + email, cron, PDF

> **Migración en curso: MongoDB/Mongoose → PostgreSQL/TypeORM.**
> Todo código nuevo usa **TypeORM, nunca Mongoose**. Mongoose solo se lee para entender un schema que se va a migrar. `mongoose-config/` y la dependencia `mongoose` se eliminan al migrar el último módulo.

## Comandos

```bash
npm run build     # compilar — obligatorio antes de terminar cualquier tarea
npm run lint      # ESLint — puede autocorregir; revisar el diff después

# Migraciones TypeORM (verificar en package.json si ya existen scripts equivalentes)
npx typeorm migration:generate   # generar desde diferencias entidad ↔ BD
npx typeorm migration:run        # aplicar
npx typeorm migration:revert     # revertir la última
```

- Con un DataSource en TypeScript la CLI suele requerir `npx typeorm-ts-node-commonjs -d <ruta-al-data-source> migration:...`. **Verificar en package.json** qué existe antes de inventar un comando.
- Las migraciones tocan la BD: pedir confirmación antes de ejecutarlas.
- **NO ejecutar `npm run test` ni crear `*.spec.ts`.** Verificación = `build` + `lint` + revisión del `git diff`.

## Estructura de directorios (respetar y extender)

```
src/
├── main.ts · app.module.ts · app.controller.ts · app.service.ts
│
├── <dominio>/        # appointment, doctor, medical-record, medicine, nurse, patient, user
│   ├── <dominio>.module.ts
│   ├── <dominio>.controller.ts
│   ├── <dominio>.service.ts
│   ├── dto/
│   │   ├── request/      # create-*-request.dto.ts, update-*-request.dto.ts
│   │   └── response/     # *-response.dto.ts
│   ├── mapper/           # *-response.mapper.ts  (entidad → response DTO)
│   ├── interfaces/       # <dominio>.interface.ts
│   └── model/            # <dominio>.schema.ts (Mongoose, legado) → <dominio>.entity.ts (TypeORM)
│
├── auth/                 # auth.{controller,service,module,guard}.ts, jwt-reset.module.ts
│   ├── dto/{request,response}/
│   ├── interfaces/jwt-payload.interface.ts
│   ├── jwt-set-password-config/
│   └── jwt-sign-in-config/
├── common/
│   ├── dto/              # error.dto.ts, response.dto.ts
│   ├── exception/        # all-exceptions.filter.ts, exception.filter.ts
│   ├── guards/           # extract-user.guard.ts (extrae usuario/tenant del JWT)
│   ├── interceptors/     # response.interceptor.ts, trace.interceptor.ts
│   └── logging/          # logger.{module,service}.ts, log.{interceptor,middleware}.ts,
│                         # log-context.interface.ts, log-level.enum.ts, log-type.enum.ts
├── decorators/
│   ├── request/          # public.decorator.ts
│   ├── swagger/          # error.decorator.ts, response.decorator.ts
│   └── validation/       # isPastInDate.decorator.ts
├── email/                # email.{module,service,consumer}.ts, interfaces/
├── mongoose-config/      # LEGADO — se elimina al terminar la migración
├── pdf/                  # pdf.{module,controller,service}.ts
├── rabbitmq/             # rabbitmq.{module,service}.ts
├── utils/                # utils.ts
│
├── typeorm-config/       # NUEVO: DataSource + TypeOrmConfigService (análogo a mongoose-config/)
└── migrations/           # NUEVO: migraciones TypeORM versionadas
```

Notas:
- `model/` pasa de `*.schema.ts` (Mongoose) a **`*.entity.ts` (TypeORM)**. `patient/` también tiene `patient.cron.ts`.
- `patient/` y `user/` son la referencia del patrón `dto/request` + `dto/response` + `mapper/`. Los módulos con `dto/` plano (appointment, doctor, medical-record, medicine, nurse) se reorganizan a ese patrón **al migrarlos**.
- Los `*.spec.ts` existentes se conservan tal cual: no se borran, no se editan, no se crean nuevos.

## Convenciones del HIS

1. **Un módulo Nest por dominio.** Lógica y acceso a datos en el `service`; **los controllers no tienen lógica** (validan DTO, aplican guards/decoradores y delegan).
2. **DTOs segregados**: `dto/request/` (create y update separados) y `dto/response/`, con mappers en `mapper/`. Nunca devolver entidades directamente. Whitelist + `forbidNonWhitelisted` + `transform` globales (verificar en `main.ts`). **Prohibido** `repository.update(id, req.body)`.
3. **Multi-tenancy**: `tenant_id` en toda tabla de negocio; `facility_id` en entidades operativas (citas, camas, inventario). Ambos salen **SOLO del JWT** (`common/guards/extract-user.guard.ts` + `auth/interfaces/jwt-payload.interface.ts`), nunca de body, query, params ni headers. Toda consulta filtra por `tenant_id`.
4. **Autorización**: denegar por defecto; permiso explícito por ruta; en endpoints con `:id` verificar que el objeto pertenece al tenant/sede del JWT (BOLA). Detalle en skill `his-security`.
5. **Inmutabilidad clínica**: evoluciones, diagnósticos, órdenes, prescripciones y signos vitales son insert-only. **Prohibido** editar o borrar. Corrección = enmienda con motivo, autor y timestamp UTC. Sin hard delete.
6. **Auditoría append-only (`AuditLog`)** integrada en `common/logging/` (reutilizar `LoggerService`, `log-context.interface.ts`, `log.middleware.ts`/`log.interceptor.ts`). **No crear un sistema paralelo.** Se audita: lectura de historia clínica, cambios de estado, exportaciones, impresiones.
7. **Identificadores públicos**: UUIDv4 (o ULID). Nunca enteros secuenciales ni ObjectId expuestos.
8. **Logs**: jamás contraseñas, tokens ni contenido clínico completo.
9. **Reutilizar lo existente**: `response.interceptor.ts`, `all-exceptions.filter.ts`, `decorators/swagger/*`, `@Public()`.
10. **Swagger** en cada endpoint nuevo (DTOs con `@ApiProperty`).

## Reglas de migración Mongo → Postgres

- **Aplicar 3FN.** Cada colección Mongoose se convierte en una o varias tablas normalizadas.
- Arrays embebidos y subdocumentos con identidad propia → **tablas hijas con FK** al padre. Referencias `ObjectId` → FK `uuid`.
- FKs explícitas con `ON DELETE` definido (`RESTRICT` por defecto en datos clínicos). Tablas en `snake_case` plural.
- **Migraciones versionadas y reproducibles** en `src/migrations/`, con `up` y `down`. Nunca editar una migración ya commiteada o aplicada: crear una nueva.
- **`synchronize: true` está prohibido en producción** y no debe aparecer en configuración compartida.
- Migrar en orden de dependencias (padres antes que hijos). No migrar datos existentes de Mongo sin un plan acordado con el equipo.
- Procedimiento detallado: skill `mongo-to-postgres`.

## Reglas de seguridad y operación

- Trabaja siempre en una rama `feat/...` o `fix/...`; si estás en `main`, crea una rama antes de editar. **Nunca commit ni push directo a `main`.**
- Commits pequeños y atómicos, mensajes en español con formato `tipo(módulo): descripción` (ej. `feat(patient): migrar a TypeORM`), sin firmas ni "Co-authored-by". Solo cuando el usuario lo pida.
- `git pull --ff-only` antes de empezar una tarea si hay remoto. `git push` solo cuando el usuario lo pida, a la rama de trabajo (nunca `--force`).
- No secretos en código ni en logs; no leer ni modificar `.env`.
- **No crear `*.spec.ts`.** (El DoD del roadmap menciona pruebas; en este repo se omiten por decisión explícita del equipo.)
- No añadir dependencias sin avisar.
- Antes de dar una tarea por terminada: `npm run build` y `npm run lint` en verde + autorrevisión del `git diff`.

## Trabajo en paralelo (varios agentes)

- Un agente = un módulo/dominio (idealmente un git worktree propio).
- Puntos de conflicto: `app.module.ts`, `common/`, `package.json`, `src/migrations/`. Edítalos de forma mínima y menciónalo en tu reporte.
- Si dos agentes necesitan la misma entidad, el dueño del dominio la crea y el otro la importa.

## Agentes y skills

- Agentes: `@implementer` (edita), `@reviewer` (solo lectura, audita el diff).
- Skills (`.opencode/skills/`): `nest-module`, `mongo-to-postgres`, `his-security`. Cárgalas cuando apliquen.

## Referencia

Reglas de negocio completas (multi-tenancy, RBAC contextual, inmutabilidad, auditoría, plan de sprints): **`docs/roadmap.md`**. Léelo solo si necesitas más detalle que este archivo.