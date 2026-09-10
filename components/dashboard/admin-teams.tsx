'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Users, MapPin, ExternalLink, Eye, Trash2, X, AlertCircle, Check, ImageIcon, FileText, Download, Save, Upload, ZoomIn, ChevronDown, UserX } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { cn, formatLocation, formatRoleTitle } from '@/lib/utils'
import { GmxButton } from '@/components/gmx-button'
import { toast } from 'sonner'

interface PlayerRoster {
  contractId: string
  playerId: string
  nickname: string
  name: string
  country: string
  discord: string
  status: string
  roles: any
}

interface PastContractRoster {
  contractId: string
  playerId: string
  nickname: string
  name: string
  roles: any
  conclusionDate: string | null
  justification?: string | null
  adminName?: string | null
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
  pastContracts: PastContractRoster[]
  rawDetails: any
}

export function AdminTeams() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: string, name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Contract termination state
  const [terminatingContract, setTerminatingContract] = useState<{
    contractId: string
    playerId: string
    playerName: string
    teamId: string
    teamName: string
  } | null>(null)
  const [terminationJustification, setTerminationJustification] = useState('')
  const [submittingTermination, setSubmittingTermination] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRegion, setFilterRegion] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const [editingLogo, setEditingLogo] = useState<string>('')

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true)

      // Cargar registros de bajas de contrato previas de administradores
      const { data: validationsData } = await supabase
        .from('validations')
        .select('*')
        .eq('type', 'baja_contrato')

      const terminationsMap = new Map<string, any>()
      if (validationsData) {
        validationsData.forEach((v: any) => {
          if (v.details?.contract_id) {
            terminationsMap.set(v.details.contract_id, v)
          }
        })
      }

      const { data } = await supabase
        .from('teams')
        .select(`
          *,
          manager:profiles!teams_manager_id_fkey(name, discord_handle),
          contracts(
            id,
            player_id,
            status,
            roles,
            conclusion_date,
            profiles!contracts_player_id_fkey(id, name, nickname, discord_handle, country)
          )
        `)
        .order('created_at', { ascending: false })
      
      if (data) {
        const formattedTeams = data.map((t: any) => {
          const activeContracts = t.contracts?.filter((c: any) => 
            c.status === 'active' || c.status === 'activo' || c.status === 'pending_player_release' || c.status === 'pending_manager_release'
          ) || []

          const roster: PlayerRoster[] = activeContracts.map((c: any) => ({
            contractId: c.id,
            playerId: c.player_id,
            name: c.profiles?.name || 'N/A',
            nickname: c.profiles?.nickname || c.profiles?.name || 'N/A',
            country: c.profiles?.country || 'N/A',
            discord: c.profiles?.discord_handle || 'N/A',
            status: c.status,
            roles: c.roles
          }))

          const pastCon = t.contracts?.filter((c: any) => 
            c.status === 'completado' || c.status === 'completed' || c.status === 'cancelado' || c.status === 'rejected'
          ) || []

          const pastContracts: PastContractRoster[] = pastCon.map((c: any) => {
            const terminationLog = terminationsMap.get(c.id)
            return {
              contractId: c.id,
              playerId: c.player_id,
              name: c.profiles?.name || 'N/A',
              nickname: c.profiles?.nickname || c.profiles?.name || 'N/A',
              roles: c.roles,
              conclusionDate: c.conclusion_date,
              justification: terminationLog?.details?.justification || null,
              adminName: terminationLog?.details?.admin_nickname || terminationLog?.details?.admin_name || terminationLog?.submitted_by || null
            }
          })

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
            pastContracts,
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
    if (selectedTeam || confirmAction || terminatingContract) {
      window.__lenis?.stop()
    } else {
      window.__lenis?.start()
    }
    return () => { window.__lenis?.start() }
  }, [selectedTeam, confirmAction, terminatingContract])

  const handleAdminTerminateContract = async () => {
    if (!terminatingContract) return
    const trimmed = terminationJustification.trim()
    if (!trimmed || trimmed.length < 5) {
      toast.error('La justificación es obligatoria (mínimo 5 caracteres).')
      return
    }

    setSubmittingTermination(true)
    toast.loading('Aplicando baja administrativa inmediata...', { id: 'admin-term' })

    try {
      // 1. Actualizar contrato a completado inmediatamente
      const { error: contractError } = await supabase
        .from('contracts')
        .update({
          status: 'completado',
          conclusion_date: new Date().toISOString()
        })
        .eq('id', terminatingContract.contractId)

      if (contractError) throw contractError

      const adminNick = user?.nickname || user?.name || user?.email || 'Administrador'

      // 2. Registrar en validations con la justificación obligatoria
      const { error: validationError } = await supabase
        .from('validations')
        .insert({
          type: 'baja_contrato',
          target_name: `Baja Administrativa: ${terminatingContract.playerName} (${terminatingContract.teamName})`,
          submitted_by: adminNick,
          status: 'approved',
          details: {
            contract_id: terminatingContract.contractId,
            player_id: terminatingContract.playerId,
            player_name: terminatingContract.playerName,
            team_id: terminatingContract.teamId,
            team_name: terminatingContract.teamName,
            justification: trimmed,
            admin_id: user?.id,
            admin_nickname: adminNick,
            admin_name: adminNick,
            conclusion_date: new Date().toISOString()
          }
        })

      if (validationError) {
        console.error('Error logging termination validation:', validationError)
      }

      toast.success('Baja Administrativa Realizada', {
        id: 'admin-term',
        description: `Se dio de baja inmediatamente a ${terminatingContract.playerName}. La justificación quedó registrada.`
      })

      // Actualizar estado local
      const movedPlayer = selectedTeam?.roster.find(p => p.contractId === terminatingContract.contractId)
      const newPastItem: PastContractRoster = {
        contractId: terminatingContract.contractId,
        playerId: terminatingContract.playerId,
        name: terminatingContract.playerName,
        nickname: movedPlayer?.nickname || terminatingContract.playerName,
        roles: movedPlayer?.roles || [],
        conclusionDate: new Date().toISOString(),
        justification: trimmed,
        adminName: user?.name || user?.email || 'Administrador'
      }

      setTeams(prev => prev.map(t => {
        if (t.id === terminatingContract.teamId) {
          return {
            ...t,
            roster: t.roster.filter(p => p.contractId !== terminatingContract.contractId),
            pastContracts: [newPastItem, ...(t.pastContracts || [])]
          }
        }
        return t
      }))

      if (selectedTeam && selectedTeam.id === terminatingContract.teamId) {
        setSelectedTeam({
          ...selectedTeam,
          roster: selectedTeam.roster.filter(p => p.contractId !== terminatingContract.contractId),
          pastContracts: [newPastItem, ...(selectedTeam.pastContracts || [])]
        })
      }

      setTerminatingContract(null)
      setTerminationJustification('')
    } catch (err: any) {
      console.error('Error in admin contract termination:', err)
      toast.error('Error al dar de baja el contrato: ' + (err?.message || 'Error inesperado'), { id: 'admin-term' })
    } finally {
      setSubmittingTermination(false)
    }
  }

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
            
            <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <select 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-2.5 pr-9 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/50 transition-colors cursor-pointer font-500"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                  <option value="banned">Baneados</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>

              <div className="relative flex-1 sm:flex-none">
                <select 
                  value={filterRegion} 
                  onChange={e => setFilterRegion(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-2.5 pr-9 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/50 transition-colors cursor-pointer font-500"
                >
                  <option value="all">Todos los Países</option>
                  {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
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
                      <div className="relative mt-1">
                        <select 
                          className={cn(
                            "w-full appearance-none rounded-lg border border-border bg-surface px-3 py-2 pr-8 text-xs font-600 uppercase focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors",
                            selectedTeam.status === 'active' ? 'text-emerald-400 border-emerald-500/30' : selectedTeam.status === 'banned' ? 'text-red-400 border-red-500/30' : 'text-amber-400 border-amber-500/30'
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
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-600 mb-1">Fundación</p>
                      <p className="text-sm font-500 text-white truncate">{selectedTeam.foundation_date}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-border pt-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-display text-xl font-700 uppercase tracking-tight text-white">Roster Actual</h4>
                  <span className="text-xs text-muted-foreground">
                    {selectedTeam.roster.length} {selectedTeam.roster.length === 1 ? 'jugador activo' : 'jugadores activos'}
                  </span>
                </div>
                
                {selectedTeam.roster.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border rounded-lg bg-background/50">
                    <p className="text-muted-foreground text-sm">Este equipo no tiene jugadores con contratos activos.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-background">
                        <tr>
                          <th className="px-4 py-3 font-600 text-muted-foreground text-xs uppercase tracking-wider">JUGADOR</th>
                          <th className="px-4 py-3 font-600 text-muted-foreground text-xs uppercase tracking-wider">ROLES</th>
                          <th className="px-4 py-3 font-600 text-muted-foreground text-xs uppercase tracking-wider">PAÍS</th>
                          <th className="px-4 py-3 font-600 text-muted-foreground text-xs uppercase tracking-wider">DISCORD</th>
                          <th className="px-4 py-3 font-600 text-muted-foreground text-xs uppercase tracking-wider text-right">ACCIÓN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-surface">
                        {selectedTeam.roster.map((p, idx) => (
                          <tr key={idx} className="transition-colors hover:bg-white/5">
                            <td className="px-4 py-3">
                              <div className="font-bold text-white tracking-wide">{p.nickname}</div>
                              {p.name && p.name !== p.nickname && (
                                <div className="text-xs text-muted-foreground">{p.name}</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(p.roles) && p.roles.length > 0 ? (
                                  p.roles.map((r: any, rIdx: number) => (
                                    <span key={rIdx} className="rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                                      {formatRoleTitle(r)}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5 text-xs">
                                <span>🌐</span> {formatLocation(p.country)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-primary text-xs">{p.discord}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  setTerminatingContract({
                                    contractId: p.contractId,
                                    playerId: p.playerId,
                                    playerName: p.nickname || p.name,
                                    teamId: selectedTeam.id,
                                    teamName: selectedTeam.name
                                  })
                                  setTerminationJustification('')
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                title="Dar de baja contrato administrativamente"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Dar de Baja</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Historial de Contratos Pasados y Bajas */}
              <div className="mt-8 border-t border-border pt-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
                    <span>Historial de Bajas y Contratos Pasados</span>
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {selectedTeam.pastContracts?.length || 0} en registro
                  </span>
                </div>

                {(!selectedTeam.pastContracts || selectedTeam.pastContracts.length === 0) ? (
                  <div className="text-center py-6 border border-dashed border-border rounded-lg bg-background/50">
                    <p className="text-muted-foreground text-xs">No hay registro de contratos anteriores o dados de baja en este equipo.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {selectedTeam.pastContracts.map((past, pIdx) => (
                      <div key={pIdx} className="rounded-lg border border-border/80 bg-background/60 p-3.5 flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white">{past.nickname || past.name}</span>
                            <div className="flex gap-1">
                              {Array.isArray(past.roles) && past.roles.map((r: any, rIdx: number) => (
                                <span key={rIdx} className="rounded bg-white/5 border border-white/10 px-1.5 py-0.2 text-[10px] text-muted-foreground">
                                  {formatRoleTitle(r)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {past.conclusionDate ? `Baja / Conclusión: ${new Date(past.conclusionDate).toLocaleDateString()}` : 'Contrato Concluido'}
                          </div>
                        </div>

                        {past.justification ? (
                          <div className="mt-1 rounded bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-300/90">
                            <div className="flex items-center justify-between font-semibold text-[11px] uppercase tracking-wider text-amber-400 mb-1">
                              <span>Justificación Administrativa</span>
                              {past.adminName && <span>Por: {past.adminName}</span>}
                            </div>
                            <p className="italic">"{past.justification}"</p>
                          </div>
                        ) : (
                          <div className="text-[11px] text-muted-foreground italic">
                            Concluido por finalización de plazo o acuerdo mutuo.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Baja de Contrato Administrativa con Justificación Obligatoria */}
      {terminatingContract && (
        <div className="fixed inset-0 z-[1020] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => !submittingTermination && setTerminatingContract(null)} 
          />
          <div className="relative w-full max-w-lg rounded-xl border border-red-500/30 bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-400 mb-4 pb-3 border-b border-border">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold uppercase tracking-tight text-white">
                  Baja Administrativa de Contrato
                </h3>
                <p className="text-xs text-muted-foreground">
                  Acción directa de administrador • Ejecución automática
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-lg border border-border bg-background/80 p-3 text-xs space-y-1">
                <div className="text-white">
                  <span className="text-muted-foreground">Jugador:</span>{' '}
                  <span className="font-semibold text-primary">{terminatingContract.playerName}</span>
                </div>
                <div className="text-white">
                  <span className="text-muted-foreground">Equipo:</span>{' '}
                  <span className="font-semibold">{terminatingContract.teamName}</span>
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200/90 leading-relaxed">
                ℹ️ <strong className="text-amber-300">Aviso:</strong> Como administrador, esta baja se aplicará <strong>automáticamente e inmediatamente</strong> sin requerir confirmación del jugador o del manager. <strong>El registro del contrato se mantendrá intacto en el historial</strong> junto con el motivo ingresado.
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white mb-1.5">
                  Motivo / Justificación de la Baja <span className="text-red-400">* (Obligatorio)</span>
                </label>
                <textarea
                  value={terminationJustification}
                  onChange={(e) => setTerminationJustification(e.target.value)}
                  placeholder="Escribe obligatoriamente el motivo de la baja administrativa (mínimo 5 caracteres)..."
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm text-white placeholder:text-muted-foreground/60 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                />
                <div className="flex justify-between items-center mt-1 text-[11px] text-muted-foreground">
                  <span>Mínimo 5 caracteres</span>
                  <span className={terminationJustification.trim().length >= 5 ? 'text-emerald-400' : 'text-amber-400'}>
                    {terminationJustification.trim().length} caracteres
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={submittingTermination}
                  onClick={() => {
                    setTerminatingContract(null)
                    setTerminationJustification('')
                  }}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-white rounded-lg border border-border hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={submittingTermination || terminationJustification.trim().length < 5}
                  onClick={handleAdminTerminateContract}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
                >
                  <UserX className="w-4 h-4" />
                  {submittingTermination ? 'Aplicando Baja...' : 'Confirmar Baja Inmediata'}
                </button>
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
