'use client'

import { useState, useEffect } from 'react'
import { Check, X, UserCheck, ShieldCheck, ScrollText, Eye, FileText, Image as ImageIcon, AlertCircle, Maximize2, ZoomIn, Search, Trash2, Save } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { GmxButton } from '@/components/gmx-button'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'

type ValidationType = 'jugador' | 'equipo' | 'contrato' | 'all'

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
  
  // Filters and search
  const [activeTab, setActiveTab] = useState<ValidationType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: string, action: 'approved' | 'rejected' | 'deleted', name: string } | null>(null)
  const [lightboxImage, setLightboxImage] = useState<{ src: string, label: string } | null>(null)
  
  // Deletion logic
  const [deleteConfirmationWord, setDeleteConfirmationWord] = useState('')

  // Edit details logic
  const [editingDetails, setEditingDetails] = useState<any>(null)

  const fetchValidations = async () => {
    setLoading(true)
    
    // 1. Fetch pending players
    const { data: pendingPlayers } = await supabase
      .from('profiles')
      .select('*, player_game_info(*)')
      .eq('is_player', true)

    // 2. Fetch pending teams
    const { data: pendingTeams } = await supabase
      .from('teams')
      .select('*')

    // 3. Fetch pending contracts
    const { data: pendingContracts } = await supabase
      .from('contracts')
      .select('*, profiles(name, nickname), teams(name)')

    const formattedRequests: PendingRequest[] = []

    if (pendingPlayers) {
      pendingPlayers.forEach(p => {
        formattedRequests.push({
          id: p.id,
          type: 'jugador',
          target_name: p.nickname || p.name,
          created_at: p.created_at,
          status: p.player_status,
          submitted_by: p.name,
          details: p
        })
      })
    }

    if (pendingTeams) {
      pendingTeams.forEach(t => {
        formattedRequests.push({
          id: t.id,
          type: 'equipo',
          target_name: t.name,
          created_at: t.created_at,
          status: t.status,
          submitted_by: t.manager_id, // We could fetch manager name, but ID is fine for now
          details: t
        })
      })
    }

    if (pendingContracts) {
      pendingContracts.forEach(c => {
        formattedRequests.push({
          id: c.id,
          type: 'contrato',
          target_name: `${c.profiles?.nickname || c.profiles?.name} -> ${c.teams?.name}`,
          created_at: c.created_at,
          status: c.status,
          submitted_by: c.profiles?.name,
          details: c
        })
      })
    }

    // Sort by date descending
    formattedRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setRequests(formattedRequests)
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

    if (confirmAction.action === 'deleted') {
      if (deleteConfirmationWord !== 'SI') return
      
      const requestToUpdate = requests.find(req => req.id === confirmAction.id)
      if (requestToUpdate?.type === 'jugador') {
        await supabase.from('profiles').update({ is_player: false, player_status: 'none' }).eq('id', confirmAction.id)
      } else if (requestToUpdate?.type === 'equipo') {
        await supabase.from('teams').delete().eq('id', confirmAction.id)
      } else if (requestToUpdate?.type === 'contrato') {
        await supabase.from('contracts').delete().eq('id', confirmAction.id)
      }
      
      setRequests(prev => prev.filter(req => req.id !== confirmAction.id))
    } else {
      const requestToUpdate = requests.find(req => req.id === confirmAction.id)
      const newStatus = confirmAction.action === 'approved' ? 'active' : 'rejected'
      
      if (requestToUpdate) {
        if (requestToUpdate.type === 'jugador') {
          await supabase.from('profiles').update({ player_status: newStatus }).eq('id', confirmAction.id)
        } else if (requestToUpdate.type === 'equipo') {
          await supabase.from('teams').update({ status: newStatus }).eq('id', confirmAction.id)
        } else if (requestToUpdate.type === 'contrato') {
          await supabase.from('contracts').update({ status: newStatus }).eq('id', confirmAction.id)
        }
      }

      setRequests(prev => prev.map(req => {
        if (req.id === confirmAction.id) {
          return { ...req, status: newStatus }
        }
        return req
      }))
    }
    
    setConfirmAction(null)
    setSelectedRequest(null)
    setDeleteConfirmationWord('')
  }

  const handleSaveDetails = async () => {
    if (!selectedRequest || !editingDetails) return
    
    // Remove nested relational data before saving to main table
    const { player_game_info, profiles, teams, ...cleanDetails } = editingDetails;

    let error = null;
    
    try {
      if (selectedRequest.type === 'jugador') {
        const { error: err } = await supabase.from('profiles').update(cleanDetails).eq('id', selectedRequest.id)
        error = err;
      } else if (selectedRequest.type === 'equipo') {
        const { error: err } = await supabase.from('teams').update(cleanDetails).eq('id', selectedRequest.id)
        error = err;
      } else if (selectedRequest.type === 'contrato') {
        const { error: err } = await supabase.from('contracts').update(cleanDetails).eq('id', selectedRequest.id)
        error = err;
      }
        
      if (!error) {
        // Update local state
        setRequests(prev => prev.map(req => {
          if (req.id === selectedRequest.id) {
            // Also update the target_name if name or nickname changed
            let targetName = req.target_name;
            let newStatus = req.status;
            
            if (req.type === 'jugador') {
              targetName = editingDetails.nickname || editingDetails.name;
              if (editingDetails.player_status) newStatus = editingDetails.player_status;
            } else if (req.type === 'equipo') {
              targetName = editingDetails.name;
              if (editingDetails.status) newStatus = editingDetails.status;
            } else if (req.type === 'contrato') {
              if (editingDetails.status) newStatus = editingDetails.status;
            }
            
            return { ...req, target_name: targetName, details: editingDetails, status: newStatus }
          }
          return req
        }))
        setSelectedRequest({ ...selectedRequest, target_name: editingDetails.nickname || editingDetails.name || selectedRequest.target_name, details: editingDetails, status: editingDetails.status || editingDetails.player_status || selectedRequest.status })
        alert('Cambios guardados correctamente.')
      } else {
        console.error(error)
        alert('Error guardando cambios.')
      }
    } catch (err) {
      console.error(err)
      alert('Error inesperado al guardar cambios.')
    }
  }

  const getTypeIcon = (type: ValidationType) => {
    switch (type) {
      case 'jugador': return <UserCheck className="w-5 h-5 text-emerald-400" />
      case 'equipo': return <ShieldCheck className="w-5 h-5 text-blue-400" />
      case 'contrato': return <ScrollText className="w-5 h-5 text-purple-400" />
      default: return <FileText className="w-5 h-5 text-muted-foreground" />
    }
  }

  const filteredRequests = requests.filter(req => {
    if (activeTab !== 'all' && req.type !== activeTab) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return req.target_name.toLowerCase().includes(q) || req.submitted_by?.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Tabs */}
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white">
            Validaciones
          </h2>
          
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar validación..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-sm text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
          {['all', 'jugador', 'equipo', 'contrato'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as ValidationType)}
              className={cn(
                "px-4 py-2 rounded-md font-display text-sm font-600 uppercase tracking-wider transition-colors",
                activeTab === tab 
                  ? "bg-primary text-white" 
                  : "bg-background border border-border text-muted-foreground hover:text-white"
              )}
            >
              {tab === 'all' ? 'Todas' : tab === 'jugador' ? 'Jugadores' : `${tab}s`}
            </button>
          ))}
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground animate-pulse">Cargando validaciones...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg bg-background/50">
            <p className="text-muted-foreground">No hay solicitudes que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 font-600 text-muted-foreground">TIPO</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">NOMBRE / NICKNAME</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">FECHA REGISTRO</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">ESTATUS</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRequests.map(req => (
                  <tr key={req.id} className="transition-colors hover:bg-white/5">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 uppercase font-500 text-xs">
                        {getTypeIcon(req.type)}
                        {req.type}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-500 text-white">{req.target_name}</td>
                    <td className="px-4 py-4 text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-4">
                      {req.status === 'pending' ? (
                        <span className="inline-flex items-center rounded-full bg-yellow-400/10 px-2 py-1 text-xs font-500 text-yellow-400 ring-1 ring-inset ring-yellow-400/20">
                          Pendiente
                        </span>
                      ) : (req.status === 'active' || req.status === 'approved') ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-400/10 px-2 py-1 text-xs font-500 text-emerald-400 ring-1 ring-inset ring-emerald-400/20">
                          ACTIVO
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-400/10 px-2 py-1 text-xs font-500 text-red-400 ring-1 ring-inset ring-red-400/20">
                          RECHAZADO
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(req)
                            setEditingDetails(req.details)
                          }}
                          title="Ver y Editar Detalles"
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

                        <button
                          onClick={() => setConfirmAction({ id: req.id, action: 'deleted', name: req.target_name })}
                          title="Eliminar"
                          className="flex h-8 w-8 items-center justify-center rounded border border-red-900/50 bg-red-900/10 text-red-700 transition-colors hover:bg-red-900 hover:text-white ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details / Edit Modal */}
      {selectedRequest && editingDetails && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedRequest(null)} />
          <div className="relative flex flex-col w-full max-w-2xl h-[90vh] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex shrink-0 items-center justify-between border-b border-border p-6 bg-surface z-10">
              <div>
                <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
                  {getTypeIcon(selectedRequest.type)}
                  Detalles / Edición
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
                {Object.entries(editingDetails).map(([key, value]) => {
                  const isImage = typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image')) && !value.endsWith('.pdf');
                  const isPdf = typeof value === 'string' && value.endsWith('.pdf');
                  const isBoolean = typeof value === 'boolean';
                  const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
                  const isArray = Array.isArray(value);
                  const isStatusField = key === 'status' || key === 'player_status';
                  
                  if (isObject) {
                     return (
                       <div key={key} className="col-span-full border border-border rounded-md p-4 bg-background/50">
                         <label className="text-xs font-600 uppercase tracking-widest text-primary mb-4 block border-b border-border/50 pb-2">
                           {key.replace(/([A-Z])/g, ' $1').trim()}
                         </label>
                         <div className="grid sm:grid-cols-2 gap-4">
                           {Object.entries(value).map(([subKey, subValue]) => (
                             <div key={subKey} className="space-y-2">
                               <label className="text-xs font-500 uppercase tracking-widest text-muted-foreground">
                                 {subKey.replace(/([A-Z])/g, ' $1').trim()}
                               </label>
                               <input
                                 type="text"
                                 value={subValue as string || ''}
                                 onChange={(e) => {
                                    setEditingDetails({
                                      ...editingDetails,
                                      [key]: {
                                        ...editingDetails[key],
                                        [subKey]: e.target.value
                                      }
                                    })
                                 }}
                                 className="w-full rounded-md border border-border bg-background px-4 py-2 text-white focus:border-primary focus:outline-none"
                               />
                             </div>
                           ))}
                         </div>
                       </div>
                     )
                  }

                  return (
                    <div key={key} className={cn("space-y-2", (isImage || isPdf) ? "col-span-full sm:col-span-1" : "")}>
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
                      ) : isBoolean ? (
                        <select
                          disabled
                          className="w-full rounded-md border border-border bg-background px-4 py-2 text-white/70 opacity-70 cursor-not-allowed"
                          value={value ? 'true' : 'false'}
                        >
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      ) : isArray ? (
                        <input
                          type="text"
                          readOnly
                          value={(value as string[]).join(', ')}
                          className="w-full rounded-md border border-border bg-surface px-4 py-2 text-white/70 opacity-70 cursor-not-allowed"
                        />
                      ) : isStatusField ? (
                        <select
                          value={value as string || 'pending'}
                          onChange={(e) => setEditingDetails({ ...editingDetails, [key]: e.target.value })}
                          className="w-full rounded-md border border-border bg-background px-4 py-2 text-white focus:border-primary focus:outline-none"
                        >
                          <option value="pending">Pendiente</option>
                          <option value="active">Activo / Aprobado</option>
                          <option value="rejected">Rechazado</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          disabled={key === 'id' || key === 'created_at' || key === 'manager_id' || key === 'profile_id' || key === 'team_id'}
                          value={value as string || ''}
                          onChange={(e) => setEditingDetails({ ...editingDetails, [key]: e.target.value })}
                          className={cn(
                            "w-full rounded-md border border-border bg-background px-4 py-2 text-white focus:border-primary focus:outline-none",
                            (key === 'id' || key === 'created_at' || key === 'manager_id' || key === 'profile_id' || key === 'team_id') && "bg-surface text-white/70 opacity-70 cursor-not-allowed"
                          )}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer Fijo */}
            <div className="flex shrink-0 items-center justify-between border-t border-border p-6 bg-surface z-10">
              <GmxButton
                variant="secondary"
                onClick={handleSaveDetails}
                className="gap-2 px-6"
              >
                <Save className="w-4 h-4" />
                GUARDAR CAMBIOS
              </GmxButton>

              <div className="flex gap-4">
                {selectedRequest.status === 'pending' && (
                  <>
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
                  </>
                )}
              </div>
            </div>
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
              {confirmAction.action === 'approved' ? <Check className="h-8 w-8" /> : confirmAction.action === 'deleted' ? <Trash2 className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
            </div>

            <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-2">
              ¿Estás seguro?
            </h3>
            
            <p className="text-muted-foreground mb-8">
              Estás a punto de <strong className={cn(
                confirmAction.action === 'approved' ? 'text-emerald-500' : 
                confirmAction.action === 'deleted' ? 'text-red-500' : 'text-red-500'
              )}>
                {confirmAction.action === 'approved' ? 'APROBAR' : confirmAction.action === 'deleted' ? 'ELIMINAR' : 'RECHAZAR'}
              </strong> la solicitud de:<br/>
              <span className="text-white mt-2 block font-500">{confirmAction.name}</span>
            </p>

            {confirmAction.action === 'deleted' && (
              <div className="mb-6 space-y-2 text-left">
                <label className="text-sm text-muted-foreground">Escribe la palabra <strong className="text-red-500 font-bold">SI</strong> para confirmar:</label>
                <input 
                  type="text" 
                  value={deleteConfirmationWord}
                  onChange={e => setDeleteConfirmationWord(e.target.value)}
                  className="w-full rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  placeholder="SI"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => {
                  setConfirmAction(null)
                  setDeleteConfirmationWord('')
                }}
                className="flex-1 rounded-md border border-border bg-transparent px-4 py-3 font-display text-[13px] font-600 uppercase tracking-widest text-muted-foreground transition-colors hover:text-white"
              >
                CANCELAR
              </button>
              <button 
                onClick={handleExecuteAction}
                disabled={confirmAction.action === 'deleted' && deleteConfirmationWord !== 'SI'}
                className={cn(
                  "flex-1 rounded-md px-4 py-3 font-display text-[13px] font-600 uppercase tracking-widest text-white transition-colors relative overflow-hidden clip-corner group",
                  confirmAction.action === 'approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500',
                  confirmAction.action === 'deleted' && deleteConfirmationWord !== 'SI' ? 'opacity-50 cursor-not-allowed grayscale' : ''
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
