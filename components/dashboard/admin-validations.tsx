'use client'

import { useState, useEffect } from 'react'
import { Check, X, UserCheck, ShieldCheck, ScrollText, Eye, FileText, Image as ImageIcon, AlertCircle, Maximize2, ZoomIn } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { GmxButton } from '@/components/gmx-button'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'

type ValidationType = 'jugador' | 'equipo' | 'contrato' | string

interface PendingRequest {
  id: string
  type: ValidationType
  target_name: string
  created_at: string
  status: 'pending' | 'approved' | 'rejected' | string
  submitted_by?: string
  details?: any
}

export function AdminValidations() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  // Modals state
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: string, action: 'approved' | 'rejected', name: string } | null>(null)
  const [lightboxImage, setLightboxImage] = useState<{ src: string, label: string } | null>(null)

  const fetchValidations = async () => {
    setLoading(true)
    const { data } = await supabase.from('validations').select('*').order('created_at', { ascending: false })
    if (data) setRequests(data as PendingRequest[])
    setLoading(false)
  }

  useEffect(() => {
    fetchValidations()
  }, [])

  useEffect(() => {
    if (selectedRequest || confirmAction) {
      window.__lenis?.stop()
    } else {
      window.__lenis?.start()
    }
    return () => {
      window.__lenis?.start()
    }
  }, [selectedRequest, confirmAction])

  const handleExecuteAction = async () => {
    if (!confirmAction) return
    
    await supabase.from('validations').update({ status: confirmAction.action }).eq('id', confirmAction.id)
    
    setRequests(prev => prev.map(req => {
      if (req.id === confirmAction.id) {
        return { ...req, status: confirmAction.action }
      }
      return req
    }))
    
    setConfirmAction(null)
    setSelectedRequest(null)
  }

  const getTypeIcon = (type: ValidationType) => {
    switch (type) {
      case 'jugador': return <UserCheck className="w-5 h-5 text-emerald-400" />
      case 'equipo': return <ShieldCheck className="w-5 h-5 text-blue-400" />
      case 'contrato': return <ScrollText className="w-5 h-5 text-purple-400" />
      default: return <FileText className="w-5 h-5 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-6">
          Validaciones Pendientes
        </h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground animate-pulse">Cargando validaciones...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay solicitudes pendientes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 font-600 text-muted-foreground">TIPO</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">NOMBRE / REFERENCIA</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">ENVIADO POR</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">FECHA</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">ESTADO</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map(req => (
                  <tr key={req.id} className="transition-colors hover:bg-white/5">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 uppercase font-500 text-xs">
                        {getTypeIcon(req.type)}
                        {req.type}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-500 text-white">{req.target_name}</td>
                    <td className="px-4 py-4 text-muted-foreground">{req.submitted_by || 'N/A'}</td>
                    <td className="px-4 py-4 text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-4">
                      {req.status === 'pending' ? (
                        <span className="inline-flex items-center rounded-full bg-yellow-400/10 px-2 py-1 text-xs font-500 text-yellow-400 ring-1 ring-inset ring-yellow-400/20">
                          Pendiente
                        </span>
                      ) : req.status === 'approved' ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-400/10 px-2 py-1 text-xs font-500 text-emerald-400 ring-1 ring-inset ring-emerald-400/20 w-fit">
                          Aprobado
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-400/10 px-2 py-1 text-xs font-500 text-red-400 ring-1 ring-inset ring-red-400/20 w-fit">
                          Rechazado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          title="Ver Detalles"
                          className="flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setConfirmAction({ id: req.id, action: 'approved', name: req.target_name })}
                              title="Aprobar"
                              className="flex h-8 w-8 items-center justify-center rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 transition-colors hover:bg-emerald-500 hover:text-white"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setConfirmAction({ id: req.id, action: 'rejected', name: req.target_name })}
                              title="Rechazar"
                              className="flex h-8 w-8 items-center justify-center rounded border border-red-500/20 bg-red-500/10 text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedRequest(null)} />
          <div className="relative flex flex-col w-full max-w-2xl h-[90vh] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex shrink-0 items-center justify-between border-b border-border p-6 bg-surface z-10">
              <div>
                <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
                  {getTypeIcon(selectedRequest.type)}
                  Detalles de Solicitud
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedRequest.target_name}</p>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="text-muted-foreground hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body con Scroll */}
            <div data-lenis-prevent data-modal-scrollbody className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6">
              <div className="grid sm:grid-cols-2 gap-6">
                {Object.entries(selectedRequest.details || {}).map(([key, value]) => {
                  const isImage = typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image')) && !value.endsWith('.pdf');
                  const isPdf = typeof value === 'string' && value.endsWith('.pdf');
                  
                  return (
                    <div key={key} className="space-y-2">
                      <label className="text-xs font-600 uppercase tracking-widest text-primary">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      {isImage ? (
                        <div className="rounded-lg border border-border bg-background p-2">
                          <button 
                            onClick={() => setLightboxImage({ src: value as string, label: key.replace(/([A-Z])/g, ' $1').trim() })}
                            className="block w-full aspect-video relative rounded-md overflow-hidden bg-white/5 group border border-border/50 cursor-zoom-in"
                          >
                            <img src={value as string} alt={key} className="absolute inset-0 w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                              <ZoomIn className="w-6 h-6 text-white" />
                              <span className="text-xs font-500 text-white uppercase">Ver en Grande</span>
                            </div>
                          </button>
                        </div>
                      ) : isPdf ? (
                        <a 
                          href={value as string} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-4 text-white hover:border-primary hover:text-primary transition-colors group"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <FileText className="w-8 h-8 shrink-0 text-primary group-hover:text-primary" />
                            <span className="text-sm font-500 truncate">{value}</span>
                          </div>
                          <ScrollText className="w-4 h-4 shrink-0 opacity-50 group-hover:opacity-100" />
                        </a>
                      ) : (
                        <div className="rounded-lg border border-border bg-background px-4 py-3 text-white text-sm break-words">
                          {value as string}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer Fijo */}
            {selectedRequest.status === 'pending' && (
              <div className="flex shrink-0 justify-end gap-4 border-t border-border p-6 bg-surface z-10">
                <GmxButton 
                  variant="secondary"
                  onClick={() => {
                    setConfirmAction({ id: selectedRequest.id, action: 'rejected', name: selectedRequest.target_name })
                    setSelectedRequest(null)
                  }}
                  className="border-red-500/20 text-red-500 hover:border-red-500 hover:text-white hover:bg-red-500/20"
                >
                  RECHAZAR
                </GmxButton>
                <GmxButton 
                  onClick={() => {
                    setConfirmAction({ id: selectedRequest.id, action: 'approved', name: selectedRequest.target_name })
                    setSelectedRequest(null)
                  }}
                >
                  APROBAR SOLICITUD
                </GmxButton>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            
            <div className={cn(
              "mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-6",
              confirmAction.action === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
            )}>
              {confirmAction.action === 'approved' ? <Check className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
            </div>

            <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-2">
              ¿Estás seguro?
            </h3>
            
            <p className="text-muted-foreground mb-8">
              Estás a punto de <strong className={confirmAction.action === 'approved' ? 'text-emerald-500' : 'text-red-500'}>
                {confirmAction.action === 'approved' ? 'APROBAR' : 'RECHAZAR'}
              </strong> la solicitud de:<br/>
              <span className="text-white mt-2 block font-500">{confirmAction.name}</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-md border border-border bg-transparent px-4 py-3 font-display text-[13px] font-600 uppercase tracking-widest text-muted-foreground transition-colors hover:text-white"
              >
                CANCELAR
              </button>
              <button 
                onClick={handleExecuteAction}
                className={cn(
                  "flex-1 rounded-md px-4 py-3 font-display text-[13px] font-600 uppercase tracking-widest text-white transition-colors relative overflow-hidden clip-corner group",
                  confirmAction.action === 'approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                )}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  CONFIRMAR {confirmAction.action === 'approved' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/95 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            className="absolute right-6 top-6 text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 z-10"
            onClick={() => setLightboxImage(null)}
          >
            <X className="w-7 h-7" />
          </button>
          <p className="absolute top-6 left-6 text-xs font-600 uppercase tracking-widest text-white/50">
            {lightboxImage.label}
          </p>
          <img 
            src={lightboxImage.src} 
            alt={lightboxImage.label} 
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
