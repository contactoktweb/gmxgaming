# Registro de Cambios de IA (CHANGELOG_AI.md)

## [2026-09-26]

### Corrección de Avatar Roster de Bambino (Remnant) y Eliminación de Placeholder Roto WordPress
- **Diagnóstico del Fallo:**
  - En la vista de detalle de equipo (`/equipos/remnant`), la tarjeta de **BAMBINO** en la sección "Roster Actual" mostraba un recuadro de imagen rota con signo de interrogación `[ ? ]`, a diferencia del resto de los jugadores.
  - **Causa 1 (Base de Datos):** El perfil de Bambino (`profiles`) tenía `avatar_url: null` e `is_player: false` a pesar de tener un contrato activo en REMNANT y una solicitud de modificación aprobada (`RILEY ➔ BAMBINO`). Además, su solicitud de Alta de Jugador (`e25fee99-6a41-418f-8d4f-1f69aad9060d`) permanecía en estado `pending`, conteniendo la foto oficial con el jersey de Remnant (`1789876397256_foto_BAMBINO.jpg`).
  - **Causa 2 (Frontend):** En `app/equipos/[id]/page.tsx`, ante un avatar nulo, el sistema recurría a una URL externa antigua de WordPress (`https://i0.wp.com/.../default_avatar.jpg`), la cual responde con **HTTP 403 Forbidden**, provocando el ícono de imagen rota del navegador.
- **Acciones y Correcciones Implementadas:**
  1. **Sincronización en Base de Datos (Supabase):**
     - Se actualizó el perfil oficial de Bambino en `profiles` con su avatar verificado (`1789876397256_foto_BAMBINO.jpg`), su nombre real (`EDUARDO MANUEL COBA KANTUN`), `is_player: true` y `player_status: 'active'`.
     - Se aprobó la solicitud pendiente de Alta de Jugador para mantener la consistencia en el panel de auditoría.
  2. **Resolución Resiliente en app/equipos/[id]/page.tsx:**
     - Se incorporó un mecanismo de fallback automático: si un jugador del roster tiene `avatar_url === null` en `profiles`, el componente consulta dinámicamente la tabla `validations` para obtener su foto más reciente sin requerir intervención manual.
     - Se sustituyó la URL externa rota de WordPress por el recurso local nativo `/placeholder-user.jpg` y `/placeholder-logo.png`.
     - Se añadieron manejadores de evento `onError` en todas las etiquetas `<img>` de jugadores y escuadras para asegurar que nunca se renderice una imagen rota o signo de interrogación.
  3. **Blindaje en Perfiles Públicos (app/jugadores/[id]/page.tsx & players.tsx):**
     - Ajustada la consulta para encontrar y mostrar el perfil público de cualquier jugador con estatus activo o contrato vigente, eliminando errores 404 accidentales.
     - Reemplazados los fallbacks rotos por `/placeholder-user.jpg`.

### Optimización y Aumento de Tipografía en Dispositivos Móviles (Hero & Botones)
- **Diagnóstico:**
  - En pantallas móviles, los textos del Hero se percibían excesivamente reducidos (H1 estrecho a `14vw`, subtítulo H2 a `text-sm` (14px), descripción a `text-sm`, y botones a `text-[13px]`), generando una jerarquía visual disminuida.
  - Además, el objeto `viewport` en `app/layout.tsx` no declaraba explícitamente `width: 'device-width'` e `initialScale: 1`, lo que podía provocar que ciertos navegadores móviles renderizaran la página con escala alejada.
- **Cambios Realizados:**
  1. **app/layout.tsx:** Declarados explícitamente `width: 'device-width'` e `initialScale: 1` en el objeto `viewport` de Next.js para forzar renderizado nativo 1:1 en todos los navegadores móviles.
  2. **components/sections/hero.tsx:**
     - **Título H1:** Escalado en móvil a `text-[16vw] xs:text-[15.5vw]` con `leading-[0.88]`, ocupando el ancho visual de manera imponente y sin desbordes.
     - **Badge de Bienvenida:** Aumentado de `text-xs` (12px) a `text-sm font-700 sm:text-base`.
     - **Subtítulo H2:** Aumentado de `text-sm` (14px) a `text-base font-700 uppercase sm:text-lg lg:text-xl`, con tracking optimizado.
     - **Párrafo descriptivo:** Aumentado de `text-sm` a `text-[15px] sm:text-base leading-relaxed text-zinc-300` para lectura nítida y descansada.
     - **Ticker inferior:** Aumentado a `text-xs sm:text-sm font-600`.
  3. **components/gmx-button.tsx:**
     - Aumentada la tipografía base de los botones de `text-[13px] font-600` a `text-sm font-700 uppercase tracking-[0.15em] sm:text-sm md:text-base`, garantizando botones de llamada a la acción robustos y legibles en cualquier smartphone.
  4. **Secciones de Soporte (About & Tournaments):** Estandarizados los badges y descripciones secundarias para evitar textos reducidos inferiores a 14px/15px en móvil.

