'use client'

import { useState, useEffect } from 'react'
import { Check, X, UserCheck, ShieldCheck, ScrollText, Eye, FileText, Image as ImageIcon, AlertCircle, Maximize2, ZoomIn } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { GmxButton } from '@/components/gmx-button'
import { cn } from '@/lib/utils'

type ValidationType = 'jugador' | 'equipo' | 'contrato'

interface PendingRequest {
  id: string
  type: ValidationType
  name: string
  date: string
  status: 'pending' | 'approved' | 'rejected'
  details?: string
  validatedBy?: string
  payload?: any // Mock data payload for visualization
}

const mockRequests: PendingRequest[] = [
  { 
    id: '1', 
    type: 'jugador', 
    name: 'Sinner (MOBILE LEGENDS)', 
    date: '2024-07-24', 
    status: 'pending', 
    details: 'Equipo: STARBOYS',
    payload: {
      nombreCompleto: 'Juan Perez',
      correo: 'sinner@starboys.com',
      telefono: '+52 555 123 4567',
      paisResidencia: 'México',
      fechaNacimiento: '2000-05-15',
      rol: 'Jungla',
      idJuego: '9928374',
      serverJuego: '1234',
      fotografia: 'https://placehold.co/400x400/png?text=FOTO+JUGADOR',
      documentoIdentidad: 'https://placehold.co/600x400/png?text=INE',
      pasaporte: 'https://placehold.co/600x400/png?text=PASAPORTE'
    }
  },
  { 
    id: '2', 
    type: 'equipo', 
    name: 'TEAM QUETZAL KING', 
    date: '2024-07-23', 
    status: 'pending', 
    details: 'Manager: Luis Perez',
    payload: {
      manager: 'Luis Perez',
      correo: 'contacto@quetzalking.com',
      telefono: '+57 300 123 4567',
      pais: 'Colombia',
      tipoEquipo: 'Varonil / Mixto',
      juegos: 'MLBB',
      logoEquipo: 'https://placehold.co/400x400/png?text=LOGO+EQUIPO',
      comprobantePago: 'https://placehold.co/600x400/png?text=COMPROBANTE'
    }
  },
  { 
    id: '3', 
    type: 'contrato', 
    name: 'Stark - TEAM LIMIT', 
    date: '2024-07-23', 
    status: 'pending', 
    details: 'Fin: 2024-12-31',
    payload: {
      jugador: 'Stark',
      equipo: 'TEAM LIMIT',
      fechaInicio: '2024-07-23',
      fechaFin: '2024-12-31',
      documentoContrato: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    }
  },
]

export function AdminValidations() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<PendingRequest[]>(mockRequests)
  
  // Modals state
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: string, action: 'approved' | 'rejected', name: string } | null>(null)
  const [lightboxImage, setLightboxImage] = useState<{ src: string, label: string } | null>(null)

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

  const handleExecuteAction = () => {
    if (!confirmAction) return
    
    setRequests(prev => prev.map(req => {
      if (req.id === confirmAction.id) {
        return { ...req, status: confirmAction.action, validatedBy: user?.name }
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
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-6">
          Validaciones Pendientes
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background">
              <tr>
                <th className="px-4 py-3 font-600 text-muted-foreground">TIPO</th>
                <th className="px-4 py-3 font-600 text-muted-foreground">NOMBRE / REFERENCIA</th>
                <th className="px-4 py-3 font-600 text-muted-foreground">DETALLES</th>
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
                  <td className="px-4 py-4 font-500 text-white">{req.name}</td>
                  <td className="px-4 py-4 text-muted-foreground">{req.details}</td>
                  <td className="px-4 py-4 text-muted-foreground">{req.date}</td>
                  <td className="px-4 py-4">
                    {req.status === 'pending' ? (
                      <span className="inline-flex items-center rounded-full bg-yellow-400/10 px-2 py-1 text-xs font-500 text-yellow-400 ring-1 ring-inset ring-yellow-400/20">
                        Pendiente
                      </span>
                    ) : req.status === 'approved' ? (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center rounded-full bg-emerald-400/10 px-2 py-1 text-xs font-500 text-emerald-400 ring-1 ring-inset ring-emerald-400/20 w-fit">
                          Aprobado
                        </span>
                        <span className="text-[10px] text-muted-foreground">por {req.validatedBy}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center rounded-full bg-red-400/10 px-2 py-1 text-xs font-500 text-red-400 ring-1 ring-inset ring-red-400/20 w-fit">
                          Rechazado
                        </span>
                        <span className="text-[10px] text-muted-foreground">por {req.validatedBy}</span>
                      </div>
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
                            onClick={() => setConfirmAction({ id: req.id, action: 'approved', name: req.name })}
                            title="Aprobar"
                            className="flex h-8 w-8 items-center justify-center rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 transition-colors hover:bg-emerald-500 hover:text-white"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmAction({ id: req.id, action: 'rejected', name: req.name })}
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
          {requests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay solicitudes pendientes.
            </div>
          )}
        </div>
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
                <p className="text-sm text-muted-foreground mt-1">{selectedRequest.name}</p>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="text-muted-foreground hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body con Scroll - data-lenis-prevent tells Lenis to allow native scroll here */}
            <div data-lenis-prevent data-modal-scrollbody className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6">
              <div className="grid sm:grid-cols-2 gap-6">
                {Object.entries(selectedRequest.payload || {}).map(([key, value]) => {
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
                    setConfirmAction({ id: selectedRequest.id, action: 'rejected', name: selectedRequest.name })
                    setSelectedRequest(null)
                  }}
                  className="border-red-500/20 text-red-500 hover:border-red-500 hover:text-white hover:bg-red-500/20"
                >
                  RECHAZAR
                </GmxButton>
                <GmxButton 
                  onClick={() => {
                    setConfirmAction({ id: selectedRequest.id, action: 'approved', name: selectedRequest.name })
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
