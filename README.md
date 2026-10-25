# 🏥 Hospital Yellow API

API RESTful para la gestión hospitalaria. Permite administrar pacientes, doctores, enfermeros, envío de correos automatizados, documentación Swagger, colas de trabajo y más.

🔗 [🔍 Ver Documentación Swagger desplegada](https://hospital-b-prod.up.railway.app/api)

---

## 🧑‍💻 Proyecto en Producción

- 🔧 **Backend desplegado en Railway**
  - Usando **Serverless Base de datos PostgreSQL (Cold Starts)**
- 🛢️ **Base de datos Base de datos PostgreSQL en Railway**
  - Usando **Serverless Base de datos PostgreSQL (Cold Starts)**
- 🔐 JWT configurado y Swagger protegido
- 🐇 **RabbitMQ desplegado en CloudAMQP**
  - Utilizado para la gestión de colas

---

## 📦 Tecnologías Usadas

- **Backend Framework:** [NestJS](https://nestjs.com/)
- **Lenguaje:** TypeScript
- **Base de Datos:** PostgreSQL 16 (TypeORM) — destino de la migración
- **Base de Datos legado:** Base de datos PostgreSQL (Mongoose ODM) durante la migración
- **Autenticación:** JWT
- **Colas de Trabajo:** RabbitMQ
- **Correo:** Mailgun
- **Media Storage:** Cloudinary (en desarrollo)
- **Documentación:** Swagger
- **Despliegue:**
  - Backend y Base de Datos: Railway
  - Colas de Trabajo: CloudAMQP (RabbitMQ)


---

## 🧩 Arquitectura

- Arquitectura modular siguiendo principios de Clean Architecture.
- Separación clara entre controladores, servicios, DTOs, modelos y validaciones.
- Uso de pipes y guards para lógica transversal.

---

## 📂 Estructura del Proyecto

```bash
hospital-api/
├── src/
│   ├── auth/                  # Módulo de autenticación
│   │   ├── dto/
│   │   ├── interfaces/
│   │   ├── auth.controller.ts
│   │   ├── auth.guard.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   │   └── jwt-reset.module.ts
│   │
│   ├── decorators/                # Módulo de decoradores
│   │   ├── apiAuthResponse.decorator.ts
│   │   ├── isPastDate.decorator.ts
│   │   └── public.decorator.ts
│   │
│   ├── doctor/                # Módulo de doctores
│   │   ├── dto/
│   │   ├── interfaces/
│   │   ├── model/
│   │   ├── doctor.controller.ts
│   │   ├── doctor.module.ts
│   │   └── doctor.service.ts
│   │
│   ├── email/                  # Envío de correos
│   │   ├── interfaces/
│   │   ├── email.consumer.ts   # RabbitMQ consumer
│   │   ├── email.module.ts
│   │   ├── email.service.ts
│   │
│   ├── nurse/                # Módulo de enfermeros
│   │   ├── dto/
│   │   ├── interfaces/
│   │   ├── model/
│   │   ├── nurse.controller.ts
│   │   ├── nurse.module.ts
│   │   └── nurse.service.ts
│   │
│   ├── patient/               # Módulo de pacientes
│   │   ├── dto/
│   │   ├── interfaces/
│   │   ├── model/
│   │   ├── patient.controller.ts
│   │   ├── patient.cron.ts
│   │   ├── patient.module.ts
│   │   └── patient.service.ts
│   │
│   ├── rabbitmq/                   # Manejo de colas con RabbitMQ
│   │   ├── rabbitmq.module.ts
│   │   ├── rabbitmq.service.ts
│   │
│   ├── user/               # Módulo de usuarios
│   │   ├── dto/
│   │   ├── enums/
│   │   ├── interfaces/
│   │   ├── model/
│   │   ├── user.controller.ts
│   │   ├── user.module.ts
│   │   └── user.service.ts
│   │
│   ├── tenant/                 # Entidad Tenant (TypeORM)
│   ├── facility/               # Entidad Facility (TypeORM)
│   ├── health/                 # /health/live y /health/ready
│   ├── migrations/             # Migraciones versionadas de TypeORM
│   ├── typeorm-config/         # DataSource CLI y configuración de Nest
│   │
│   ├── utils/                   # Funciones auxiliares
│   │   ├── utils.ts
│   │
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   ├── main.ts
│
├── .env.example
├── .gitignore
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── README.md

```

---

## 🔐 Autenticación

- Autenticación basada en JWT.
- Middleware y guards personalizados para proteger rutas según el rol del usuario.
- Soporte para recuperación de contraseña con tokens seguros.

---

## 📬 Mailgun + RabbitMQ

- Emails de bienvenida y recuperación de contraseña automatizadas.
- RabbitMQ gestiona las colas de envío asíncrono.

---

## 🧾 Documentación Swagger

La API está completamente documentada usando Swagger:
- Contiene descripciones, modelos y autorización con JWT.
- Estructura uniforme para respuestas HTTP (`statusCode`, `message`, `data`, `errors`).

🔗 [🔍 Ver Documentación Swagger desplegada](https://hospital-b-prod.up.railway.app/api)

---

## 📄 Ejemplo de Respuesta Estandarizada

🧪 Esta funcionalidad está en proceso de implementación. El objetivo es que todas las respuestas de la API sigan una estructura base coherente y predecible, facilitando el consumo desde el frontend, la documentación en Swagger y la trazabilidad de errores y logs.

### 🔧 Estado actual:
Actualmente, algunos endpoints ya siguen esta estructura, pero **no está aplicado de forma global** con un interceptor ni en todos los módulos.

### 🧾 Ejemplo en Swagger  (previsto)
```typescript
@ApiResponse({
  status: 200,
  description: 'Operación exitosa',
  type: SuccessResponseDto,
})
@ApiResponse({
  status: 400,
  description: 'Error de validación',
  type: ErrorResponseDto,
})
@ApiResponse({
  status: 500,
  description: 'Error interno del servidor',
  type: InternalErrorDto,
})

```

### 🧾 DTOs de Respuesta
```typescript
export class SuccessResponseDto {
  statusCode: number;
  message: string;
  data: any;
  meta?: any;
}

export class ErrorResponseDto {
  statusCode: number;
  message: string;
  errors?: string[];
}

export class InternalErrorDto {
  statusCode: number;
  message: string;
  debug?: any;
}

```

> 💡 Esta estandarización se encuentra listada en el 📍Roadmap como una mejora pendiente y se integrará en versiones futuras del proyecto.

---

## 🚀 Cómo Ejecutar Localmente

Sigue estos pasos para ejecutar el backend de la API de Hospitales en tu entorno local:

### 1. 🔁 Clonar el repositorio

```bash
git clone https://github.com/JuanCrTo/hospital-b.git
```

### 2. 📦 Instalar dependencias
npm install

### 3. 🛠️ Crear archivo de entorno
* Copia el archivo .env.example y crea el archivo .env
* Edita el archivo .env con tus variables reales (Base de datos PostgreSQL, JWT, Mailgun, RabbitMQ, etc.).

### 4. 🧪 Verificar dependencias externas
Asegúrate de tener ejecutando o configurado correctamente:

* 🐘 PostgreSQL 16 (local o con `docker compose up postgres`)
* 🐇 RabbitMQ (puede estar en CloudAMQP o local)
* 🍃 Base de datos PostgreSQL (local o desplegado) — legado durante la migración
* Mailgun y Cloudinary si vas a probar envíos de correo y subida de archivos

### 5. 🗄️ Aplicar migraciones de PostgreSQL
```bash
# Ejecuta las migraciones versionadas de src/migrations/
npm run migration:run

# Comandos disponibles
npm run migration:generate -- src/migrations/NombreDeLaMigracion
npm run migration:revert
npm run migration:show
```

> ⚠️ Las migraciones modifican la base de datos. Revísalas antes de ejecutarlas.

### 6. 🚦 Levantar el servidor en modo desarrollo
```bash
npm run start:dev
```

### 7. 📲 Probar la API
* Abre Postman o tu cliente HTTP favorito
* Usa la URL base: `http://localhost:4000`
* Accede a la documentación Swagger:
http://localhost:4000/api

### 8. ✅ Comprobación
Si todo está bien:

* Swagger debería cargar en /api
* Los endpoints deberían responder correctamente
* `GET /api/v1/health/live` responde `{"status":"ok"}`
* `GET /api/v1/health/ready` responde `{"status":"ok","database":"up"}` si PostgreSQL está disponible
* Si usas colas (RabbitMQ), asegúrate que esté activa la conexión

---

## 🐳 Cómo Ejecutar con Docker

El proyecto incluye un `Dockerfile` multi-etapa (`development` y `production`) y un `docker-compose.yml` que levanta la API junto con **PostgreSQL**, **Base de datos PostgreSQL** (legado) y **RabbitMQ** para desarrollo local.

### Archivos Docker incluidos

| Archivo | Propósito |
|---------|-----------|
| `Dockerfile` | Imagen multi-stage: `development` (hot-reload con `start:dev`) y `production` (build compilado). |
| `docker-compose.yml` | Orquesta `api`, `postgres`, `rabbitmq` en la red `hospital`. |
| `.dockerignore` | Excluye `node_modules`, `dist`, `.env`, etc. del contexto de build. |

### 1. 🧩 Requisitos

- [Docker](https://docs.docker.com/get-docker/) (Docker Desktop, o Docker Engine + Compose v2).

### 2. 🛠️ Preparar variables de entorno

El `.env` es obligatorio. `docker-compose.yml` lo carga con `env_file`, pero **sobrescribe** las conexiones para apuntar a los contenedores:

- `DB_HOST` → `postgres` · `DB_PORT` → `5432`
- `RABBITMQ_URL` → `amqp://rabbitmq:5672`
- `PORT` → `4000`

Las credenciales locales de PostgreSQL se toman de `DB_USER`, `DB_PASSWORD` y `DB_NAME` (por defecto `hospital`).

```bash
cp .env.example .env
# Edita .env con tus valores reales (JWT, Mailgun, Google Maps, Cloudinary, etc.)
```

> 💡 Las claves de servicios externos (Mailgun, Google Maps, Cloudinary) siguen viniendo de tu `.env`. Si no las usas en pruebas locales puedes dejarlas vacías, pero algunos flujos (envío de correo, geocodificación) fallarán.

### 3. 🚦 Levantar el stack en desarrollo

El flujo son **dos pasos**: primero descargas/construyes las imágenes Docker, y luego levantas el proyecto. La API se ejecuta con `npm run start:dev` dentro del contenedor.

#### Paso 1 — Descargar/construir las imágenes

```bash
# Descarga las imágenes base (node:20-bookworm-slim, postgres:16-alpine, mongo:7, rabbitmq:3-management)
# y construye la imagen de la API (target: development)
docker compose build

# (o forzando reconstrucción sin caché)
docker compose build --no-cache
```

Si prefieres descargar sólo las imágenes de infraestructura (PostgreSQL, PostgreSQL y RabbitMQ) sin construir la API todavía:

```bash
docker pull postgres:16-alpine
docker pull rabbitmq:3-management
```

#### Paso 2 — Levantar el proyecto

```bash
# Levantar todo el stack (api + postgres + mongo + rabbitmq).
# El contenedor de la API ejecuta `npm run start:dev`.
docker compose up
```

Para ejecutarlo en segundo plano:

```bash
docker compose up -d
```

`docker compose up --build` combina ambos pasos (construye y levanta) en un solo comando.

Esto deja disponibles:

| Servicio | URL / Puerto | Descripción |
|----------|--------------|-------------|
| API | http://localhost:4000 | Backend NestJS con hot-reload |
| Swagger | http://localhost:4000/api | Documentación interactiva |
| Health live | http://localhost:4000/api/v1/health/live | Liveness probe |
| Health ready | http://localhost:4000/api/v1/health/ready | Readiness probe (PostgreSQL) |
| PostgreSQL | `localhost:5432` | Base de datos principal |
| RabbitMQ | `localhost:5672` | Broker de colas |
| RabbitMQ UI | http://localhost:15672 | Panel web (`guest` / `guest`) |

El código fuente está montado como volumen (`.:/usr/src/app`), por lo que los cambios en `src/` recargan el servidor automáticamente.

### 4. 💻 Ejecutar los `npm run` dentro del contenedor

El comando de arranque ya es `npm run start:dev`, pero puedes ejecutar cualquier script de `package.json` dentro del contenedor con `docker compose exec`:

```bash
# Desarrollo con hot-reload (ya es el comando por defecto del contenedor)
docker compose exec api npm run start:dev

# Build de producción
docker compose exec api npm run build

# Ejecutar la app compilada
docker compose exec api npm run start:prod

# Tests
docker compose exec api npm test -- --runInBand

# Linter
docker compose exec api npm run lint
```

> 💡 Alternativa sin Docker: si ya tienes Node.js 20+ y Base de datos PostgreSQL/RabbitMQ accesibles localmente, ejecuta directamente `npm install` y `npm run start:dev` (ver [🚀 Cómo Ejecutar Localmente](#-cómo-ejecutar-localmente)).

### 5. 🧪 Comandos útiles

```bash
# Ver logs de la API
docker compose logs -f api

# Abrir una shell dentro del contenedor de la API
docker compose exec api sh

# Ejecutar los tests dentro del contenedor
docker compose exec api npm test -- --runInBand

# Detener el stack (conserva los volúmenes de datos)
docker compose down

# Detener y borrar también los datos de Mongo y RabbitMQ
docker compose down -v
```

### 6. 🏗️ Imagen de producción

Para construir y ejecutar la imagen de producción (sin el stack de desarrollo):

```bash
# Construir la imagen de producción
docker build --target production -t hospital-b:prod .

# Ejecutar apuntando a tus servicios externos
docker run --rm -p 4000:4000 --env-file .env hospital-b:prod
```


---

## 🌍 Despliegue

- El backend y la base de datos Base de datos PostgreSQL están desplegados en **Railway** (1 vCPU y 3 GB de RAM).
- Railway maneja automáticamente el certificado **HTTPS**.
- Configurado con **CORS**, acceso con **JWT**, documentación Swagger.
- Las colas de trabajo con **RabbitMQ** están gestionadas desde **CloudAMQP**.

---

## 🗺️ Roadmap

Este roadmap detalla las funcionalidades actuales del proyecto y las mejoras planificadas para versiones futuras. Su propósito es guiar el desarrollo continuo y demostrar la planificación técnica a largo plazo.

### ✅ MVP Completo

- [x] CRUD para Doctores, Enfermeros y Pacientes
- [x] Autenticación basada en JWT
- [x] Envío de correos con Mailgun mediante colas RabbitMQ
- [x] Documentación completa con Swagger
- [x] Despliegue de Backend en Railway
- [x] Despliegue de Base de Datos Base de datos PostgreSQL en Railway
- [x] Variables de entorno gestionadas mediante `.env`
- [x] Integración con servicios externos de Google Maps para ubicación de pacientes

### 🚧 Mejoras en Proceso

- [ ] Estandarización de todas las respuestas HTTP (estructura uniforme para 200, 201, 400, 404, 500, etc.)
- [ ] Integración completa de cookies seguras con CSRF protection
- [ ] Logs detallados para trazabilidad de accesos y acciones críticas
- [ ] Agregado de configuración para protección contra ataques brute-force y rate limiting
- [ ] Limpieza y optimización del código (refactor de controladores y servicios)

---

### 📦 Funcionalidades Avanzadas Futuras

- [ ] Exportación automática de historiales médicos en PDF
- [ ] Soporte multirol (SuperAdministrador y Administrador)
- [ ] Dashboard de estadísticas para gestión hospitalaria
- [ ] Gestión de archivos adjuntos (documentación médica) con Cloudinary

---

## 👨‍💼 Objetivo del Proyecto
Este proyecto fue construido con el propósito de mostrar habilidades avanzadas en backend:

* ✅ Arquitectura limpia y mantenible
* ✅ Buenas prácticas de desarrollo
* ✅ Despliegue real y funcional en la nube
* ✅ Seguridad, modularidad y escalabilidad

---