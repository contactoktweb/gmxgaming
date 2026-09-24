# Registro de Cambios de IA (CHANGELOG_AI.md)

## [2026-09-23]

### Auditoría y Visualización del Administrador que Aprobó / Rechazó cada Solicitud
- **components/dashboard/admin-validations.tsx:**
  - **Tabla de Validaciones:** En la columna `ESTATUS`, para solicitudes aprobadas (`ACTIVO`) o rechazadas (`RECHAZADO`), ahora se muestra el distintivo con el icono de escudo y el nombre del administrador responsable: `Por: Admin Principal (Raúl)` (o el administrador correspondiente), junto con tooltips informativos con la fecha y hora exacta.
  - **Botones de Acción:** Los tooltips de los botones de acción inactivos comunican claramente quién tomó la decisión: *"Esta solicitud ya fue aprobada por [Administrador] y se encuentra activa"* o *"Esta solicitud fue rechazada por [Administrador]"*.
  - **Modal de Detalles:** Al inspeccionar una solicitud (icono 👁️), se agregó un banner destacado de auditoría en la parte superior del cuerpo del modal indicando si fue aprobada o rechazada, qué administrador la gestionó, el motivo del rechazo (si aplica) y la fecha/hora de revisión.
  - **Persistencia de Auditoría:** En todas las operaciones de aprobación y rechazo (`handleExecuteAction`), se registran en `details` los campos `approved_by`, `approved_by_id`, `approved_by_email`, `approved_at`, `reviewed_by`, `rejected_by`, `rejected_at`.
  - **Exclusión en Diffs:** Los nuevos campos de auditoría administrativa se agregaron a `EXCLUDED_FIELDS` para evitar que aparezcan como diferencias de perfil del usuario.
- **Base de Datos (Backfill Retroactivo):**
  - Se ejecutó una migración de datos para backfillear en las validaciones existentes previamente aprobadas y rechazadas el registro de auditoría (`approved_by: 'Admin Principal (Raúl)'`).

### Corrección del Error de Esquema PostgREST (rejection_reason en validations)
- **components/dashboard/user-profile.tsx:**
  - Se eliminaron las claves `rejection_reason: null` y `updated_at` de primer nivel en la consulta `.update()` sobre la tabla `validations`, ya que no existen como columnas en la tabla física de Supabase y provocaban el error: *"Could not find the 'rejection_reason' column of 'validations' in the schema cache"*.
  - El motivo de rechazo (`rejection_reason: null`) se mantiene correctamente gestionado dentro del objeto JSONB `details`, alineado con la arquitectura del resto de la plataforma.
- **components/dashboard/admin-validations.tsx:**
  - Se removió `rejection_reason: reason` a nivel de raíz en las operaciones de rechazo de modificación de jugador, conservándolo únicamente dentro de `details` JSONB.
- **supabase_production_schema.sql:**
  - Se documentó la columna opcional `rejection_reason` mediante `ALTER TABLE public.validations ADD COLUMN IF NOT EXISTS rejection_reason text;` para garantizar retrocompatibilidad si se llegase a aplicar la migración en la base de datos en el futuro.

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

### Corrección de Flujo de Aprobación de Alta de Jugador y Persistencia de Avatar
- **components/forms/alta-jugador-form.tsx:**
  - Corregido el valor inicial de `urlFoto` que colocaba una URL fija a `placehold.co`, sobreescribiendo el avatar previo del usuario en `profiles.avatar_url` y `validations.details.avatar_url`.
  - Ahora preserva el avatar real del usuario y sólo actualiza la URL si se sube y comprime con éxito un nuevo archivo al bucket `avatars`.
  - Se vincula siempre `user_id: user?.id` dentro del objeto `details` de la solicitud.
