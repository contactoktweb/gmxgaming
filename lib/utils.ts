import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convierte variables internas / roles de base de datos a títulos legibles y elegantes.
 * Ejemplos:
 * - 'ROL_JUEGO: Oro' -> 'Línea: Oro' / 'Lane: Oro'
 * - 'JUGADOR(A)' -> 'Jugador' / 'Player'
 * - 'COACH' -> 'Coach'
 * - 'ANALISTA' -> 'Analista' / 'Analyst'
 * - 'PSICOLOGO DEPORTIVO' -> 'Psicólogo Deportivo' / 'Sports Psychologist'
 */
export function formatRoleTitle(role: string, lang: 'es' | 'en' = 'es'): string {
  if (!role || typeof role !== 'string') return ''

  const trimmed = role.trim()
  const lineLabel = lang === 'en' ? 'Lane' : 'Línea'

  // Manejar variantes de rol de juego / línea
  if (/^ROL_?JUEGO\s*:\s*/i.test(trimmed)) {
    const value = trimmed.replace(/^ROL_?JUEGO\s*:\s*/i, '').trim()
    return `${lineLabel}: ${value}`
  }

  if (/^ROL_?DE_?JUEGO\s*:\s*/i.test(trimmed)) {
    const value = trimmed.replace(/^ROL_?DE_?JUEGO\s*:\s*/i, '').trim()
    return `${lineLabel}: ${value}`
  }

  if (/^L[IÍ]NEA\s*:\s*/i.test(trimmed)) {
    const value = trimmed.replace(/^L[IÍ]NEA\s*:\s*/i, '').trim()
    return `${lineLabel}: ${value}`
  }

  // Manejar formatos genéricos "CLAVE: Valor"
  if (trimmed.includes(':')) {
    const [rawKey, ...rest] = trimmed.split(':')
    const value = rest.join(':').trim()
    const formattedKey = rawKey
      .replace(/_/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/(?:^|\s)\p{L}/gu, char => char.toUpperCase())
    return `${formattedKey}: ${value}`
  }

  // Mapeo de roles estándar
  const upper = trimmed.toUpperCase()
  switch (upper) {
    case 'JUGADOR(A)':
    case 'JUGADOR':
    case 'JUGADORA':
      return lang === 'en' ? 'Player' : 'Jugador'
    case 'COACH':
    case 'ENTRENADOR':
      return 'Coach'
    case 'ANALISTA':
      return lang === 'en' ? 'Analyst' : 'Analista'
    case 'PSICOLOGO DEPORTIVO':
    case 'PSICÓLOGO DEPORTIVO':
      return lang === 'en' ? 'Sports Psychologist' : 'Psicólogo Deportivo'
    case 'MANAGER':
      return 'Manager'
    case 'CAPITAN':
    case 'CAPITÁN':
      return lang === 'en' ? 'Captain' : 'Capitán'
    case 'SUPLENTE':
      return lang === 'en' ? 'Substitute' : 'Suplente'
    case 'CREADOR DE CONTENIDO':
    case 'CREADOR_DE_CONTENIDO':
      return lang === 'en' ? 'Content Creator' : 'Creador de Contenido'
    default:
      return trimmed
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase())
  }
}

/**
 * Formatea una lista o array de roles en una cadena limpia y legible.
 * Ej: ['JUGADOR(A)', 'ROL_JUEGO: Oro'] -> 'Jugador, Línea: Oro'
 */
export function formatRolesList(roles: any, separator = ', ', lang: 'es' | 'en' = 'es'): string {
  const fallback = lang === 'en' ? 'No role assigned' : 'Sin rol asignado'
  if (!roles) return fallback

  if (Array.isArray(roles)) {
    const formatted = roles.map(r => formatRoleTitle(r, lang)).filter(Boolean)
    return formatted.length > 0 ? formatted.join(separator) : fallback
  }

  if (typeof roles === 'string') {
    try {
      const parsed = JSON.parse(roles)
      if (Array.isArray(parsed)) {
        return formatRolesList(parsed, separator, lang)
      }
    } catch {
      // String plano
    }
    return formatRoleTitle(roles, lang)
  }

  return fallback
}

/**
 * Traduce y formatea estatus de torneos, partidos, contratos, equipos y usuarios.
 */
