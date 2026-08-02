'use client'

import { useState, useEffect, useMemo } from 'react'
import { User, Mail, Gamepad2, Shield, Eye, X, Phone, Calendar, Filter, Ban, CheckCircle2, Edit } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { GmxButton } from '@/components/gmx-button'
import { cn } from '@/lib/utils'

interface Player {
  id: string
  name: string
  email: string
  role: string
  team: string
  status: 'active' | 'inactive' | 'banned'
  avatar: string
  phone: string
  game_id: string
  discord: string
  country: string
  created_at: string
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

  useEffect(() => {
    async function init() {
      setLoading(true)
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (playersData) {
        setPlayers(playersData as Player[])
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
    const { error } = await supabase.from('players').update({ status: newStatus }).eq('id', actionModal.player.id)
    if (!error) {
      setPlayers(prev => prev.map(p => p.id === actionModal.player.id ? { ...p, status: newStatus } : p))
      setSelectedPlayer(prev => prev?.id === actionModal.player.id ? { ...prev, status: newStatus } : prev)
    }
    setActionModal(null)
  }

  const handleUpdateTeam = async () => {
    if (!actionModal) return
    const { error } = await supabase.from('players').update({ team: newTeam }).eq('id', actionModal.player.id)
    if (!error) {
      setPlayers(prev => prev.map(p => p.id === actionModal.player.id ? { ...p, team: newTeam } : p))
      setSelectedPlayer(prev => prev?.id === actionModal.player.id ? { ...prev, team: newTeam } : prev)
    }
    setActionModal(null)
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
          <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white shrink-0">
            Jugadores
          </h2>
          
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
              <div key={player.id} className="flex flex-col rounded-lg border border-border bg-background p-5 hover:border-primary/50 transition-colors">
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
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{player.email}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate">{player.team || 'Sin Equipo'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Gamepad2 className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate">{player.role || 'Sin Rol'}</span>
                    </div>
                  </div>
                  
                  {/* Acciones Rápidas */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => setSelectedPlayer(player)}
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
                    <button
                      onClick={() => {
                        setActionModal({ type: 'team', player })
                        setNewTeam(player.team || '')
                      }}
                      title="Modificar Equipo"
                      className="flex h-8 w-8 items-center justify-center rounded border border-border bg-surface text-muted-foreground hover:text-white transition-colors"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedPlayer(null)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="relative h-24 bg-gradient-to-r from-primary/20 to-transparent">
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-8 pb-8">
              <div className="-mt-12 mb-4 flex justify-between items-end">
                <img 
                  src={selectedPlayer.avatar || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                  alt={selectedPlayer.name} 
                  className={cn("h-24 w-24 rounded-full border-4 border-surface object-cover bg-surface", selectedPlayer.status === 'banned' ? 'grayscale' : '')}
                />
                {selectedPlayer.status === 'active' ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-600 uppercase text-emerald-500 ring-1 ring-inset ring-emerald-500/20 mb-2">
                    Activo
                  </span>
                ) : selectedPlayer.status === 'inactive' ? (
                  <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-600 uppercase text-yellow-500 ring-1 ring-inset ring-yellow-500/20 mb-2">
                    Inactivo
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-xs font-600 uppercase text-red-500 ring-1 ring-inset ring-red-500/20 mb-2">
                    Baneado
                  </span>
                )}
              </div>

              <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-1">
                {selectedPlayer.name}
              </h3>
              <p className="text-primary font-500 text-sm mb-6 flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" /> {selectedPlayer.role || 'Sin Rol'}
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-600 mb-1">Equipo</p>
                    <p className="text-sm font-500 text-white truncate">{selectedPlayer.team || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-600 mb-1">ID Juego</p>
                    <p className="text-sm font-500 text-white truncate">{selectedPlayer.game_id || 'N/A'}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background p-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-white">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{selectedPlayer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{selectedPlayer.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white">
                    <svg className="w-4 h-4 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
                    <span className="truncate">{selectedPlayer.discord || 'N/A'}</span>
                  </div>
                  {selectedPlayer.country && (
                    <div className="flex items-center gap-3 text-sm text-white border-t border-border pt-3 mt-3">
                      <span className="text-muted-foreground w-4 flex justify-center text-xs">🌐</span>
                      <span className="truncate">{selectedPlayer.country}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-white border-t border-border pt-3 mt-3">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="truncate">Registrado: {new Date(selectedPlayer.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
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
    </div>
  )
}
