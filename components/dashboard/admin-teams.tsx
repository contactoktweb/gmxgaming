'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Users, MapPin, ExternalLink, Eye, Trash2, X, AlertCircle, Check, ImageIcon, FileText, Download, Save, Upload, ZoomIn } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'
import { GmxButton } from '@/components/gmx-button'
import { toast } from 'sonner'

interface PlayerRoster {
  nickname: string
  name: string
  country: string
  discord: string
}

interface Team {
  id: string
  name: string
  captain: string
  managerDiscord: string
  region: string
  logo: string
  status: 'active' | 'inactive' | 'banned' | string
  points: number
  foundation_date: string
  roster: PlayerRoster[]
  rawDetails: any
}

export function AdminTeams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: string, name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRegion, setFilterRegion] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const [editingLogo, setEditingLogo] = useState<string>('')

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true)
      const { data } = await supabase
        .from('teams')
        .select(`
          *,
          manager:profiles!teams_manager_id_fkey(name, discord_handle),
          contracts(status, profiles!contracts_player_id_fkey(name, nickname, discord_handle, country:closest_airport))
        `)
        .order('created_at', { ascending: false })
      
      if (data) {
        const formattedTeams = data.map((t: any) => {
          const activeContracts = t.contracts?.filter((c: any) => c.status === 'active') || []
          const roster = activeContracts.map((c: any) => ({
            name: c.profiles?.name || 'N/A',
            nickname: c.profiles?.nickname || c.profiles?.name || 'N/A',
            country: c.profiles?.country || 'N/A',
            discord: c.profiles?.discord_handle || 'N/A'
          }))

          return {
            id: t.id,
            name: t.name,
            captain: t.manager?.name || 'Sin Manager',
            managerDiscord: t.manager?.discord_handle || 'Sin Discord',
            region: t.country || 'Sin Región',
            logo: t.logo_url || '',
            status: t.status || 'inactive',
            points: 0,
            foundation_date: new Date(t.created_at).toLocaleDateString(),
            roster,
            rawDetails: t
          }
        })
        setTeams(formattedTeams)
      }
      setLoading(false)
    }
    fetchTeams()
  }, [])

  useEffect(() => {
    if (selectedTeam || confirmAction) {
      window.__lenis?.stop()
    } else {
      window.__lenis?.start()
    }
    return () => { window.__lenis?.start() }
  }, [selectedTeam, confirmAction])

  const handleDelete = async () => {
    if (confirmAction) {
      await supabase.from('teams').delete().eq('id', confirmAction.id)
      setTeams(prev => prev.filter(t => t.id !== confirmAction.id))
      setConfirmAction(null)
    }
  }

  const handleUpdateLogo = async () => {
    if (!selectedTeam || !editingLogo) return
    const { error } = await supabase.from('teams').update({ logo_url: editingLogo }).eq('id', selectedTeam.id)
    if (!error) {
      setTeams(prev => prev.map(t => t.id === selectedTeam.id ? { ...t, logo: editingLogo } : t))
      setSelectedTeam({ ...selectedTeam, logo: editingLogo })
      alert('Logo actualizado correctamente.')
    } else {
      alert('Error al actualizar el logo.')
    }
  }

  // Unique regions
  const uniqueRegions = Array.from(new Set(teams.map(t => t.region).filter(Boolean)))

  // Filter and Sort
  const filteredAndSortedTeams = (() => {
    let result = teams.filter(t => {
      if (filterRegion !== 'all' && t.region !== filterRegion) return false
      if (filterStatus !== 'all' && t.status !== filterStatus) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return t.name.toLowerCase().includes(q)
      }
      return true
    })

    const statusWeight: Record<string, number> = { active: 3, inactive: 2, banned: 1 }
    result.sort((a, b) => {
      const weightA = statusWeight[a.status] || 0
      const weightB = statusWeight[b.status] || 0
      if (weightA !== weightB) {
        return weightB - weightA
      }
      return new Date(b.foundation_date).getTime() - new Date(a.foundation_date).getTime()
    })

    return result
  })()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        
        {/* Header & Filters */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white">
              Equipos
            </h2>
            <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-600 text-primary">
              {filteredAndSortedTeams.length} Total
            </span>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto">
            <input 
              type="text" 
              placeholder="Buscar por nombre de equipo..." 
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
                value={filterRegion} 
                onChange={e => setFilterRegion(e.target.value)}
                className="flex-1 sm:flex-none rounded-md border border-border bg-background px-3 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Todos los Países</option>
                {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground animate-pulse">Cargando equipos...</p>
          </div>
        ) : filteredAndSortedTeams.length === 0 ? (
          <div className="flex justify-center items-center py-12 border border-dashed border-border rounded-lg bg-background/50">
            <p className="text-muted-foreground">No hay equipos que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedTeams.map(team => (
              <div key={team.id} className="group relative flex flex-col items-center rounded-lg border border-border bg-background p-6 text-center transition-colors hover:border-primary/50">
                
                <div className="absolute right-3 top-3 flex flex-col gap-2">
                  <button 
                    onClick={() => {
                      setSelectedTeam(team)
                      setEditingLogo(team.logo)
                    }}
                    title="Ver Detalles"
                    className="p-2 text-muted-foreground hover:text-white transition-colors bg-surface border border-border rounded-md hover:border-primary"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setConfirmAction({ id: team.id, name: team.name })}
                    title="Eliminar Equipo"
                    className="p-2 text-muted-foreground hover:text-red-500 transition-colors bg-surface border border-border rounded-md hover:border-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <img 
                  src={team.logo || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                  alt={team.name} 
                  className="mb-4 h-20 w-20 rounded-full object-cover ring-4 ring-surface"
                />
                <h3 className="mb-1 font-display text-lg font-700 uppercase text-white group-hover:text-primary transition-colors">
                  {team.name}
                </h3>
                
                <div className="mb-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    <span>{team.captain || 'Sin Capitán'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{team.region || 'Sin Región'}</span>
                  </div>
                </div>

                <div className="mt-auto flex w-full items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-1.5 text-sm font-500 text-white">
                    <Users className="h-4 w-4 text-primary" />
                    {team.status === 'active' ? (
                       <span className="text-emerald-500">Activo</span>
                    ) : team.status === 'banned' ? (
                       <span className="text-red-500">Baneado</span>
                    ) : (
                       <span className="text-yellow-500">Inactivo</span>
                    )}
                  </div>
                  <button onClick={() => { setSelectedTeam(team); setEditingLogo(team.logo); }} className="text-xs font-500 text-primary hover:text-white transition-colors flex items-center gap-1">
                    Ver Detalles <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedTeam(null)} />
          <div className="relative flex flex-col w-full max-w-3xl h-[90vh] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex shrink-0 items-center justify-between border-b border-border p-6 bg-surface z-10">
              <div>
                <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Detalles del Equipo
                </h3>
              </div>
              <button 
                onClick={() => setSelectedTeam(null)}
                className="text-muted-foreground hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body con Scroll */}
            <div data-lenis-prevent data-modal-scrollbody className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6">
              
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="flex flex-col items-center shrink-0">
                  <img 
                    src={selectedTeam.logo || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                    alt={selectedTeam.name} 
                    className="h-32 w-32 rounded-full border-4 border-surface object-cover bg-surface mb-4"
                  />
                  
                  <div className="w-full mt-4">
                    <label className="text-xs text-muted-foreground font-600 uppercase mb-1 block">Actualizar Logo</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          toast.loading('Subiendo logo...', { id: 'upload-logo' });
                          const fileExt = file.name.split('.').pop();
                          const fileName = `team-logo-${Date.now()}.${fileExt}`;
                          const { error: uploadError, data } = await supabase.storage.from('teams').upload(fileName, file);
                          if (uploadError) {
                            toast.error('Error al subir la imagen', { id: 'upload-logo' });
                            return;
                          }
                          const { data: publicUrlData } = supabase.storage.from('teams').getPublicUrl(data.path);
                          const newUrl = publicUrlData.publicUrl;
                          
                          const { error: updateError } = await supabase.from('teams').update({ logo_url: newUrl }).eq('id', selectedTeam.id);
                          
                          if (updateError) {
                            toast.error('Error al guardar en base de datos', { id: 'upload-logo' });
                          } else {
                            setTeams(prev => prev.map(t => t.id === selectedTeam.id ? { ...t, logo: newUrl } : t));
                            setSelectedTeam({ ...selectedTeam, logo: newUrl });
                            toast.success('Logo actualizado', { id: 'upload-logo' });
                          }
                        }
                      }}
                      className="w-full text-xs text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-display text-3xl font-700 uppercase tracking-tight text-white mb-6">
                    {selectedTeam.name}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-600 mb-1">Manager</p>
                      <p className="text-sm font-500 text-white truncate">{selectedTeam.captain}</p>
                      <p className="text-xs text-primary truncate mt-1">Discord: {selectedTeam.managerDiscord}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-600 mb-1">Región</p>
                      <p className="text-sm font-500 text-white truncate">{selectedTeam.region}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-4 flex flex-col justify-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-600 mb-1">Estatus</p>
                      <select 
                        className={cn(
                          "w-full rounded border border-border bg-surface px-2 py-1 text-sm font-500 uppercase focus:border-primary focus:outline-none cursor-pointer mt-1",
                          selectedTeam.status === 'active' ? 'text-emerald-500' : selectedTeam.status === 'banned' ? 'text-red-500' : 'text-yellow-500'
                        )}
                        value={selectedTeam.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          const { error } = await supabase.from('teams').update({ status: newStatus }).eq('id', selectedTeam.id);
                          if (!error) {
                            setTeams(prev => prev.map(t => t.id === selectedTeam.id ? { ...t, status: newStatus } : t));
                            setSelectedTeam({ ...selectedTeam, status: newStatus });
                            toast.success('Estado actualizado correctamente');
                          } else {
                            toast.error('Error al actualizar el estado');
                          }
                        }}
                      >
                        <option value="active" className="text-emerald-500">Activo</option>
                        <option value="inactive" className="text-yellow-500">Inactivo</option>
                        <option value="banned" className="text-red-500">Baneado</option>
                      </select>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-600 mb-1">Fundación</p>
                      <p className="text-sm font-500 text-white truncate">{selectedTeam.foundation_date}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-border pt-8">
                <h4 className="font-display text-xl font-700 uppercase tracking-tight text-white mb-4">Roster Actual</h4>
                
                {selectedTeam.roster.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border rounded-lg bg-background/50">
                    <p className="text-muted-foreground text-sm">Este equipo no tiene jugadores con contratos activos.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-background">
                        <tr>
                          <th className="px-4 py-3 font-600 text-muted-foreground">NICKNAME</th>
                          <th className="px-4 py-3 font-600 text-muted-foreground">PAÍS</th>
                          <th className="px-4 py-3 font-600 text-muted-foreground">DISCORD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-surface">
                        {selectedTeam.roster.map((p, idx) => (
                          <tr key={idx} className="transition-colors hover:bg-white/5">
                            <td className="px-4 py-3 font-500 text-white">{p.nickname}</td>
                            <td className="px-4 py-3 text-muted-foreground flex items-center gap-2">
                              <span className="text-[10px]">🌐</span> {p.country}
                            </td>
                            <td className="px-4 py-3 text-primary">{p.discord}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
            
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-6 bg-red-500/10 text-red-500">
              <AlertCircle className="h-8 w-8" />
            </div>

            <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-2">
              ¿Eliminar Equipo?
            </h3>
            
            <p className="text-muted-foreground mb-8">
              Estás a punto de eliminar al equipo:<br/>
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
                onClick={handleDelete}
                className="flex-1 rounded-md px-4 py-3 font-display text-[13px] font-600 uppercase tracking-widest text-white transition-colors relative overflow-hidden clip-corner group bg-red-600 hover:bg-red-500"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  ELIMINAR <Trash2 className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