export function formatStatus(status: string | null | undefined, lang: 'es' | 'en' = 'es'): string {
  if (!status) return lang === 'en' ? 'Unknown' : 'Desconocido'
  const norm = status.toLowerCase().trim()

  const map: Record<string, { es: string; en: string }> = {
    upcoming: { es: 'Próximo', en: 'Upcoming' },
    proximo: { es: 'Próximo', en: 'Upcoming' },
    próximo: { es: 'Próximo', en: 'Upcoming' },
    ongoing: { es: 'En Curso', en: 'Ongoing' },
    en_curso: { es: 'En Curso', en: 'Ongoing' },
    live: { es: 'En Vivo', en: 'Live Now' },
    finished: { es: 'Finalizado', en: 'Finished' },
    finalizado: { es: 'Finalizado', en: 'Finished' },
    completed: { es: 'Completado', en: 'Completed' },
    completado: { es: 'Completado', en: 'Completed' },
    active: { es: 'Activo', en: 'Active' },
    activo: { es: 'Activo', en: 'Active' },
    inactive: { es: 'Inactivo', en: 'Inactive' },
    inactivo: { es: 'Inactivo', en: 'Inactive' },
    pending: { es: 'Pendiente', en: 'Pending' },
    pendiente: { es: 'Pendiente', en: 'Pending' },
    rejected: { es: 'Rechazado', en: 'Rejected' },
    rechazado: { es: 'Rechazado', en: 'Rejected' },
    approved: { es: 'Aprobado', en: 'Approved' },
    aprobado: { es: 'Aprobado', en: 'Approved' },
    banned: { es: 'Suspendido', en: 'Banned' },
    scheduled: { es: 'Programado', en: 'Scheduled' },
    programado: { es: 'Programado', en: 'Scheduled' },
    pending_player_release: { es: 'Baja Pendiente', en: 'Pending Release' },
    pending_manager_release: { es: 'Baja Pendiente', en: 'Pending Release' },
    free_agent: { es: 'Agente Libre', en: 'Free Agent' },
  }

  if (map[norm]) {
    return map[norm][lang]
  }

  return status.charAt(0).toUpperCase() + status.slice(1)
}

/**
 * Traduce divisiones de torneos (Varonil/Mixto o Femenil)
 */
export function formatDivision(division: string | null | undefined, lang: 'es' | 'en' = 'es'): string {
  if (!division) return ''
  const norm = division.toLowerCase()
  if (norm.includes('femenil') || norm.includes('women') || norm.includes('female')) {
    return lang === 'en' ? "Women's" : 'Femenil'
  }
  if (norm.includes('varonil') || norm.includes('mixt') || norm.includes('men')) {
    return lang === 'en' ? "Men's / Mixed" : 'Varonil / Mixto'
  }
  return division
}

/**
 * Limpia y resume la información de ubicación/aeropuerto a un formato limpio y elegante (ej. "México" o "Colombia").
 * Si la cadena es tipo "MÉXICO - CIUDAD DE MEXICO - AEROPUERTO ...", extrae País de forma limpia y legible.
 */
export function formatLocation(rawLocation?: string | null): string {
  if (!rawLocation) return 'eSports'
  const trimmed = rawLocation.trim()
  if (!trimmed || trimmed.toUpperCase() === 'N/A') return 'eSports'

  // Si contiene separador de formulario GMX "PAÍS - CIUDAD - AEROPUERTO..."
  if (trimmed.includes(' - ')) {
    const parts = trimmed.split(' - ').map(p => p.trim())
    const country = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase() : ''
    
    // Capitalizar adecuadamente el país
    if (country) {
      return country
    }
  }

  // Si es un texto largo con comas o guiones
  if (trimmed.length > 25) {
    const firstPart = trimmed.split(/[-–,]/)[0].trim()
    if (firstPart) {
      return firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase()
    }
  }

  return trimmed
}

/**
 * Extrae el nombre limpio del país desde un campo de aeropuerto o ubicación (ej: "MÉXICO - CIUDAD..." -> "México").
 * Si no hay valor o es N/A, retorna cadena vacía "".
 */