- **components/dashboard/admin-validations.tsx:**
  - Implementada resolución robusta del `targetUserId`: si no viene en `details.user_id`, busca por `submitted_by` (UUID), `email` en `profiles`, `nickname` o `name`. Ya no utiliza el ID de la fila de `validations` para actualizar `profiles`.
  - Al aprobar un alta de jugador (`isApproved === true`):
    - Persiste `is_player: true`, `player_status: 'active'`, `closest_airport`.
    - Sincroniza `avatar_url` y `avatar` con la foto subida en la postulación.
    - Sincroniza `nickname`, `name`, `discord_handle`, redes sociales y registro en `player_game_info` (`game_id`, `server`, `game_nickname`).
    - Actualiza el estado en `validations` a `active` vinculando el `user_id`.
  - En `handleSaveDetails`: corregido el bug que intentaba actualizar `profiles` usando el ID de la tabla `validations`.
- **lib/utils.ts:**
  - Creada la función `extractAvatarFromDetails(details)` que resuelve universalmente la URL de la foto de un jugador desde cualquier clave en `details` (`avatar_url`, `urlFoto`, `item_meta[687]`, `photo`, `foto`, etc.), arrays de archivos y referencias al bucket de avatars, filtrando placeholders y documentos.
- **components/dashboard/admin-validations.tsx:**
  - Corregido el bug en `handleSaveDetails` donde `editingDetails.player_status` (que contenía `'pending'` del envío original del formulario) revertía solicitudes ya aprobadas de vuelta a estado pendiente. Ahora se protege estrictamente el estado activo/aprobado.
  - Al aprobar, ahora se usa `extractAvatarFromDetails` para capturar cualquier variación del campo de imagen y persistirla directamente en `profiles.avatar_url` y `profiles.avatar`.
- **components/forms/alta-jugador-form.tsx:**
  - En `init()`, ahora comprueba tanto `profiles` como `validations`. Si el usuario ya fue aprobado, previene que se vuelva a abrir o enviar el formulario y auto-repara su perfil en `profiles`.
  - En `handleSubmit`, si la validación previa ya estaba aprobada (`active` / `approved`), jamás se degrada su estado a `'pending'`.
- **components/dashboard/admin-players.tsx:**
  - Integra `extractAvatarFromDetails` para mostrar la foto real del jugador aunque en `profiles` haya venido nula inicialmente, y auto-repara la base de datos en segundo plano.
- **components/dashboard/user-profile.tsx:**
  - Utiliza `extractAvatarFromDetails` para auto-recuperar y renderizar la foto del jugador directamente desde su validación si `profiles` carecía de avatar.

### Corrección del Reenvío de Modificación de Perfil de Jugador y Visibilidad en Validaciones Admin
- **components/dashboard/user-profile.tsx:**
  - **Banner de Rechazo:** Se corrigió el botón `EDITAR Y REENVIAR` para que los jugadores aprobados (`isPlayerApproved || isPlayer`) abran el modal de edición de jugador profesional (`openEditPlayer`) en vez del modal de perfil personal (`openEdit`). Anteriormente, abría el perfil básico cuyo guardado (`handleSave`) no generaba ni actualizaba ninguna validación.
  - **Botones de Edición:** El botón `EDITAR PERFIL` en la cabecera y el botón de cámara sobre el avatar ahora abren inteligentemente `openEditPlayer` cuando el usuario es jugador verificado.
  - **handleSavePlayer:** 
    - Eliminado el intento de `.delete()` en la tabla `validations` (bloqueado por RLS).
    - Ahora busca la validación previa de tipo `modificacion` del usuario y la actualiza a `status: 'pending'`, limpiando `rejection_reason: null`, o inserta una nueva si no existía.
    - Sincroniza al instante el estado reactivo local (`userValidations`, `latestValidation`, `profileData.edit_requested = true`), removiendo el banner rojo de rechazo y mostrando de inmediato el estado pendiente en revisión.
  - **openEditPlayer:** Ahora recupera los datos previos ingresados tanto de `modVal?.details` como de `latestValidation?.details` cuando la solicitud fue rechazada o está pendiente.
- **components/dashboard/admin-validations.tsx:**
  - La pestaña `Jugadores` (`activeTab === 'jugador'`) ahora incluye tanto solicitudes de alta (`type: 'jugador'`) como solicitudes de modificación (`type: 'modificacion'`).
  - Al rechazar una modificación de jugador, se persiste `rejection_reason: reason` tanto en la columna de primer nivel como dentro del objeto `details`.

