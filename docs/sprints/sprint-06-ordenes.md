# Sprint 6 — Órdenes y Resultados

Estado: **completado**
Rama: `feature/sprint-6-orders`
Inicio: 2026-10-24

## Alcance

Órdenes clínicas de laboratorio e imágenes, resultados estructurados, estudios de imagen y adjuntos privados en Cloudinary.

## Decisiones

- Órdenes ligadas a un `Encounter` abierto del tenant/sede del JWT.
- Resultados de laboratorio por analito y estudios de imagen con enmienda (`amends_*_id` + motivo).
- Resultados, estudios y adjuntos son insert-only (trigger anti UPDATE/DELETE). Las órdenes no se eliminan y solo cambian de estado.
- Adjuntos almacenados en Cloudinary con `type: private`; descarga solo por endpoint autenticado usando URL firmada temporal. No se guardan binarios ni URLs públicas.
- Permisos nuevos: `order:read`, `order:write`, `result:read`, `result:write`, `attachment:read`, `attachment:write`.

## Fases

### Fase 1 — Modelo y migración
- [x] Entidades `ClinicalOrder`, `LabResult`, `ImagingStudy`, `Attachment`.
- [x] Migración `CreateOrdersAndResults` con FKs, CHECKs, índices, RLS y grants.
- [x] Triggers de inmutabilidad y anti DELETE en órdenes.
- [x] Catálogo de permisos nuevos.

### Fase 2 — API
- [x] Crear/listar/obtener orden y cambiar estado.
- [x] Registrar/listar/enmendar resultados de laboratorio.
- [x] Registrar/listar/enmendar estudios de imagen.
- [x] Subir/listar/descargar adjuntos privados.
- [x] DTOs request/response, mapper y Swagger.

### Fase 3 — Seguridad y auditoría
- [x] Aislamiento por tenant/sede y BOLA en todos los recursos.
- [x] Validación de encuentro abierto y pertenencia de orden.
- [x] Auditoría de lectura, creación, cambio de estado, subida y descarga.

### Fase 4 — Verificación y cierre
- [x] `npm run build` y `npm run lint`.
- [x] Migración run/revert/run.
- [x] E2E de orden, resultados, adjuntos e inmutabilidad.
- [x] Cierre del documento y PR a `dev`.