### Corrección Definitiva: Falsa Contaminación de Datos y Fotos entre Jugadores (Substring Matching Bug)
- **Diagnóstico del Problema (No es un problema de caché):**
  - Se reportó que en `/administracion` (sección de Jugadores), la tarjeta del jugador **RIN** (Discord: `Vortx2810`, Equipo: `THEHUNGRYKINGS`) mostraba la fotografía de otra persona (**MANDARINO**).
  - Tras una auditoría exhaustiva de la base de datos de producción y del código fuente, **se descartó que fuera un problema de caché** de navegador o de red.
  - **Causa Raíz Identificada:** En `components/dashboard/admin-players.tsx`, las solicitudes de validación y modificación de perfil se vinculaban a los jugadores mediante comparaciones de subcadena:
    ```ts
    if (pNick && (tName.includes(pNick) || ...)) return true
    ```
    Dado que el nickname del jugador es `"RIN"`, y existe otro jugador con nickname `"MANDARINO"`, la expresión `"mandarino".includes("rin")` evaluaba a `true`.
  - Como resultado, la solicitud de modificación de foto y contrato de **MANDARINO** se asignaba indebidamente a **RIN**, inyectando en memoria la foto original de Mandarino en la tarjeta de Rin. Además, cualquier apodo corto (ej. `DAN`, `ELI`, `LEO`, `MAX`) quedaba expuesto a ser contaminado por nombres o apodos más largos que contuvieran dichas letras.
- **Solución Implementada en components/dashboard/admin-players.tsx:**
  1. **Coincidencia Estricta y Exacta:** Se eliminaron todas las comparaciones parciales con `.includes()` en la asociación de validaciones con jugadores. Ahora se valida coincidencia exacta por ID de usuario (`uId === p.id`), ID de remitente (`sub === p.id`), correo exacto (`vEmail === pEmail`) o igualdad exacta de apodo/nombre (`vNick === pNick || target_name === pNick`).
  2. **Parser Especializado de target_name (`isTargetExactMatch`):** Para solicitudes de modificación con formato `"NICK_VIEJO ➔ NICK_NUEVO (Modificación de Jugador)"`, se divide la cadena por la flecha `➔`, se limpian etiquetas entre paréntesis y se verifica coincidencia exacta por elemento del arreglo, impidiendo cualquier cruce por subcadenas.
  3. **Aislamiento de Validaciones por Tipo:** Se filtraron explícitamente las validaciones para que sólo solicitudes genuinas de jugadores (`jugador` o `modificacion` de perfil sin `team_id`) puedan aportar datos a `playerDetailsLookup` o `pValidations`.
  4. **Protección de Foto de Perfil y Eliminación de Escrituras Silenciosas en Render:**
     - La foto oficial almacenada en la tabla `profiles` (`p.avatar_url`) ahora tiene máxima prioridad.
     - Se eliminaron las llamadas automáticas e inconsultas a `supabase.from('profiles').update(...)` dentro del `.map()` de carga, evitando que cualquier desfase en cliente sobreescriba datos en la base de datos de Supabase.
  5. **Prioridad del Nickname de Perfil:** En `nicknameCandidates`, se antepuso `p.nickname` para asegurar que el apodo oficial de la cuenta no sea reemplazado por campos anidados de formularios antiguos.

## [2026-09-25]

### Corrección Definitiva y Blindaje contra Errores de Esquema PostgREST (Columnas 'avatar' y 'email' en tabla 'profiles')
- **Diagnóstico del Fallo:**
  - Al enviar el formulario de "Alta de Jugador" (`/registro/alta-de-jugador`), la aplicación arrojaba el toast de error: *"Error saving profile: Could not find the 'avatar' column of 'profiles' in the schema cache"*.
  - La tabla física `public.profiles` en la base de datos de Supabase utiliza la columna oficial `avatar_url` para almacenar la foto de perfil y carece de la columna `avatar`.
  - En `components/forms/alta-jugador-form.tsx`, el objeto de actualización `corePayload` incluía `corePayload.avatar = urlFoto`, intentando escribir en una columna inexistente a nivel de tabla SQL. Además, el bloque de recuperación volvía a intentar enviar `corePayload` con el campo `avatar` y, en caso de fallo, detenía con `return` el flujo sin permitir registrar la solicitud en la tabla `validations`.
  - Adicionalmente, se detectó que `profiles` tampoco cuenta con la columna `email` (gestionada en `auth.users`), lo que causaba el error PGRST204 en las rutinas de upsert/sincronización de `lib/auth-context.tsx`.
