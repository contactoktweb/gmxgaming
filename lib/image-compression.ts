/**
 * Utilidad de compresión y optimización de imágenes en el cliente (Navegador).
 * Reduce el peso de imágenes en un 90-98% convirtiéndolas a WebP antes de subirlas a Supabase Storage.
 * Cero dependencias externas pesadas — utiliza la API nativa de HTML5 Canvas.
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number // 0.1 a 1.0 (default: 0.85)
  format?: 'image/webp' | 'image/jpeg' | 'image/png'
  fileNamePrefix?: string
}

export const IMAGE_PRESETS = {
  AVATAR: {
    maxWidth: 500,
    maxHeight: 500,
    quality: 0.85,
    format: 'image/webp' as const,
  },
  LOGO: {
    maxWidth: 600,
    maxHeight: 600,
    quality: 0.88,
    format: 'image/webp' as const,
  },
  JERSEY: {
    maxWidth: 1000,
    maxHeight: 1000,
    quality: 0.85,
    format: 'image/webp' as const,
  },
  BANNER: {
    maxWidth: 1400,
    maxHeight: 900,
    quality: 0.82,
    format: 'image/webp' as const,
  },
  DOCUMENT: {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.80,
    format: 'image/webp' as const,
  },
  SPONSOR: {
    maxWidth: 600,
    maxHeight: 400,
    quality: 0.88,
    format: 'image/webp' as const,
  },
  GAME: {
    maxWidth: 600,
    maxHeight: 600,
    quality: 0.85,
    format: 'image/webp' as const,
  },
} as const

/**
 * Comprime un archivo de imagen en el navegador redimensionándolo y convirtiéndolo a WebP.
 * Si el archivo es un PDF u otro formato no imagen, o si la compresión falla,
 * devuelve el archivo original de forma segura.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = IMAGE_PRESETS.AVATAR
): Promise<File> {
  // Si no estamos en el navegador o el archivo no es una imagen compresible (ej: PDF, SVG, GIF animado), retornamos original
  if (typeof window === 'undefined' || !file || !file.type.startsWith('image/')) {
    return file
  }

  // Si es un GIF o SVG, no lo procesamos con canvas para no romper animación o vector
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file
  }

  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.85,
    format = 'image/webp',
    fileNamePrefix,
  } = options

  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        try {
          let { width, height } = img

          // Calcular nuevas dimensiones conservando aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(file)
            return
          }

          // Renderizado suave de alta calidad
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)

          // Exportar a Blob en formato WebP (o el formato solicitado)
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file)
                return
              }

              // Si por alguna razón el blob resultante fuera mayor que el original (raro), usar original
              if (blob.size > file.size && file.type === format) {
                resolve(file)
                return
              }

              const ext = format === 'image/webp' ? 'webp' : format === 'image/jpeg' ? 'jpg' : 'png'
              const originalBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
              const cleanBaseName = originalBaseName.replace(/[^a-zA-Z0-9_-]/g, '_')
              const finalName = fileNamePrefix
                ? `${fileNamePrefix}_${cleanBaseName}.${ext}`
                : `${cleanBaseName}.${ext}`

              const compressedFile = new File([blob], finalName, {
                type: format,
                lastModified: Date.now(),
              })

              resolve(compressedFile)
            },
            format,
            quality
          )
        } catch (err) {
          console.warn('Error durante la compresión de imagen, usando archivo original:', err)
          resolve(file)
        }
      }

      img.onerror = () => {
        resolve(file)
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      resolve(file)
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Opciones estándar de caché para Supabase Storage (1 año = 31536000 segundos)
 */
export const SUPABASE_STORAGE_CACHE_OPTIONS = {
  cacheControl: '31536000',
  upsert: true,
} as const