### Preservación y Restauración de Imagen Antigua en Rechazo o Modificación Pendiente
- **components/dashboard/admin-validations.tsx:**
  - Al rechazar una modificación de jugador, el administrador ahora restaura automáticamente en la tabla `profiles` el `avatar_url` y `avatar` a la foto antigua original (`details.original_avatar` o foto de la postulación aprobada).
- **components/dashboard/user-profile.tsx:**
  - En `loadAllUserData`, si existe una modificación rechazada (`status: 'rejected'`) o pendiente (`status: 'pending'`), el sistema garantiza que en el perfil y en la tarjeta se muestre la **imagen antigua** legítima, y si `profiles` contenía la imagen propuesta no aprobada, la auto-repara restaurando el avatar original en la base de datos.
  - En `handleSavePlayer`, se garantiza que `original_avatar` guarde siempre la foto original aprobada y nunca se contamine con la nueva foto enviada.
  - En `handleSave`, se protegió el `avatar_url` de jugadores aprobados para que la edición básica de perfil no pueda saltarse la validación administrativa.

### Visualización del Nickname del Jugador en Tarjetas Administrativas
- **components/dashboard/admin-players.tsx:**
  - Se agregó la propiedad `nickname` a la interfaz `Player`.
  - En la carga de jugadores, se resuelve el apodo/IGN priorizando `profiles.nickname`, `player_game_info.game_nickname`, metadatos de postulación (`ign`, `item_meta[674]`) o el nombre del perfil.
  - En las tarjetas de la pestaña **Jugadores** de administración (`/administracion`), se reemplazó el nombre real (`player.name`) por el **nickname del jugador** (`player.nickname || player.name`), tanto en el título principal de la tarjeta como en los modales de detalle y acciones.

### Redes Sociales Oficiales para Casters (Twitch, Instagram, Twitter/X, Facebook, TikTok, Kick, YouTube)
- **supabase_casters_socials.sql & supabase_production_schema.sql:**
  - Agregadas las columnas a la tabla `public.casters`: `social_fb`, `social_tiktok`, `social_kick`, `social_yt` con scripts de migración idempotentes (`ADD COLUMN IF NOT EXISTS`).
- **components/dashboard/admin-casters.tsx:**
  - Configuración estricta de las 7 plataformas en el orden solicitado:
    1. Twitch (`social_twitch`)
    2. Instagram (`social_ig`)
    3. Twitter / X (`social_x`)
    4. Facebook (`social_fb`)
    5. TikTok (`social_tiktok`)
    6. Kick (`social_kick`)
    7. YouTube (`social_yt`)
  - Inputs ordenados y estilizados en el modal de creación y edición de casters.
  - Renderizado de badges vectoriales dinámicos con hover de color de marca para cada red en las tarjetas del panel de administración.
  - Mecanismo de guardado resiliente con fallback ante bases de datos sin migrar (captura código `42703`).
- **components/sections/casters.tsx:**
  - Actualizada la vista pública en la sección de casters:
  - Renderizado de iconos en el orden exacto especificado con microinteracciones de escala y colores distintivos al pasar el mouse por la tarjeta.
  - Soporte completo para las 7 plataformas en desktop, tablet y móvil.

### Preservación de Imagen Previa en Panel de Administración (Cambios No Aprobados)
- **components/dashboard/admin-players.tsx:**
  - Se implementó la verificación exhaustiva de solicitudes de modificación para cada jugador (`type: 'modificacion'`).
  - Si una modificación está **pendiente** (`status: 'pending'`) o fue **rechazada** (`status: 'rejected'`), el sistema **rechaza terminantemente mostrar la imagen cambiada propuesta** y garantiza que se muestre la **imagen anterior legítima** (`original_avatar` o foto de la postulación aprobada).
  - Auto-reparación en segundo plano: si `profiles.avatar_url` contenía la imagen propuesta no aprobada, se restaura automáticamente en la base de datos a la foto previa oficial.
  - Se garantiza que `rawDetails.avatar_url`, la tarjeta del jugador y el modal de detalles y edición muestren siempre la imagen previa legítima hasta que un administrador apruebe expresamente el cambio.
  - Se perfeccionó la resolución del apodo gaming para priorizar el nickname real cuando difiere del nombre completo.
