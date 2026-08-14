'use client'

import { useState, useEffect } from 'react'
import { Shield, ShieldAlert, History, Calendar, Settings, Save, X, Loader2, Users, Check, Clock, UserCheck, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { toast } from 'sonner'
import { GmxButton } from '@/components/gmx-button'
import { cn, formatRoleTitle, formatRolesList, getTeamSlug } from '@/lib/utils'

const DEFAULT_COUNTRIES = [
  "Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Cuba", 
  "Ecuador", "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua", 
  "Panamá", "Paraguay", "Perú", "Puerto Rico", "República Dominicana", 
  "Uruguay", "Venezuela"
]

export function PlayerTeams() {
  const { user } = useAuth()
  const [activeTeam, setActiveTeam] = useState<any>(null)
  const [pastTeams, setPastTeams] = useState<any[]>([])
  const [managedTeams, setManagedTeams] = useState<any[]>([])
  const [teamContracts, setTeamContracts] = useState<any[]>([])
  const [teamValidations, setTeamValidations] = useState<Record<string, any>>({})
  const [countries, setCountries] = useState<string[]>(DEFAULT_COUNTRIES)
  const [loading, setLoading] = useState(true)

  const [editingTeam, setEditingTeam] = useState<any>(null)
  const [savingTeam, setSavingTeam] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function fetchTeams() {
      if (!user) return

      // Cargar países disponibles desde app_settings (administración)
      const { data: settingsData } = await supabase.from('app_settings').select('*')
      if (settingsData && settingsData.length > 0) {
        const countryConfig = settingsData.find((s: any) => s.id === 'enabled_countries')
        if (countryConfig && Array.isArray(countryConfig.value) && countryConfig.value.length > 0) {
          setCountries(countryConfig.value as string[])
        }
      }
      
      // 1. Fetch player contracts (teams they play for)
      const { data } = await supabase
        .from('contracts')
        .select(`
          id, 
          status, 
          start_date, 
          end_date, 
          teams (id, name, logo_url, country)
        `)
        .eq('player_id', user.id)
        .order('start_date', { ascending: false })

      if (data) {
        const active = data.find(c => c.status === 'activo' || c.status === 'active' || c.status === 'pending_manager' || c.status === 'pendiente')
        if (active) setActiveTeam(active)
        
        const past = data.filter(c => c.status === 'completado' || c.status === 'cancelado' || c.status === 'rejected')
        setPastTeams(past)
      }

      // 2. Fetch teams managed by user
      const { data: managed } = await supabase
        .from('teams')
        .select('*')
        .eq('manager_id', user.id)
        .order('created_at', { ascending: false })

      if (managed && managed.length > 0) {
        setManagedTeams(managed)

        // 3. Fetch contract requests sent to these managed teams
        const managedIds = managed.map(t => t.id)
        const { data: contractsForTeams } = await supabase
          .from('contracts')
          .select(`
            *,
            profiles (id, name, nickname, avatar_url),
            teams (id, name, logo_url)
          `)
          .in('team_id', managedIds)
          .order('created_at', { ascending: false })

        if (contractsForTeams) {
          setTeamContracts(contractsForTeams)
        }

        // 4. Fetch team modification requests / validations
        const { data: valData } = await supabase
          .from('validations')
          .select('*')
          .or(`type.eq.modificacion,type.eq.equipo`)
          .order('created_at', { ascending: false })

        if (valData) {
          const valMap: Record<string, any> = {}
          valData.forEach((v: any) => {
            const teamId = v.details?.team_id || (v.type === 'equipo' ? v.id : null)
            if (teamId && managedIds.includes(teamId) && !valMap[teamId]) {
              valMap[teamId] = v
            }
          })
          setTeamValidations(valMap)
        }
      }

      setLoading(false)
    }
    fetchTeams()
  }, [user])

  const handleOpenEdit = (team: any) => {
    const val = teamValidations[team.id]
    const isPending = val?.status === 'pending'
    const isRejected = val?.status === 'rejected'
    const details = (isPending || isRejected) ? val?.details : null

    setEditingTeam({
      id: team.id,
      name: details?.name || team.name || '',
      tag: details?.tag || team.tag || '',
      country: details?.country || team.country || '',
      logo_url: details?.logo_url || team.logo_url || '',
      originalTeam: team,
      validation: val
    })
  }

  const handleUpdateTeam = async () => {
    if (!editingTeam) return
    setSavingTeam(true)

    try {
      // Todas las modificaciones de equipo enviadas desde el panel de líder pasan por aprobación
      const payloadDetails = {
        team_id: editingTeam.id,
        manager_id: user?.id,
        name: editingTeam.name,
        tag: editingTeam.tag,
        country: editingTeam.country,
        logo_url: editingTeam.logo_url,
        original_name: editingTeam.originalTeam?.name || '',
        original_tag: editingTeam.originalTeam?.tag || '',
        original_country: editingTeam.originalTeam?.country || '',
        original_logo: editingTeam.originalTeam?.logo_url || ''
      }

      let valError = null
      const existingVal = editingTeam.validation

      if (existingVal?.id && existingVal.status === 'pending') {
        // Actualizar solicitud existente
        const { error } = await supabase.from('validations').update({
          target_name: `${editingTeam.name} (Modificación de Equipo)`,
          status: 'pending',
          details: payloadDetails
        }).eq('id', existingVal.id)
        valError = error

        if (!error) {
          setTeamValidations(prev => ({
            ...prev,
            [editingTeam.id]: {
              ...existingVal,
              status: 'pending',
              details: payloadDetails
            }
          }))
        }
      } else {
        // Eliminar solicitudes antiguas ya procesadas (approved/rejected) para evitar conflictos
        await supabase
          .from('validations')
          .delete()
          .eq('type', 'modificacion')
          .in('status', ['approved', 'rejected'])
          .filter('details->>team_id', 'eq', editingTeam.id)

        // Crear nueva solicitud de modificación
        const { data, error } = await supabase.from('validations').insert({
          type: 'modificacion',
          target_name: `${editingTeam.name} (Modificación de Equipo)`,
          submitted_by: user?.name || user?.email || 'Líder de Equipo',
          status: 'pending',
          details: payloadDetails
        }).select().single()
        valError = error

        if (data) {
          setTeamValidations(prev => ({
            ...prev,
            [editingTeam.id]: data
          }))
        }
      }

      if (valError) throw valError

      toast.success(existingVal?.status === 'pending' ? 'Solicitud Actualizada' : 'Solicitud Enviada a Aprobación', {
        description: 'Tus cambios fueron enviados a los administradores para su revisión.'
      })
      setEditingTeam(null)
    } catch (err: any) {
      console.error('Error updating team:', err)
      toast.error('Error al guardar solicitud: ' + (err.message || 'Intenta de nuevo'))
    } finally {
      setSavingTeam(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editingTeam) {
      const file = e.target.files[0]
      toast.loading('Subiendo logo...', { id: 'logo-upload' })
      const fileExt = file.name.split('.').pop()
      const fileName = `team-logo-${editingTeam.id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError, data } = await supabase.storage.from('teams').upload(fileName, file)
      if (uploadError) {
        toast.error('Error al subir la imagen', { id: 'logo-upload' })
        return
      }
      const { data: publicUrlData } = supabase.storage.from('teams').getPublicUrl(data.path)
      setEditingTeam({ ...editingTeam, logo_url: publicUrlData.publicUrl })
      toast.success('Logo subido, no olvides guardar los cambios.', { id: 'logo-upload' })
    }
  }

  const handleApproveContract = async (contractId: string) => {
    toast.loading('Aprobando contrato...', { id: 'contract-action' })
    const { error } = await supabase
      .from('contracts')
      .update({ status: 'active', start_date: new Date().toISOString() })
      .eq('id', contractId)

    if (!error) {
      toast.success('Contrato Aprobado', { 
        id: 'contract-action',
        description: 'El jugador ha sido incorporado al roster del equipo.' 
      })
      setTeamContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'active' } : c))
    } else {
      toast.error('Error al aprobar contrato', { id: 'contract-action' })
    }
  }

  const handleRejectContract = async (contractId: string) => {
    toast.loading('Rechazando contrato...', { id: 'contract-action' })
    const { error } = await supabase
      .from('contracts')
      .update({ status: 'rejected' })
      .eq('id', contractId)

    if (!error) {
      toast.success('Contrato Rechazado', { id: 'contract-action' })
      setTeamContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'rejected' } : c))
    } else {
      toast.error('Error al rechazar contrato', { id: 'contract-action' })
    }
  }

  const pendingContractRequests = teamContracts.filter(c => 
    c.status === 'pending_manager' || c.status === 'pending' || c.status === 'pendiente'
  )

  const activeRosterContracts = teamContracts.filter(c => 
    c.status === 'active' || c.status === 'activo'
  )

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando equipos...</div>
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Solicitudes de Contrato Pendientes para tus Equipos (Manager) */}
      {managedTeams.length > 0 && pendingContractRequests.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-surface p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
              <Clock className="h-6 w-6 text-amber-400" />
              Solicitudes de Contrato Pendientes ({pendingContractRequests.length})
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-700 uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Requiere Tu Aprobación
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {pendingContractRequests.map(contract => {
              const playerName = contract.profiles?.name || 'Jugador'
              const playerNickname = contract.profiles?.nickname
              const playerAvatar = contract.profiles?.avatar_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'

              return (
                <div key={contract.id} className="rounded-xl bg-background border border-border p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-start gap-4">
                    <img 
                      src={playerAvatar} 
                      alt={playerName}
                      className="w-14 h-14 rounded-xl object-cover border border-border bg-surface shrink-0" 
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-700 text-white truncate text-base">{playerName}</h4>
                        {playerNickname && (
                          <span className="text-xs text-primary font-600">({playerNickname})</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Equipo: <strong className="text-white">{contract.teams?.name}</strong>
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Array.isArray(contract.roles) ? (
                          contract.roles.map((r: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[11px] font-600">
                              {formatRoleTitle(r)}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[11px] font-600">
                            {formatRoleTitle(contract.roles || 'Jugador')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">
                      Vence: <strong className="text-white">{contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Indefinido'}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRejectContract(contract.id)}
                        className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 font-600 uppercase text-[11px] tracking-wider transition-colors"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleApproveContract(contract.id)}
                        className="px-4 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/30 font-600 uppercase text-[11px] tracking-wider transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Aprobar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 2. Equipos Administrados */}
      {managedTeams.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-6 flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Equipos que Administras
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {managedTeams.map(team => {
              const val = teamValidations[team.id]
              const isPending = val?.status === 'pending'
              const isRejected = val?.status === 'rejected'

              return (
                <div key={team.id} className="rounded-lg bg-background border border-border p-4 flex flex-col items-center text-center hover:border-primary/50 transition-colors">
                  <img 
                    src={team.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                    alt={team.name} 
                    className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-surface bg-surface shadow-md" 
                  />
                  <h4 className="font-display font-700 text-white uppercase">{team.name}</h4>
                  
                  {/* Status Badges */}
                  <div className="text-xs font-500 uppercase tracking-widest mt-2 mb-4">
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-700 animate-pulse">
                        <AlertCircle className="w-3 h-3" /> Modificación en Revisión
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-1 text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full text-[10px] font-700">
                        <X className="w-3 h-3" /> Modificación Rechazada
                      </span>
                    ) : (
                      <span className={team.status === 'active' ? 'text-emerald-500' : team.status === 'banned' ? 'text-red-500' : 'text-yellow-500'}>
                        {team.status === 'active' ? 'ACTIVO' : team.status === 'banned' ? 'BANEADO' : 'PENDIENTE'}
                      </span>
                    )}
                  </div>

                  {/* Rejection Reason Alert if rejected */}
                  {isRejected && val?.details?.rejection_reason && (
                    <div className="w-full mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-left text-xs text-white animate-in fade-in">
                      <span className="font-700 text-red-400 block mb-0.5">Motivo del Administrador:</span>
                      <p className="text-white/90 leading-snug text-[11px]">{val.details.rejection_reason}</p>
                    </div>
                  )}

                  <div className="mt-auto w-full flex gap-2">
                    <button 
                      onClick={() => handleOpenEdit(team)} 
                      className={cn(
                        "flex-1 py-2 rounded border text-[11px] font-600 transition-colors tracking-widest uppercase",
                        isPending 
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-black"
                          : isRejected 
                          ? "bg-red-500/15 border-red-500/30 text-red-300 hover:bg-red-500/30"
                          : "bg-surface border-border text-white hover:border-primary"
                      )}
                    >
                      {isPending ? 'MODIFICAR SOLICITUD' : isRejected ? 'REENVIAR SOLICITUD' : 'EDITAR'}
                    </button>
                    <Link href={`/equipos/${getTeamSlug(team)}`} className="flex-1 py-2 rounded bg-primary/10 text-primary text-[11px] font-600 hover:bg-primary hover:text-white transition-colors text-center tracking-widest uppercase">
                      PERFIL
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. Roster de Jugadores Activos en tus Equipos (Manager) */}
      {managedTeams.length > 0 && activeRosterContracts.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" />
            Roster Activo en tus Equipos ({activeRosterContracts.length})
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeRosterContracts.map(contract => (
              <div key={contract.id} className="rounded-lg bg-background border border-border p-4 flex items-center gap-4">
                <img 
                  src={contract.profiles?.avatar_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                  alt={contract.profiles?.name} 
                  className="w-12 h-12 rounded-xl object-cover border border-border shrink-0" 
                />
                <div className="min-w-0 flex-1">
                  <h5 className="font-display font-700 text-white text-sm truncate">{contract.profiles?.name}</h5>
                  <p className="text-xs text-muted-foreground">{contract.teams?.name}</p>
                  <p className="text-xs text-primary font-600 mt-1">{formatRolesList(contract.roles)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Equipo Actual como Jugador */}
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-6 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Mi Equipo Actual (Jugador)
        </h3>

        {activeTeam ? (
          <div className="flex flex-col sm:flex-row items-center gap-6 rounded-lg bg-background p-6 border border-primary/20">
            <img 
              src={activeTeam.teams?.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
              alt={activeTeam.teams?.name} 
              className="w-24 h-24 rounded-xl object-cover bg-surface border border-border"
            />
            <div className="flex-1 text-center sm:text-left">
              <h4 className="font-display text-3xl font-700 text-white uppercase">{activeTeam.teams?.name}</h4>
              <p className="text-muted-foreground mt-1 mb-4">{activeTeam.teams?.country}</p>
              
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-600 uppercase tracking-widest">
                Contrato {activeTeam.status}
              </div>
            </div>
            <Link 
              href={`/equipos/${getTeamSlug(activeTeam.teams)}`} 
              className="mt-4 sm:mt-0 px-6 py-3 rounded bg-primary/10 text-primary font-600 uppercase tracking-widest text-sm hover:bg-primary hover:text-white transition-colors"
            >
              Ver Perfil
            </Link>
          </div>
        ) : (
          <div className="text-center py-12 rounded-lg bg-background border border-dashed border-border">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-display text-xl font-600 text-white">Sin Equipo Actual</h4>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
              Actualmente eres un agente libre. Cuando firmes un contrato con un equipo, aparecerá aquí.
            </p>
          </div>
        )}
      </div>

      {/* 5. Historial de Equipos */}
      {pastTeams.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white mb-6 flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Historial de Equipos
          </h3>

          <div className="grid gap-4">
            {pastTeams.map((contract) => (
              <div key={contract.id} className="flex items-center gap-4 p-4 rounded-lg bg-background border border-border">
                <img 
                  src={contract.teams?.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                  alt={contract.teams?.name} 
                  className="w-12 h-12 rounded object-cover grayscale opacity-70"
                />
                <div className="flex-1">
                  <h5 className="font-600 text-white uppercase">{contract.teams?.name}</h5>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Calendar className="w-3 h-3" />
                    {contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'N/A'} - {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Cancelado'}
                  </div>
                </div>
                <div className="text-xs font-600 uppercase tracking-widest text-muted-foreground">
                  {contract.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Edición de Equipo */}
      {editingTeam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingTeam(null)} />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between border-b border-border p-6 bg-surface shrink-0">
              <div>
                <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  {editingTeam.validation?.status === 'pending'
                    ? 'Modificar Solicitud de Equipo'
                    : editingTeam.validation?.status === 'rejected'
                    ? 'Reenviar Solicitud de Equipo'
                    : user?.role === 'admin'
                    ? 'Editar Equipo'
                    : 'Solicitud de Modificación de Equipo'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {editingTeam.validation?.status === 'pending'
                    ? 'Modifica los datos de tu solicitud en curso.'
                    : user?.role === 'admin'
                    ? 'Actualiza los datos del equipo directamente.'
                    : 'Tus cambios serán enviados al administrador para su aprobación.'}
                </p>
              </div>
              <button onClick={() => setEditingTeam(null)} className="text-muted-foreground hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Avisos Contextuales */}
              {editingTeam.validation?.status === 'pending' && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Se han cargado los datos de tu solicitud en revisión. Puedes ajustarlos y reenviarlos.</span>
                </div>
              )}

              {editingTeam.validation?.status === 'rejected' && editingTeam.validation?.details?.rejection_reason && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-700 text-red-300 block uppercase tracking-wider">Motivo del Rechazo Anterior:</span>
                    <p className="text-white/90 leading-relaxed">{editingTeam.validation.details.rejection_reason}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center">
                <img 
                  src={editingTeam.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                  alt={editingTeam.name} 
                  className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-border bg-background shadow-inner"
                />
                <label className="w-full">
                  <span className="text-xs font-600 text-muted-foreground uppercase tracking-widest mb-2 block text-center">Actualizar Logo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoUpload}
                    className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-600 text-muted-foreground uppercase tracking-widest">Nombre del Equipo</label>
                  <input 
                    type="text" 
                    value={editingTeam.name || ''}
                    onChange={e => setEditingTeam({...editingTeam, name: e.target.value.toUpperCase()})}
                    className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-white focus:border-primary focus:outline-none uppercase"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-600 text-muted-foreground uppercase tracking-widest">Tag del Equipo</label>
                  <input 
                    type="text" 
                    value={editingTeam.tag || ''}
                    onChange={e => setEditingTeam({...editingTeam, tag: e.target.value.toUpperCase()})}
                    className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-white focus:border-primary focus:outline-none uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-600 text-muted-foreground uppercase tracking-widest">País</label>
                  <div className="relative">
                    <select 
                      value={editingTeam.country || ''}
                      onChange={e => setEditingTeam({...editingTeam, country: e.target.value})}
                      className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-white focus:border-primary focus:outline-none appearance-none"
                    >
                      <option value="" disabled>Selecciona un país</option>
                      {countries.map(c => (
                        <option key={c} value={c} className="bg-surface text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border p-6 bg-surface shrink-0 flex justify-end gap-3">
              <button 
                onClick={() => setEditingTeam(null)}
                className="px-6 py-2 rounded-md border border-border text-sm font-600 text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <GmxButton onClick={handleUpdateTeam} disabled={savingTeam} className="px-6 py-2">
                {savingTeam ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingTeam.validation?.status === 'pending' ? (
                  'Actualizar Solicitud'
                ) : editingTeam.validation?.status === 'rejected' ? (
                  'Reenviar Solicitud'
                ) : user?.role === 'admin' ? (
                  'Guardar Cambios'
                ) : (
                  'Solicitar Modificación'
                )}
              </GmxButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
