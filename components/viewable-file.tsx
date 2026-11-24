'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

// Bucket privado de documentos (INE, pasaporte): solo los administradores pueden leerlo
const PRIVATE_DOCUMENTS_BUCKET = 'documents'
// Duración de los enlaces firmados (segundos)
const SIGNED_URL_TTL = 60 * 60

/**
 * Ruta de un archivo del bucket privado de documentos a partir del enlace guardado en la base de
 * datos (".../storage/v1/object/public/documents/<ruta>"). null si no es un documento privado.
 */
export function getPrivateDocumentPath(url: unknown): string | null {
  if (typeof url !== 'string') return null
  const match = url.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/documents\/([^?#]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Enlace con el que se puede ver un archivo guardado. En un bucket privado el enlace público no
 * abre, así que para los documentos se pide un enlace firmado temporal (solo un admin puede
 * obtenerlo). Cualquier otro enlace se devuelve tal cual.
 */
export function useViewableFileUrl(url: string | null | undefined) {
  const path = getPrivateDocumentPath(url)
  const [signed, setSigned] = useState<{ path: string; url: string | null } | null>(null)

  useEffect(() => {
    if (!path) return
    let cancelled = false
    createClient()
      .storage.from(PRIVATE_DOCUMENTS_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.warn('No se pudo abrir el documento privado:', error.message)
        setSigned({ path, url: data?.signedUrl || null })
      })
    return () => { cancelled = true }
  }, [path])

  if (!path) return { src: url || '', loading: false, unavailable: false }
  const resolved = signed?.path === path ? signed : null
  return { src: resolved?.url || '', loading: !resolved, unavailable: Boolean(resolved && !resolved.url) }
}

type ViewableImgProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src: string | null | undefined }

/** <img> que también muestra documentos del bucket privado (con enlace firmado). */
export function ViewableImg({ src, alt = '', className, ...props }: ViewableImgProps) {
  const { src: viewable, loading, unavailable } = useViewableFileUrl(src)
  if (!viewable) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="text-[10px] text-muted-foreground text-center p-1">
          {loading ? 'Cargando…' : unavailable ? 'Sin acceso' : 'Sin imagen'}
        </span>
      </div>
    )
  }
  return <img src={viewable} alt={alt} className={className} {...props} />
}

type ViewableFileLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string | null | undefined }

/** <a> que también abre documentos del bucket privado (con enlace firmado). */
export function ViewableFileLink({ href, children, ...props }: ViewableFileLinkProps) {
  const { src: viewable } = useViewableFileUrl(href)
  return (
    <a href={viewable || undefined} aria-disabled={!viewable} {...props}>
      {children}
    </a>
  )
}
