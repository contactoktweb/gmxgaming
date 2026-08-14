import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convierte variables internas / roles de base de datos a títulos legibles y elegantes.
 * Ejemplos:
 * - 'ROL_JUEGO: Oro' -> 'Línea: Oro'
 * - 'JUGADOR(A)' -> 'Jugador'
 * - 'COACH' -> 'Coach'
 * - 'ANALISTA' -> 'Analista'
 * - 'PSICOLOGO DEPORTIVO' -> 'Psicólogo Deportivo'
 */
export function formatRoleTitle(role: string): string {
  if (!role || typeof role !== 'string') return ''

  const trimmed = role.trim()

  // Manejar variantes de rol de juego / línea
  if (/^ROL_?JUEGO\s*:\s*/i.test(trimmed)) {
    const value = trimmed.replace(/^ROL_?JUEGO\s*:\s*/i, '').trim()
    return `Línea: ${value}`
  }

  if (/^ROL_?DE_?JUEGO\s*:\s*/i.test(trimmed)) {
    const value = trimmed.replace(/^ROL_?DE_?JUEGO\s*:\s*/i, '').trim()
    return `Línea: ${value}`
  }

  if (/^LINEA\s*:\s*/i.test(trimmed)) {
    const value = trimmed.replace(/^LINEA\s*:\s*/i, '').trim()
    return `Línea: ${value}`
  }

  // Manejar formatos genéricos "CLAVE: Valor"
  if (trimmed.includes(':')) {
    const [rawKey, ...rest] = trimmed.split(':')
    const value = rest.join(':').trim()
    const formattedKey = rawKey
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase())
      .trim()
    return `${formattedKey}: ${value}`
  }

  // Mapeo de roles estándar
  const upper = trimmed.toUpperCase()
  switch (upper) {
    case 'JUGADOR(A)':
    case 'JUGADOR':
    case 'JUGADORA':
      return 'Jugador'
    case 'COACH':
    case 'ENTRENADOR':
      return 'Coach'
    case 'ANALISTA':
      return 'Analista'
    case 'PSICOLOGO DEPORTIVO':
    case 'PSICÓLOGO DEPORTIVO':
      return 'Psicólogo Deportivo'
    case 'MANAGER':
      return 'Manager'
    case 'CAPITAN':
    case 'CAPITÁN':
      return 'Capitán'
    case 'SUPLENTE':
      return 'Suplente'
    case 'CREADOR DE CONTENIDO':
    case 'CREADOR_DE_CONTENIDO':
      return 'Creador de Contenido'
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
export function formatRolesList(roles: any, separator = ', '): string {
  if (!roles) return 'Sin rol asignado'

  if (Array.isArray(roles)) {
    const formatted = roles.map(r => formatRoleTitle(r)).filter(Boolean)
    return formatted.length > 0 ? formatted.join(separator) : 'Sin rol asignado'
  }

  if (typeof roles === 'string') {
    try {
      const parsed = JSON.parse(roles)
      if (Array.isArray(parsed)) {
        return formatRolesList(parsed, separator)
      }
    } catch {
      // String plano
    }
    return formatRoleTitle(roles)
  }

  return 'Sin rol asignado'
}

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
