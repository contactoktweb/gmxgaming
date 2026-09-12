/**
 * Utilidad para resolver la URL base del sitio de manera dinámica y segura
 * según el entorno (Local, Development en Vercel, Producción con dominio propio).
 */
export function getSiteUrl(): string {
  // 1. En el navegador del cliente: siempre usa el origen real de la ventana
  // (funciona automáticamente para localhost:3000, gmxgaming.vercel.app y gmxgaming.com)
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  // 2. Variable de entorno explícita configurada en .env o Vercel
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }

  // 3. Variables de entorno generadas automáticamente por Vercel
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL && process.env.VERCEL_ENV === 'production') {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // 4. Fallback predeterminado a producción
  return 'https://gmxgaming.com'
}
