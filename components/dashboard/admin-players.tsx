'use client'

import { useState, useEffect, useMemo } from 'react'
import { User, Mail, Gamepad2, Shield, Eye, X, Phone, Calendar, Filter, Ban, CheckCircle2, Edit, Download, Save, ZoomIn, Star } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { GmxButton } from '@/components/gmx-button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Player {
  id: string
  name: string
  email: string
  contractTimeLeft: string
  team: string
  status: 'active' | 'inactive' | 'banned'
  avatar: string
  discord: string
  country: string
  created_at: string
  is_featured: boolean
  rawDetails: any
}

export function AdminPlayers() {
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTeam, setFilterTeam] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCountry, setFilterCountry] = useState<string>('all')
  
  // Modal Actions
  const [actionModal, setActionModal] = useState<{type: 'status' | 'team', player: Player} | null>(null)
  const [newStatus, setNewStatus] = useState<'active' | 'inactive' | 'banned'>('active')
  const [newTeam, setNewTeam] = useState<string>('')
  const [availableTeams, setAvailableTeams] = useState<string[]>([])
  const [editingDetails, setEditingDetails] = useState<any>(null)
  const [lightboxImage, setLightboxImage] = useState<{src: string, label: string} | null>(null)

  // Selection for Export
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function init() {
      setLoading(true)
      const { data: playersData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          avatar_url,
          country:closest_airport,
          created_at,
          player_status,
          discord_handle,
          is_featured,
          contracts(teams(name), status)
        `)
        .eq('is_player', true)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error("Error fetching players:", error)
        toast.error("Error al cargar jugadores: " + error.message)
      }

      if (playersData) {
        const formattedPlayers = playersData.map((p: any) => {
          const activeContract = p.contracts?.find((c: any) => c.status === 'active')
          let team = activeContract?.teams?.name || 'Ninguno'
          let contractTimeLeft = 'No aplica'

          if (p.player_status === 'active' && activeContract?.end_date) {
             const end = new Date(activeContract.end_date)
             const now = new Date()
             const diffTime = end.getTime() - now.getTime()
             if (diffTime > 0) {
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
               contractTimeLeft = `${diffDays} días restantes`
             } else {
               contractTimeLeft = 'Expirado'
             }
          } else if (p.player_status === 'inactive' || p.player_status === 'banned') {
             team = 'Ninguno'
             contractTimeLeft = 'No aplica'
          }

          return {
            id: p.id,
            name: p.name,
            email: p.email || 'Sin correo',
            contractTimeLeft,
            team,
            status: p.player_status || 'inactive',
            avatar: p.avatar_url,
            discord: p.discord_handle,
            country: p.country,
            created_at: p.created_at,
            is_featured: p.is_featured || false,
            rawDetails: p
          }
        })
        setPlayers(formattedPlayers)
      }

      const { data: teamsData } = await supabase.from('teams').select('name')
      if (teamsData) {
        setAvailableTeams(teamsData.map(t => t.name))
      }

      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (selectedPlayer || actionModal) {
      window.__lenis?.stop()
    } else {
      window.__lenis?.start()
    }
    return () => { window.__lenis?.start() }
  }, [selectedPlayer, actionModal])

  const handleUpdateStatus = async () => {
    if (!actionModal) return
    const { error } = await supabase.from('profiles').update({ player_status: newStatus }).eq('id', actionModal.player.id)
    if (!error) {
      setPlayers(prev => prev.map(p => p.id === actionModal.player.id ? { ...p, status: newStatus } : p))
      setSelectedPlayer(prev => prev?.id === actionModal.player.id ? { ...prev, status: newStatus } : prev)
    }
    setActionModal(null)
  }

  const handleToggleFeatured = async (playerId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    const { error } = await supabase.from('profiles').update({ is_featured: newStatus }).eq('id', playerId)
    if (!error) {
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, is_featured: newStatus } : p))
      toast.success(newStatus ? 'Marcado como Jugador Destacado' : 'Ya no es Jugador Destacado')
    } else {
      toast.error('Error al actualizar el estado destacado')
    }
  }

  const handleUpdateTeam = async () => {
    // Kept for backward compatibility but actual team changes happen via contracts
    setActionModal(null)
  }

  const handleSaveDetails = async () => {
    if (!selectedPlayer || !editingDetails) return
    const cleanDetails = { ...editingDetails }
    delete cleanDetails.contracts
    delete cleanDetails.created_at
    delete cleanDetails.id

    const { error } = await supabase.from('profiles').update(cleanDetails).eq('id', selectedPlayer.id)
    if (!error) {
      alert('Datos del jugador actualizados correctamente.')
      setPlayers(prev => prev.map(p => p.id === selectedPlayer.id ? { ...p, rawDetails: { ...p.rawDetails, ...cleanDetails }, name: cleanDetails.name, discord: cleanDetails.discord_handle } : p))
      setSelectedPlayer(null)
    } else {
      alert('Error guardando los datos.')
    }
  }

  const exportToCSV = () => {
    const toExport = players.filter(p => selectedIds.has(p.id))
    if (toExport.length === 0) return alert('Selecciona al menos un jugador para exportar.')

    const headers = ['Nombre', 'Nickname', 'Discord', 'Email', 'Pais', 'Estado', 'Equipo', 'ID Pasaporte', 'Link Pasaporte', 'Link ID']
    const csvContent = [
      headers.join(','),
      ...toExport.map(p => {
        const d = p.rawDetails
        return [
          `"${p.name}"`,
          `"${d.nickname || ''}"`,
          `"${p.discord || ''}"`,
          `"${p.email}"`,
          `"${p.country || ''}"`,
          `"${p.status}"`,
          `"${p.team}"`,
          `"${d.passport_number || ''}"`,
          `"${d.passport_photo_url || ''}"`,
          `"${d.id_photo_url || ''}"`
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'jugadores_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Unique values for filters
  const uniqueTeams = useMemo(() => Array.from(new Set(players.map(p => p.team).filter(Boolean))), [players])
  const uniqueCountries = useMemo(() => Array.from(new Set(players.map(p => p.country).filter(Boolean))), [players])

  const filteredAndSortedPlayers = useMemo(() => {
    let result = players.filter(p => {
      if (filterTeam !== 'all' && p.team !== filterTeam) return false
      if (filterStatus !== 'all' && p.status !== filterStatus) return false
      if (filterCountry !== 'all' && p.country !== filterCountry) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return p.name.toLowerCase().includes(q) || 
               p.email.toLowerCase().includes(q) || 
               (p.discord && p.discord.toLowerCase().includes(q))
      }
      return true
    })

    // Custom sorting: active > inactive > banned, then by date descending
    const statusWeight = { active: 3, inactive: 2, banned: 1 }
    result.sort((a, b) => {
      const weightA = statusWeight[a.status] || 0
      const weightB = statusWeight[b.status] || 0
      if (weightA !== weightB) {
        return weightB - weightA
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return result
  }, [players, filterTeam, filterStatus, filterCountry, searchQuery])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        
        {/* Header & Filters */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white shrink-0">
              Jugadores
            </h2>
            {selectedIds.size > 0 && (
              <GmxButton onClick={exportToCSV} className="h-9 px-3 gap-2 text-xs" variant="secondary">
                <Download className="w-3.5 h-3.5" />
                Exportar ({selectedIds.size})
              </GmxButton>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto">
            <input 
              type="text" 
              placeholder="Buscar por nombre, email o discord..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 rounded-md border border-border bg-background px-4 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            
            <div className="flex gap-3 w-full sm:w-auto">
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                className="flex-1 sm:flex-none rounded-md border border-border bg-background px-3 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Todos los Estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="banned">Baneados</option>
              </select>

              <select 
                value={filterTeam} 
                onChange={e => setFilterTeam(e.target.value)}
                className="flex-1 sm:flex-none rounded-md border border-border bg-background px-3 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Todos los Equipos</option>
                {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <select 
                value={filterCountry} 
                onChange={e => setFilterCountry(e.target.value)}
                className="flex-1 sm:flex-none rounded-md border border-border bg-background px-3 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Todos los Países</option>
                {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground animate-pulse">Cargando jugadores...</p>
          </div>
        ) : filteredAndSortedPlayers.length === 0 ? (
          <div className="flex justify-center items-center py-12 border border-dashed border-border rounded-lg bg-background/50">
            <p className="text-muted-foreground">No hay jugadores que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAndSortedPlayers.map(player => (
              <div key={player.id} className="relative flex flex-col rounded-lg border border-border bg-background p-5 hover:border-primary/50 transition-colors">
                <div className="absolute top-4 right-4 z-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(player.id)}
                    onChange={(e) => {
                      const newSet = new Set(selectedIds)
                      if (e.target.checked) newSet.add(player.id)
                      else newSet.delete(player.id)
                      setSelectedIds(newSet)
                    }}
                    className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
                  />
                </div>
                <div className="flex items-start gap-4">
                  <img 
                    src={player.avatar || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                    alt={player.name} 
                    className={cn(
                      "h-12 w-12 rounded-full border border-border object-cover",
                      player.status === 'banned' ? 'grayscale opacity-50' : ''
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={cn("font-600 truncate", player.status === 'banned' ? 'text-red-500 line-through' : 'text-white')}>{player.name}</h3>
                      {player.status === 'active' && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Activo" />
                      )}
                      {player.status === 'inactive' && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-yellow-500 shrink-0" title="Inactivo" />
                      )}
                      {player.status === 'banned' && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-red-500 shrink-0" title="Baneado" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
                      <span className="truncate">{player.discord || 'Sin Discord'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate">{player.team}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate">{player.contractTimeLeft}</span>
                    </div>
                  </div>
                  
                  {/* Acciones Rápidas */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleToggleFeatured(player.id, player.is_featured)}
                      title={player.is_featured ? "Quitar de Destacados" : "Marcar como Destacado"}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded border transition-colors",
                        player.is_featured 
                          ? "border-amber-500/50 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" 
                          : "border-border bg-surface text-muted-foreground hover:text-amber-500 hover:border-amber-500/50"
                      )}
                    >
                      <Star className={cn("h-3 w-3", player.is_featured && "fill-current")} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPlayer(player)
                        setEditingDetails(player.rawDetails)
                      }}
                      title="Ver Detalles Completos"
                      className="flex-1 flex h-8 items-center justify-center gap-1 rounded bg-surface border border-border text-xs font-500 text-white hover:bg-white/5 transition-colors"
                    >
                      <Eye className="h-3 w-3" /> Detalles
                    </button>
                    <button
                      onClick={() => {
                        setActionModal({ type: 'status', player })
                        setNewStatus(player.status)
                      }}
                      title="Cambiar Estado"
                      className="flex h-8 w-8 items-center justify-center rounded border border-border bg-surface text-muted-foreground hover:text-white transition-colors"
                    >
                      <Ban className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details / Edit Modal */}
      {selectedPlayer && editingDetails && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedPlayer(null)} />
          <div className="relative flex flex-col w-full max-w-2xl h-[90vh] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex shrink-0 items-center justify-between border-b border-border p-6 bg-surface z-10">
              <div>
                <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Editar Jugador
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedPlayer.name}</p>
              </div>
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="text-muted-foreground hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body con Scroll */}
            <div data-lenis-prevent data-modal-scrollbody className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6">
              <div className="grid sm:grid-cols-2 gap-6">
                {Object.entries(editingDetails).map(([key, value]) => {
                  if (key === 'contracts') return null // Do not show raw contracts object
                  const isImage = typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image')) && !value.endsWith('.pdf');
                  const isBoolean = typeof value === 'boolean';
                  
                  return (
                    <div key={key} className={cn("space-y-2", isImage ? "col-span-full sm:col-span-1" : "")}>
                      <label className="text-xs font-600 uppercase tracking-widest text-primary">
                        {key.replace(/([A-Z])/g, ' $1').trim().replace(/_/g, ' ')}
                      </label>

                      {isImage ? (
                        <div className="rounded-lg border border-border bg-background p-2">
                          <button 
                            onClick={() => setLightboxImage({ src: value as string, label: key })}
                            className="block w-full aspect-video relative rounded-md overflow-hidden bg-white/5 group border border-border/50 cursor-zoom-in"
                          >
                            <img src={value as string} alt={key} className="absolute inset-0 w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                              <ZoomIn className="w-6 h-6 text-white" />
                              <span className="text-xs font-500 text-white uppercase">Ver</span>
                            </div>
                          </button>
                          <input 
                            type="text" 
                            value={value as string} 
                            onChange={(e) => setEditingDetails({ ...editingDetails, [key]: e.target.value })}
                            className="w-full mt-2 text-xs rounded border border-border bg-surface px-2 py-1 text-white focus:border-primary focus:outline-none"
                            placeholder="URL de imagen..."
                          />
                        </div>
                      ) : isBoolean ? (
                        <select
                          className="w-full rounded-md border border-border bg-background px-4 py-2 text-white focus:border-primary focus:outline-none"
                          value={value ? 'true' : 'false'}
                          onChange={(e) => setEditingDetails({ ...editingDetails, [key]: e.target.value === 'true' })}
                        >
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      ) : key === 'player_status' ? (
                        <select
                          className="w-full rounded-md border border-border bg-background px-4 py-2 text-white focus:border-primary focus:outline-none"
                          value={value as string || 'pending'}
                          onChange={(e) => setEditingDetails({ ...editingDetails, [key]: e.target.value })}
                        >
                          <option value="active">Activo</option>
                          <option value="inactive">Inactivo</option>
                          <option value="banned">Baneado</option>
                          <option value="pending">Pendiente</option>
                          <option value="rejected">Rechazado</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          disabled={key === 'id' || key === 'created_at'}
                          value={value as string || ''}
                          onChange={(e) => setEditingDetails({ ...editingDetails, [key]: e.target.value })}
                          className={cn(
                            "w-full rounded-md border border-border bg-background px-4 py-2 text-white focus:border-primary focus:outline-none",
                            (key === 'id' || key === 'created_at') && "bg-surface text-white/70 opacity-70 cursor-not-allowed"
                          )}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer Fijo */}
            <div className="flex shrink-0 items-center justify-end border-t border-border p-6 bg-surface z-10">
              <GmxButton
                variant="secondary"
                onClick={handleSaveDetails}
                className="gap-2 px-6"
              >
                <Save className="w-4 h-4" />
                GUARDAR CAMBIOS
              </GmxButton>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal (Status / Team Edit) */}
      {actionModal && (
        <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActionModal(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white mb-4">
              {actionModal.type === 'status' ? 'Modificar Estado' : 'Asignar Equipo'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Modificando al jugador: <strong className="text-white">{actionModal.player.name}</strong>
            </p>

            {actionModal.type === 'status' ? (
              <div className="space-y-4 mb-8">
                <label className="text-sm font-500 text-white">Nuevo Estado</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full rounded-md border border-border bg-background px-4 py-3 text-white focus:border-primary focus:outline-none"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="banned">Baneado</option>
                </select>
                {newStatus === 'banned' && (
                  <p className="text-xs text-red-400">El jugador no podrá iniciar sesión si es baneado.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                <label className="text-sm font-500 text-white">Seleccionar Equipo</label>
                <select
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-4 py-3 text-white focus:border-primary focus:outline-none"
                >
                  <option value="">Ninguno / Sin Equipo</option>
                  {availableTeams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => setActionModal(null)}
                className="flex-1 rounded-md border border-border bg-transparent px-4 py-3 font-display text-[13px] font-600 uppercase tracking-widest text-muted-foreground transition-colors hover:text-white"
              >
                CANCELAR
              </button>
              <GmxButton onClick={actionModal.type === 'status' ? handleUpdateStatus : handleUpdateTeam} className="flex-1 px-4 py-3">
                GUARDAR CAMBIOS
              </GmxButton>
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
