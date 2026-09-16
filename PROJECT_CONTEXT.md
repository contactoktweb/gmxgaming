# 🎮 GMX GAMING — MEMORIA PERMANENTE DEL PROYECTO (PROJECT_CONTEXT.md)

Este documento centraliza toda la información técnica, arquitectónica, funcional y de diseño del proyecto **GMX Gaming**. Sirve como memoria permanente y fuente única de verdad para el equipo de desarrollo y los asistentes de IA.

---

## 📌 1. Nombre y Propósito del Proyecto

- **Nombre:** GMX Gaming Website & eSports Management Platform
- **Propósito:** Plataforma web oficial y ecosistema competitivo integral para la organización de eSports **GMX Gaming**. Centraliza la gestión de torneos, ligas oficiales, perfiles de jugadores profesionales, afiliación de equipos, tramitación de contratos con validación por división (Varonil/Mixto y Femenil), panel de administración con control de acceso por roles y contenidos multimedia (casters, transmisiones y patrocinadores).

---

## 💻 2. Stack Tecnológico

| Capa / Área | Tecnología | Propósito |
|---|---|---|
| **Framework Web** | [Next.js](https://nextjs.org/) (App Router, Turbopack) | Arquitectura moderna SSR/SSG/Client, enrutamiento y API. |
| **Biblioteca UI** | [React](https://react.dev/) | Renderizado reactivo y modular de componentes. |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org/) | Tipado estricto y seguridad en tiempo de compilación. |
| **Estilos & CSS** | [Tailwind CSS v4](https://tailwindcss.com/) & Vanilla CSS | Tokens de diseño, gradientes, animaciones y clases utilitarias. |
| **Animaciones** | [Motion (Framer Motion)](https://motion.dev/) & CSS Keyframes | Microinteracciones, scroll reveals, transiciones de vista y stagger. |
| **Smooth Scroll** | [Lenis](https://lenis.darkroom.engineering/) | Desplazamiento ultra suave en toda la navegación. |
| **Iconografía** | [Lucide React](https://lucide.dev/) | Iconos vectoriales consistentes. |
| **Notificaciones** | [Sonner](https://sonner.emilkowal.ski/) | Toasts interactivos y accesibles. |
| **Backend / DB** | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage) | Base de datos relacional, autenticación OAuth/Email, almacenamiento y RLS. |
| **Analítica** | [@vercel/analytics](https://vercel.com/analytics) | Métricas de rendimiento y visitantes en producción. |

---

## 🏷️ 3. Versiones Importantes

- **Next.js:** `16.2.6` (Turbopack)
- **React / React-DOM:** `^19.0.0`
- **TypeScript:** `5.7.3`
- **Tailwind CSS:** `^4.2.0`
- **Motion:** `^12.42.2`
- **@supabase/supabase-js:** `^2.111.0`
- **@supabase/ssr:** `^0.12.4`
- **Lenis:** `^1.3.25`
- **Node.js Target:** `>= 18.x / 20.x`

---

## 📁 4. Arquitectura de Carpetas

```plaintext
gmx-gaming-website/
├── app/                                 # Next.js App Router (Rutas y Páginas)
│   ├── administracion/                  # Panel Administrativo Maestro
│   ├── auth/                            # Callbacks y confirmaciones de autenticación
│   │   ├── callback/                    # OAuth Callback handler
│   │   └── confirm/                     # Email verification / recovery handler
│   ├── cookies/                         # Política de Cookies (Legal)
│   ├── crear-cuenta/                    # Registro de nuevos usuarios
│   ├── equipos/                         # Directorio de Equipos Afiliados
│   │   └── [id]/                        # Vista de detalle de equipo (Roster, Partidos)
│   ├── jugadores/                       # Perfiles Públicos de Jugadores
│   │   └── [id]/                        # Detalle público del Jugador (Stats, Equipo)
│   ├── login/                           # Inicio de Sesión
│   │   └── olvide-password/             # Recuperación de contraseña
│   ├── micuenta/                        # Dashboard del Usuario / Jugador / Manager
│   ├── privacidad/                      # Aviso de Privacidad (Legal)
│   ├── registro/                        # Formularios de Alta eSports
│   │   ├── alta-de-contrato/            # Registro de Contrato Jugador-Equipo
│   │   ├── alta-de-equipo/              # Registro de Escuadras Oficiales
│   │   └── alta-de-jugador/             # Registro de Jugadores Profesionales
│   ├── terminos/                        # Términos y Condiciones (Legal)
│   ├── torneos/                         # Hub de Torneos y Ligas
│   │   └── [id]/                        # Detalle de Torneo (Brackets, Equipos, Reglas)
│   ├── globals.css                      # Estilos globales, variables CSS y Tailwind v4
│   ├── layout.tsx                       # Layout Raíz (LanguageProvider, AuthProvider)
│   └── page.tsx                         # Landing Page Principal
├── components/                          # Componentes React Modulares
│   ├── dashboard/                       # Vistas de Mi Cuenta y Administración
│   │   ├── admin-casters.tsx            # Gestión de casters oficiales
│   │   ├── admin-media.tsx              # Gestión de videos, highlights y directos
│   │   ├── admin-pagination.tsx         # Paginación estándar de tablas admin
│   │   ├── admin-players.tsx            # Auditoría y validación de jugadores
│   │   ├── admin-roles.tsx              # Asignación de roles y permisos de staff
│   │   ├── admin-settings.tsx           # Configuración de países, juegos y plataforma
│   │   ├── admin-sponsors.tsx           # Gestión de patrocinadores
│   │   ├── admin-teams.tsx              # Gestión y auditoría de equipos
│   │   ├── admin-tournaments.tsx        # Creación y gestión de torneos / brackets
│   │   ├── admin-validations.tsx        # Bandeja de entrada de solicitudes (Validations)
│   │   ├── contact-directory.tsx        # Directorio de contactos oficiales
│   │   ├── edit-team-modal.tsx          # Modal de edición de equipo para managers
│   │   ├── manager-dashboard.tsx        # Resumen y estadísticas para managers
│   │   ├── manager-players.tsx          # Gestión de roster por el manager
│   │   ├── player-contracts.tsx         # Historial y gestión de contratos de jugador
│   │   ├── player-teams.tsx             # Panel de escuadras activas y bajas
│   │   └── user-profile.tsx             # Edición de perfil, juego e identidad
│   ├── forms/                           # Formularios públicos con validaciones
│   │   ├── alta-contrato-form.tsx       # Formulario de alta de contrato
│   │   ├── alta-equipo-form.tsx         # Formulario de alta de equipo
│   │   ├── alta-jugador-form.tsx        # Formulario de alta de jugador
│   │   ├── forgot-password-form.tsx     # Formulario de recuperación de contraseña
│   │   ├── login-form.tsx               # Formulario de inicio de sesión
│   │   └── register-form.tsx            # Formulario de registro de cuenta
│   ├── sections/                        # Secciones modulares de la Landing Page
│   │   ├── about.tsx                    # Sección Acerca de GMX Gaming
│   │   ├── casters.tsx                  # Showcase de Casters oficiales
│   │   ├── cinematic.tsx                # Banner cinemático con vídeo/estética eSports
│   │   ├── cta-primary.tsx              # Llamado a la acción principal
│   │   ├── featured-players.tsx         # Jugadores destacados
│   │   ├── hero.tsx                     # Hero header principal con interactividad
│   │   ├── media.tsx                    # Sección multimedia y GMX TV
│   │   ├── newsletter.tsx               # Suscripción al boletín
│   │   ├── site-footer.tsx              # Footer con branding obligatorio K&T y año dinámico
│   │   ├── sponsors.tsx                 # Patrocinadores y marcas aliadas
│   │   ├── teams.tsx                    # Escuadras destacadas
│   │   ├── tournaments.tsx              # Torneos activos y próximos
│   │   ├── video.tsx                    # Reproductor cinemático de presentación
│   │   └── what-you-get.tsx             # Beneficios del ecosistema competitivo
│   ├── anim.tsx                         # Helpers de animación (Stagger, FadeIn, ScaleIn)
│   ├── back-to-top.tsx                  # Botón flotante para volver arriba
│   ├── custom-cursor.tsx                # Cursor interactivo gamer
│   ├── global-search.tsx                # Modal de búsqueda global interactiva (Cmd+K)
│   ├── gmx-button.tsx                   # Botón estilizado reutilizable
│   ├── gmx-logo.tsx                     # Isotipo y logotipo oficial SVG
│   ├── preloader.tsx                    # Animación de carga inicial con logo
│   ├── site-header.tsx                  # Barra de navegación principal y menús
│   ├── smooth-scroll.tsx                # Proveedor de scroll suave (Lenis)
│   └── split-text.tsx                   # Animación de texto por caracteres/líneas
├── hooks/                               # Hooks personalizados de React
│   └── use-debounce.ts                  # Debounce para búsquedas y validaciones en tiempo real
├── lib/                                 # Utilidades, Contextos y Lógica de Negocio
│   ├── i18n/
│   │   └── translations.ts              # Diccionarios exhaustivos Español (es) e Inglés (en)
│   ├── auth-context.tsx                 # Contexto global de sesión y autenticación
│   ├── language-context.tsx             # Contexto de internacionalización bilingüe
│   ├── site-data.ts                     # Constantes de configuración, enlaces y redes
│   └── utils.ts                         # Helpers de formato, slugs, errores de auth y clases
├── utils/                               # Utilidades de infraestructura y clientes
│   └── supabase/
│       ├── client.ts                    # Cliente Supabase para el navegador (CSR)
│       ├── server.ts                    # Cliente Supabase para Server Components / Actions
│       └── middleware.ts                # Sincronización de cookies de sesión
├── middleware.ts                        # Middleware de rutas protegidas (/administracion, /micuenta)
├── package.json                         # Dependencias y scripts de construcción
├── supabase_production_schema.sql       # Esquema maestro DDL de base de datos para producción
└── PROJECT_CONTEXT.md                   # Memoria permanente del proyecto
```

---

## 🧩 5. Componentes Principales

### 5.1 Estructura Global y Shell
- **`SiteHeader` (`components/site-header.tsx`):** Barra superior de navegación con soporte responsive, selector de idioma (ES/EN), búsqueda global, enlaces de registro eSports y acceso al perfil.
- **`SiteFooter` (`components/sections/site-footer.tsx`):** Pie de página con enlaces institucionales, selector de idioma, año dinámico (`new Date().getFullYear()`) y firma obligatoria: **"Desarrollado por K&T ❤️"** enlazada estrictamente a `https://www.kytcode.lat`.
- **`GlobalSearch` (`components/global-search.tsx`):** Buscador flotante accesible con teclado (`Cmd+K` / `Ctrl+K`) que consulta en tiempo real jugadores, equipos y torneos en Supabase.
- **`Preloader`, `CustomCursor`, `SmoothScroll`:** Microinteracciones que garantizan una experiencia visual gamer de alta gama.

### 5.2 Zona de Usuario ("Mi Cuenta")
- **`UserProfile` (`components/dashboard/user-profile.tsx`):** Edición de foto de perfil, datos de Mobile Legends (Game ID, Server, IGN, País), biografía eSports, vinculación de redes sociales y solicitud de verificación.
- **`PlayerTeams` (`components/dashboard/player-teams.tsx`):** Visualización de escuadras activas (División Mixta y División Femenil), contratos vigentes, solicitudes de rescisión/baja mutua e historial deportivo.
- **`PlayerContracts` (`components/dashboard/player-contracts.tsx`):** Registro de contratos pasados y activos con fechas de inicio, vigencia y motivos de conclusión.
- **`ManagerPlayers` & `ManagerDashboard`:** Tablero exclusivo para managers que permite gestionar el roster del equipo, aceptar solicitudes de ingreso de jugadores y tramitar bajas.
- **`EditTeamModal` (`components/dashboard/edit-team-modal.tsx`):** Formulario modal para que los managers actualicen logos, jerseys, redes sociales y categoría (con validación de plantilla varonil).
- **`ContactDirectory` (`components/dashboard/contact-directory.tsx`):** Directorio oficial con enlaces directos de Discord a los encargados de ligas, casters y directiva.

### 5.3 Zona Administrativa (`/administracion`)
- **`AdminTournaments`:** Creación, edición, gestión de inscripciones y configuración de brackets para torneos.
- **`AdminValidations`:** Bandeja de entrada para aprobar o rechazar solicitudes de alta de jugadores, equipos, modificaciones de datos y contratos.
- **`AdminPlayers` & `AdminTeams`:** Gestión y auditoría directa de jugadores y escuadras registradas.
- **`AdminRoles`:** Asignación granular de roles (`admin_principal`, `admin_secundario`, `admin_visitante`).
- **`AdminSettings`, `AdminCasters`, `AdminMedia`, `AdminSponsors`:** Configuración de países habilitados, juegos competitivos, casters, contenido de GMX TV y patrocinadores.

---

## 🌐 6. Páginas Existentes y Rutas

| Ruta | Tipo | Propósito / Descripción |
|---|---|---|
| `/` | Estática (SSG) | Landing Page principal con todas las secciones de la organización. |
| `/torneos` | Estática (SSG) | Listado y catálogo de torneos en curso, próximos y pasados. |
| `/torneos/[id]` | Dinámica (SSR) | Detalle de un torneo: información, premios, reglas, equipos inscritos y brackets. |
| `/equipos` | Estática (SSG) | Catálogo de organizaciones y escuadras profesionales afiliadas. |
| `/equipos/[id]` | Dinámica (SSR) | Perfil del equipo: roster activo, redes sociales, historial de partidos y manager. |
| `/jugadores/[id]` | Dinámica (SSR) | Perfil público del jugador eSports: estadísticas, equipo actual y roles. |
| `/login` | Estática | Inicio de sesión mediante Correo/Contraseña o Google OAuth. |
| `/crear-cuenta` | Estática | Registro de nueva cuenta con confirmación de correo. |
| `/login/olvide-password` | Estática | Recuperación de clave por correo o código de 6 dígitos. |
| `/micuenta` | Estática (Auth) | Panel de control integral del usuario, jugador o manager. |
| `/administracion` | Estática (Admin) | Panel administrativo maestro para el staff de GMX Gaming. |
| `/registro/alta-de-jugador` | Estática | Formulario oficial para registrarse como Jugador Profesional. |
| `/registro/alta-de-equipo` | Estática | Formulario oficial para afiliar una organización/escuadra. |
| `/registro/alta-de-contrato` | Estática | Formulario para vincular un jugador a un equipo por división. |
| `/privacidad` | Estática | Aviso de Privacidad y tratamiento de datos. |
| `/terminos` | Estática | Términos y Condiciones de la plataforma y competencias. |
| `/cookies` | Estática | Política de Cookies de navegación. |

---

## ⚙️ 7. Funcionalidades Implementadas

1. **Internacionalización Bilingüe (ES / EN):**
   - La **zona de usuario (`/micuenta`, formularios de alta, landing page, torneos, perfiles y pie de página)** es completamente bilingüe mediante `useLanguage()` y diccionarios centralizados.
   - La **zona administrativa (`/administracion` y `components/dashboard/admin-*`)** se mantiene **exclusivamente en Español** por decisión operativa del staff.
2. **Autenticación y Sesiones:**
   - Inicio de sesión con Google OAuth y Email/Contraseña.
   - Flujo de recuperación de contraseña con sesión validada o código OTP.
   - Sincronización automática de perfiles mediante triggers en Supabase Auth.
3. **Control de Acceso Basado en Roles (RBAC):**
   - Roles definidos: `user`, `admin_principal`, `admin_secundario`, `admin_visitante`.
   - Protección de rutas vía middleware (`middleware.ts`).
4. **Sistema de Auditoría y Validaciones (`validations`):**
   - Todo cambio sensible (alta de jugador, alta de equipo, cambio de datos o contratos) genera una solicitud en la tabla `validations` que debe ser aprobada o rechazada por un administrador.
5. **Reglas de Contratos y Género:**
   - Un jugador puede tener como máximo **1 contrato activo en División Varonil/Mixta** y **1 contrato activo en División Femenil** simultáneamente.
   - Validación estricta que impide transformar un equipo a categoría **Femenil** si existen jugadores varoniles en su plantilla activa.
6. **Inscripción a Torneos con RLS:**
   - Los capitanes/managers pueden registrar a sus equipos en torneos abiertos, con control de cupos y verificación de estado.
7. **Búsqueda Global en Tiempo Real:**
   - Atajo `Cmd+K` / `Ctrl+K` para buscar cualquier entidad en la plataforma.
8. **Diseño Adaptativo & Gestos Touch:**
   - Soporte total para swipe horizontal en dispositivos móviles para todos los carruseles.
   - Año de copyright dinámico mediante `new Date().getFullYear()`.

---

## 🔗 8. Integraciones

- **Supabase Cloud:** Base de datos PostgreSQL, Auth, Storage y RLS.
- **Google Cloud Console (OAuth 2.0):** Proveedor de inicio de sesión social configurado con el branding oficial de GMX Gaming.
- **Discord API / Webhooks:** Canales de comunicación directa con coordinadores de torneo.
- **WhatsApp Webhook / Direct Links:** Contacto directo para postulaciones de casters y asistencia rápida.
- **Vercel Platform:** Despliegue continuo (CI/CD) y Analytics.

---

## 🗄️ 9. Base de Datos (Supabase Schema)

### 9.1 Tablas Principales

| Tabla | Propósito | Claves / Campos Relevantes |
|---|---|---|
| `profiles` | Usuarios, administradores, jugadores y managers | `id` (PK auth.users), `email`, `name`, `nickname` (UNIQUE), `role`, `is_player`, `player_status`, `avatar_url`, `social_*` |
| `player_game_info` | Cuentas de juego vinculadas | `id` (PK), `profile_id` (FK), `game`, `game_id`, `server`, `game_nickname`, `country_account` |
| `teams` | Equipos y organizaciones | `id` (PK), `manager_id` (FK), `name`, `tag`, `logo_url`, `jersey_url`, `gender_category`, `status`, `games` |
| `contracts` | Vinculación jugador-equipo | `id` (PK), `player_id` (FK), `team_id` (FK), `division`, `roles`, `status` (`active`, `pending_*`, `completed`, `cancelled`, `rejected`), `end_date` |
| `tournaments` | Torneos y ligas eSports | `id` (PK), `name`, `game`, `status` (`upcoming`, `ongoing`, `completed`), `prize_pool`, `max_teams`, `registered_teams`, `start_date` |
| `tournament_teams` | Equipos inscritos a torneos | `id` (PK), `tournament_id` (FK), `team_id` (FK), `status`, `seed`, `group_name` |
| `tournament_matches` | Calendario y resultados | `id` (PK), `tournament_id` (FK), `team1_id`, `team2_id`, `score1`, `score2`, `winner_id`, `scheduled_at`, `status` |
| `validations` | Bandeja de auditoría administrativa | `id` (PK), `type` (`jugador`, `equipo`, `modificacion`, `contrato`), `status`, `submitted_by`, `target_name`, `details` (JSONB), `rejection_reason` |
| `casters` | Casters y comentaristas oficiales | `id` (PK), `name`, `nickname`, `photo_url`, `bio`, `is_active`, `social_*` |
| `media_items` | Videos y directos de GMX TV | `id` (PK), `title`, `type`, `url`, `thumbnail_url`, `is_featured` |
| `sponsors` | Patrocinadores | `id` (PK), `name`, `logo_url`, `website_url`, `tier`, `is_active` |
| `app_settings` | Configuración dinámica de la app | `id` (PK), `value` (JSONB) (`enabled_countries`, `enabled_games`) |

### 9.2 Storage Buckets en Supabase
- `avatars`: Fotos de perfil de usuarios y fotos oficiales de jugadores.
- `teams`: Logos y jerseys de escuadras afiliadas.
- `documents`: Documentación legal, identificaciones y pasaportes para torneos internacionales (restringido a administradores).
- `media`: Miniaturas y recursos audiovisuales de GMX TV.
- `sponsors`: Logotipos oficiales de marcas aliadas.

---

## 🔐 10. Variables de Entorno Requeridas

Configurar en el archivo `.env.local` (local) y en las variables de entorno de Vercel (producción):

```env
# URL de la instancia de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

# Clave pública de Supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_publishable_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# URL del sitio para redirecciones OAuth y correos
# Local: http://localhost:3000
# Producción: https://gmxgaming.vercel.app o https://gmxgaming.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🎨 11. Sistema de Diseño Visual

- **Paleta de Colores:**
  - **Primary Crimson / Red:** `#E11D48` / `hsl(346, 84%, 50%)` — Color principal de marca, acentos y llamadas a la acción.
  - **Background Deep:** `#06080C` / `#0B0E14` — Fondo oscuro inmersivo gamer.
  - **Surface / Cards:** `#111620` / `#161C28` con bordes `#1F2937` y efectos glassmorphism.
  - **Text Colors:** Blanco puro (`#FFFFFF`) para títulos, `#94A3B8` para descripciones y `#64748B` para subtítulos tenues.
- **Tipografía:**
  - **Display / Headings:** `Orbitron` / `Outfit` (estilo display tecnológico y uppercase agresivo).
  - **Body / Interface:** `Inter` / sans-serif para máxima legibilidad.
- **Estética Visual:**
  - Dark mode premium con destellos sutiles (glows) y mallas degradadas en el fondo.
  - Efectos de hover reactivos con escalas ligeras (`hover:scale-105`), sombras con halo del color primario y microanimaciones con Framer Motion.
  - Carousels con `scroll-snap` y soporte nativo para gestos táctiles (*swipe*) en móviles.

---

## 📋 12. Convenciones de Código y Reglas Obligatorias

1. **SEO y Jerarquía Semántica (CRÍTICO):**
   - Exactamente **un solo `<h1>`** por página.
   - Jerarquía estricta: `H1` -> `H2` -> `H3` -> `H4`. No saltar niveles por motivos de estilo.
   - Uso de etiquetas semánticas (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`).
   - Textos de enlace descriptivos y atributos `alt` completos en todas las imágenes.
2. **Atribución y Footer:**
   - Incluir siempre **"Desarrollado por K&T"** seguido de un icono de corazón que enlace estrictamente a `https://www.kytcode.lat`.
   - El año de copyright debe generarse programáticamente con `new Date().getFullYear()`. Nunca hardcodear el año.
   - El corazón debe ser **blanco** sobre fondo oscuro y **negro** sobre fondo claro.
3. **Seguridad y Credenciales:**
   - Cero credenciales o claves privadas en el código fuente; todo a través de variables de entorno `.env.local`.
4. **Separación de Idiomas:**
   - Panel de administración (`/administracion`): **Exclusivamente en Español**.
   - Zona pública y de usuario (`/micuenta`, `/registro/*`): **Bilingüe (ES / EN)** mediante `useLanguage()`.
5. **Calidad de Código:**
   - TypeScript estricto sin uso de `any` injustificado.
   - `npx tsc --noEmit` y `npm run build` deben pasar con 0 errores antes de cada entrega.

---

## 🚀 13. Funcionalidades Pendientes y Roadmap Futuro

- [ ] **Brackets Interactivos en Vivo:** Integración de WebSockets / Supabase Realtime para actualización en directo de marcadores de torneos.
- [ ] **Match Score Reporting:** Formulario de envío de capturas de pantalla de resultados para capitanes de equipo al finalizar sus partidas.
- [ ] **Integración de API de Mobile Legends:** Sincronización automática de KDA, winrate y estadísticas de héroes mediante APIs o web scrapers autorizados.
- [ ] **Sistema de Notificaciones Push / In-App:** Campana de notificaciones en el header para avisar a los jugadores sobre aprobaciones de contratos y emparejamientos de torneo.
- [ ] **Pasarela de Premios eSports:** Sistema de dispersión o registro bancario para el pago transparente de premios a los ganadores de torneos.

---

*Documento generado y mantenido como memoria técnica de referencia para GMX Gaming.*