export function extractCountry(rawLocation?: string | null): string {
  if (!rawLocation) return ''
  const trimmed = rawLocation.trim()
  if (!trimmed || trimmed.toUpperCase() === 'N/A') return ''

  let name = trimmed
  if (trimmed.includes(' - ')) {
    const parts = trimmed.split(' - ').map(p => p.trim())
    if (parts[0]) name = parts[0]
  } else if (trimmed.length > 25) {
    const firstPart = trimmed.split(/[-–,]/)[0].trim()
    if (firstPart) name = firstPart
  }

  return name
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const DEFAULT_COUNTRIES = [
  "Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Cuba", 
  "Ecuador", "El Salvador", "España", "Estados Unidos", "Guatemala", 
  "Honduras", "México", "Nicaragua", "Panamá", "Paraguay", "Perú", 
  "Puerto Rico", "República Dominicana", "Uruguay", "Venezuela"
]

/**
 * Convierte un texto a formato slug seguro para URLs y SEO.
 * Ej: "GMX ESPORTS" -> "gmx-esports", "José Hernández" -> "jose-hernandez"
 */
export function slugify(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Obtiene el slug amigable de un equipo.
 */
export function getTeamSlug(team: { id?: string; name?: string; tag?: string } | null | undefined): string {
  if (!team) return ''
  const nameSlug = slugify(team.name)
  return nameSlug || team.id || ''
}

/**
 * Obtiene el slug amigable de un jugador (preferencia por nickname).
 */
export function getPlayerSlug(player: { id?: string; nickname?: string; name?: string } | null | undefined): string {
  if (!player) return ''
  const nickSlug = slugify(player.nickname || player.name)
  return nickSlug || player.id || ''
}

/**
 * Obtiene el slug amigable de un torneo.
 */
export function getTournamentSlug(tournament: { id?: string; name?: string } | null | undefined): string {
  if (!tournament) return ''
  const nameSlug = slugify(tournament.name)
  return nameSlug || tournament.id || ''
}

/**
 * Traduce los mensajes de error de Supabase Auth y APIs al español para una experiencia amigable y clara.
 */
export function translateAuthError(error: any): string {
  if (!error) return ''
  const rawMessage = typeof error === 'string' ? error : (error.message || error.error_description || '')
  if (!rawMessage) return 'Ocurrió un error inesperado. Por favor intenta de nuevo.'

  const lower = rawMessage.toLowerCase().trim()

  if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
    return 'Correo o contraseña incorrectos. Verifica tus datos e intenta nuevamente.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.'
  }
  if (lower.includes('user already registered') || lower.includes('user already exists') || lower.includes('user_already_exists')) {
    return 'Este correo electrónico ya está registrado. Por favor inicia sesión o recupera tu contraseña.'
  }
  if (lower.includes('password should be at least 6 characters')) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }
  if (lower.includes('signup requires a valid password') || lower.includes('weak password') || lower.includes('password is too weak')) {
    return 'Por favor ingresa una contraseña válida (mínimo 6 caracteres).'
  }
  if (lower.includes('email rate limit exceeded') || lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Demasiados intentos. Por favor espera unos minutos antes de intentar de nuevo.'
  }
  if (lower.includes('once every 60 seconds')) {
    return 'Por seguridad, solo puedes realizar esta acción una vez por minuto.'
  }
  if (lower.includes('user not found')) {
    return 'No existe ninguna cuenta asociada a este correo electrónico.'
  }
  if (lower.includes('invalid email') || lower.includes('unable to validate email') || lower.includes('invalid format')) {
    return 'El formato del correo electrónico no es válido.'
  }
  if (lower.includes('auth_callback_failed')) {
    return 'No se pudo completar el inicio de sesión con Google. Por favor intenta de nuevo.'
  }
  if (lower.includes('access_denied')) {
    return 'Acceso cancelado o denegado por el usuario.'
  }
  if (lower.includes('failed to fetch') || lower.includes('network request failed') || lower.includes('fetch failed')) {
    return 'Error de conexión con el servidor. Revisa tu conexión a internet.'
  }
  if (lower.includes('token has expired') || lower.includes('token is invalid') || lower.includes('token expired') || lower.includes('otp_expired')) {
    return 'El enlace o código de acceso ha expirado o no es válido.'
  }
  if (lower.includes('passwords do not match') || lower.includes('las contraseñas no coinciden')) {
    return 'Las contraseñas no coinciden.'
  }
  if (lower.includes('missing email') || lower.includes('email address required')) {
    return 'Por favor ingresa un correo electrónico válido.'
  }
  if (lower.includes('signup disabled')) {
    return 'El registro de usuarios está deshabilitado temporalmente.'
  }
  if (lower.includes('jwt expired') || lower.includes('session expired') || lower.includes('invalid refresh token')) {
    return 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
  }

  // Base de datos y constraints comunes
  if (lower.includes('duplicate key') || lower.includes('unique constraint')) {
    return 'Ya existe un registro con esta información en el sistema.'
  }
  if (lower.includes('violates foreign key constraint')) {
    return 'El registro relacionado no existe o no es válido.'
  }
  if (lower.includes('violates not-null constraint')) {
    return 'Por favor completa todos los campos requeridos.'
  }
  if (lower.includes('row-level security') || lower.includes('permission denied')) {
    return 'No tienes permisos suficientes para realizar esta acción.'
  }

// Si ya es un mensaje en español reconocible, mantenerlo
  return rawMessage
}

export const translateErrorMessage = translateAuthError

/**
 * Sanitiza y formatea un nickname competitivo / IGN:
 * - Todo en mayúsculas (UPPERCASE)
 * - Sin caracteres especiales (únicamente letras A-Z, números 0-9 y espacios)
 * - Elimina acentos/tildes y cualquier símbolo
 */
export function formatNickname(value: string): string {
  if (!value) return ''
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
}

/**
 * Sanitiza y formatea nombres y apellidos de personas:
 * - Todo en mayúsculas (UPPERCASE)
 * - Sin caracteres especiales ni números (únicamente letras A-Z, acentos válidos, Ñ y espacios)
 */
export function formatPersonName(value: string): string {
  if (!value) return ''
  return value
    .toUpperCase()
    .replace(/[^A-ZÁÉÍÓÚÜÑ ]/g, '')
}

/**
 * Valida si un nickname cumple con las reglas (no vacío y sin caracteres especiales)
 */
export function isValidNickname(value: string): boolean {
  if (!value || !value.trim()) return false
  return /^[A-Z0-9 ]+$/.test(value.trim())
}

/**
 * Valida si un nombre/apellido cumple con las reglas (no vacío, sin números ni caracteres especiales)
 */
export function isValidPersonName(value: string): boolean {
  if (!value || !value.trim()) return false
  return /^[A-ZÁÉÍÓÚÜÑ ]+$/i.test(value.trim())
}
