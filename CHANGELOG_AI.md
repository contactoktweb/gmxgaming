# Registro de Cambios de IA (CHANGELOG_AI.md)

## [2026-09-23]

### Sincronización de Email con Google OAuth y Visualización de Fechas/Horas de Registro
- **app/auth/confirm/route.ts:**
  - Se agregó el campo `email` en la creación de nuevos perfiles vía `.upsert()` en el callback de servidor y en el fallback del cliente.
  - Se agregó sincronización automática de `email` para usuarios existentes que tenían dicho campo nulo o vacío.
- **lib/auth-context.tsx:**
  - Se agregó `email: authUser.email` al crear automáticamente el perfil con Google OAuth en `fetchProfile`.
  - Se añadió la verificación de que si el perfil en base de datos carece de email (`!profile.email`), se actualice y persista el email de la sesión activa.
- **components/dashboard/admin-validations.tsx:**
  - Encabezado de columna actualizado a `FECHA / HORA REGISTRO`.
  - Formato dual de fecha (`DD/MM/AAAA`) y hora (`HH:MM am/pm`) en cada fila de solicitud.
  - Se añadió la fecha y hora exacta de registro al subtítulo del modal de detalles de solicitud.
- **components/dashboard/admin-roles.tsx:**
  - Se agregó la etiqueta con la fecha y hora de registro (`created_at`) debajo del email de cada usuario.