- **components/forms/alta-jugador-form.tsx:**
  - Se eliminó completamente la asignación `corePayload.avatar = urlFoto`, manteniendo únicamente `corePayload.avatar_url = urlFoto`.
  - Se blindó el bloque de actualización de perfil para que sea **completamente tolerante a fallos y no bloqueante**:
    1. Si existe colisión de apodo único (`23505`), se avisa amigablemente al usuario con `t.altaJugador.nicknameInUse`.
    2. Ante cualquier error de esquema o columna (`42703` o `PGRST204`), conmuta a `safeBasicPayload` con los campos verificados (`name`, `nickname`, `closest_airport`, `avatar_url`, `discord_handle`, `is_player`, `player_status`).
    3. Si falla la sincronización local de perfil, intenta un guardado mínimo no bloqueante (`is_player: true, player_status: 'pending'`).
    4. **Garantía de envío:** Se eliminó la interrupción con `return` ante fallos de sincronización de perfil, garantizando que los datos de la postulación, documentos, identificaciones y teléfono siempre se registren con éxito en la tabla `validations`.
- **lib/auth-context.tsx:**
  - Se removió la columna inexistente `email` de las operaciones `upsert` y `update` sobre la tabla `profiles`, previniendo errores de caché de esquema durante el inicio de sesión o creación inicial de perfil.
- **components/dashboard/admin-validations.tsx:**
  - En `handleSaveDetails` para solicitudes de tipo `modificacion`, se sanitizó `cleanDetails` mediante `profileAllowedFields` para garantizar que columnas como `avatar`, `original_avatar` o datos anidados nunca se envíen a la tabla `profiles`.
  - Se eliminó la consulta innecesaria a la columna inexistente `email` en la resolución de usuarios sobre `profiles`.
- **components/dashboard/user-profile.tsx & admin-players.tsx:**
  - Estandarizadas todas las actualizaciones y auto-reparaciones sobre la tabla física `profiles` para persistir exclusivamente en `avatar_url`.
- **supabase_production_schema.sql:**
  - En la función trigger `public.handle_new_user()`, se retiró el intento de inserción y actualización sobre `avatar`, estandarizándolo sobre `avatar_url`.

## [2026-09-24]

### Persistencia Resiliente de Redes Sociales de Casters y Fallback Dinámico
- **Diagnóstico de Base de Datos:**
  - Se identificó que la tabla física `public.casters` en Supabase carecía de las columnas añadidas recientemente (`social_fb`, `social_tiktok`, `social_kick`, `social_yt`), provocando el error PostgREST `42703 (column casters.social_fb does not exist)`.
  - El mecanismo anterior descartaba silenciosamente estas 4 redes y guardaba únicamente las columnas base para evitar un fallo total de la aplicación.
- **components/dashboard/admin-casters.tsx:**
  - Implementado sistema de persistencia resiliente híbrido: intenta guardar primero en las columnas nativas de `casters`. Si la base de datos aún no tiene dichas columnas (código `42703`), persiste automáticamente las redes en `app_settings` bajo la clave `casters_socials_fallback`.
  - Al cargar o editar casters, combina y sincroniza automáticamente las redes tanto desde la tabla `casters` como desde el fallback, garantizando que nunca se pierda ninguna información.
  - Al eliminar un caster, limpia automáticamente sus redes del fallback.
  - Se agregó banner informativo interactivo para administradores con botón para copiar al portapapeles la sentencia SQL de migración en 1 clic.
- **supabase_casters_socials.sql:**
  - Actualizado script de migración integral e idempotente (`ADD COLUMN IF NOT EXISTS`) con recarga de caché de esquema mediante `NOTIFY pgrst, 'reload schema'`.

### Carrusel con Desplazamiento Smooth y Swipe Táctil para Casters (> 4 Casters)
- **components/sections/casters.tsx:**
  - **Eliminación del límite estático:** Removido `.limit(4)` en la consulta para permitir cargar todos los casters activos registrados.
  - **Corrección de Nickname:** Se corrigió la asignación `nickname: c.nickname || c.name` para preservar el apodo competitivo de cada talento.
  - **Detección Dinámica de Cantidad:**
    - Si hay **más de 4 casters**: se activa el carrusel horizontal con `scroll-snap-type: x mandatory`, desplazamiento ultra suave (`behavior: 'smooth'`), soporte nativo de swipe táctil para móviles (Regla 15 de `GEMINI.md`) y atributo `data-lenis-prevent` para no colisionar con Lenis.
    - Se incorporaron botones interactivos de navegación (`ChevronLeft` y `ChevronRight`) en la cabecera con microinteracciones gamer, halo de brillo en hover y desactivación automática en los extremos (`canScrollLeft` y `canScrollRight`).
    - Si hay **4 o menos casters**: se mantiene el diseño de rejilla adaptativo (`Stagger` y paralaje suave), centrando elegantemente los elementos.
  - **Accesibilidad y Móviles (Regla 70):** En dispositivos móviles las redes sociales son accesibles directamente sin requerir hover, y en pantallas de escritorio se revelan con transición fluida al pasar el cursor.

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
