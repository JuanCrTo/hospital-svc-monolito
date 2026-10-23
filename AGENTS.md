# Instrucciones para agentes — hospital-b

## Alcance y seguridad

- Este repositorio es la API `hospital-b`, construida con NestJS y TypeScript.
- Trata la información clínica y las credenciales como sensible: no imprimas, copies ni incorpores secretos de `.env` en código, pruebas, documentación o mensajes.
- Conserva cambios locales ajenos. No ejecutes operaciones Git que modifiquen el árbol de trabajo ni comandos de instalación o actualización salvo petición expresa.
- No modifiques `.gitignore` ni `.vscode/settings.json` sin una solicitud explícita del usuario. Antes de editar un archivo existente, léelo y crea una copia de seguridad sólo cuando la edición no sea fácilmente reversible o pueda afectar configuración local.

## Mapa técnico

- Punto de entrada: `src/main.ts`; composición de módulos: `src/app.module.ts`.
- Dominios: `auth`, `user`, `patient`, `doctor`, `nurse`, `appointment`, `medical-record` y `medicine`.
- Infraestructura transversal: `common`, `decorators`, `mongoose-config`, `email`, `rabbitmq`, `pdf` y `utils`.
- Persistencia: MongoDB mediante Mongoose. Integraciones: RabbitMQ, Mailgun, Google Maps y Cloudinary. Sus valores se configuran por entorno; usa `.env.example` sólo como contrato de nombres.

## Flujo de análisis arquitectónico

1. Lee el módulo, controlador, servicio, DTO, modelo e interfaces relacionados antes de proponer cambios.
2. Traza dependencias desde `AppModule` y la ruta HTTP o consumidor de cola hasta persistencia e integraciones externas.
3. Identifica contratos públicos (DTO, Swagger, respuestas, colas y variables de entorno), autorización y validación antes de cambiar comportamiento.
4. Expón hallazgos, riesgos clínicos o de seguridad, archivos afectados y alternativas. No asumas que los servicios externos están disponibles.

## Implementación

- Mantén la organización modular existente y las convenciones locales; no introduzcas una segunda abstracción, configuración o herramienta si la actual cubre el caso.
- Valida entradas con DTOs y `class-validator`; preserva guards, decoradores y documentación Swagger de las rutas protegidas.
- Cambios de esquema o contratos deben ser compatibles o incluir una migración/plan explícito. Evita efectos secundarios de correo, cola y servicios externos en pruebas unitarias.
- Añade o ajusta pruebas enfocadas cuando cambie comportamiento. No uses `npm run lint` para una mera comprobación: el script actual ejecuta ESLint con `--fix`.

## Revisión y verificación

- Revisa primero seguridad (autorización, fuga de datos, secretos), validación, errores, compatibilidad de API y efectos asíncronos.
- Después comprueba consistencia de módulos, tipos, DTOs, modelos, tests y documentación Swagger.
- Verificaciones seguras preferidas: `npx tsc --noEmit`, `npm test -- --runInBand` y pruebas específicas. Ejecuta integración/e2e sólo con servicios y variables de entorno confirmados.
- Al cerrar, informa qué se modificó, qué se verificó, riesgos conocidos y trabajo pendiente.
