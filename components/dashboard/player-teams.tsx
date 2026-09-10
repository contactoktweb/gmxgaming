'use client'

import { useState, useEffect } from 'react'
import { Shield, ShieldAlert, History, Calendar, Settings, Save, X, Loader2, Users, Check, Clock, UserCheck, AlertCircle, UserX } from 'lucide-react'
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
  const [activeTeams, setActiveTeams] = useState<any[]>([])
  const [teamToLeave, setTeamToLeave] = useState<any>(null)
  const [pastTeams, setPastTeams] = useState<any[]>([])
  const [managedTeams, setManagedTeams] = useState<any[]>([])
  const [teamContracts, setTeamContracts] = useState<any[]>([])
  const [teamValidations, setTeamValidations] = useState<Record<string, any>>({})
  const [countries, setCountries] = useState<string[]>(DEFAULT_COUNTRIES)
  const [loading, setLoading] = useState(true)

  const [editingTeam, setEditingTeam] = useState<any>(null)
  const [savingTeam, setSavingTeam] = useState(false)
  const [requestingLeave, setRequestingLeave] = useState(false)
  const [processingContractId, setProcessingContractId] = useState<string | null>(null)

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
          roles,
          team_gender_category,
          teams (id, name, logo_url, country)
        `)
        .eq('player_id', user.id)
        .order('start_date', { ascending: false })

      if (data) {
        const active = data.filter(c => 
          c.status === 'activo' || 
          c.status === 'active' || 
          c.status === 'pending_manager' || 
          c.status === 'pendiente' ||
          c.status === 'pending_player_release' ||
          c.status === 'pending_manager_release'
        )
        setActiveTeams(active)
        
        const { data: bajaValidations } = await supabase
          .from('validations')
          .select('*')
          .eq('type', 'baja_contrato')

        const valMap: Record<string, any> = {}
        const adminIds: string[] = []
        if (bajaValidations) {
          bajaValidations.forEach((v: any) => {
            if (v.details?.contract_id) {
              valMap[v.details.contract_id] = v
              if (v.details?.admin_id) adminIds.push(v.details.admin_id)
            }
          })
        }

        // Obtener nickname del admin desde profiles
        const adminNickMap: Record<string, string> = {}
        if (adminIds.length > 0) {
          const { data: adminProfiles } = await supabase
            .from('profiles')
            .select('id, nickname, game_nickname, name')
            .in('id', adminIds)
          if (adminProfiles) {
            adminProfiles.forEach((p: any) => {
              adminNickMap[p.id] = p.nickname || p.game_nickname || p.name
            })
          }
        }

        const past = data
          .filter(c => c.status === 'completado' || c.status === 'cancelado' || c.status === 'rejected')
          .map(c => {
            const v = valMap[c.id]
            const adminId = v?.details?.admin_id
            const adminNick =
              (adminId && adminNickMap[adminId]) ||
              v?.details?.admin_nickname ||
              v?.details?.admin_name ||
              v?.submitted_by ||
              null

            return {
              ...c,
              bajaJustification: v?.details?.justification || null,
              bajaAdmin: adminNick
            }
          })
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

  // Manager acepta baja solicitada por el jugador
  const handleManagerApprovePlayerRelease = async (contractId: string, playerName: string) => {
    setProcessingContractId(contractId)
    toast.loading('Aceptando baja del jugador...', { id: 'manager-release' })
    const { error } = await supabase
      .from('contracts')
      .update({
        status: 'completado',
        conclusion_date: new Date().toISOString()
      })
      .eq('id', contractId)

    if (!error) {
      toast.success('Baja Aceptada', {
        id: 'manager-release',
        description: `Se aceptó la baja de ${playerName}. Su contrato ha finalizado.`
      })
      setTeamContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'completado', conclusion_date: new Date().toISOString() } : c))
    } else {
      toast.error('Error al aceptar la baja: ' + error.message, { id: 'manager-release' })
    }
    setProcessingContractId(null)
  }

  // Manager rechaza baja solicitada por el jugador
  const handleManagerRejectPlayerRelease = async (contractId: string, playerName: string) => {
    setProcessingContractId(contractId)
    toast.loading('Rechazando baja...', { id: 'manager-release' })
    const { error } = await supabase
      .from('contracts')
      .update({ status: 'active' })
      .eq('id', contractId)

    if (!error) {
      toast.success('Baja Rechazada', {
        id: 'manager-release',
        description: `Se rechazó la solicitud de baja de ${playerName}. El contrato se mantiene activo.`
      })
      setTeamContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'active' } : c))
    } else {
      toast.error('Error al rechazar la baja: ' + error.message, { id: 'manager-release' })
    }
    setProcessingContractId(null)
  }

  // Jugador acepta la baja solicitada por el equipo
  const handlePlayerAcceptTermination = async (contract: any) => {
    if (!contract) return
    setProcessingContractId(contract.id)
    toast.loading('Aceptando baja del equipo...', { id: 'player-release' })

    const { error } = await supabase
      .from('contracts')
      .update({
        status: 'completado',
        conclusion_date: new Date().toISOString()
      })
      .eq('id', contract.id)

    if (!error) {
      toast.success('Baja Aceptada', {
        id: 'player-release',
        description: `Has aceptado la baja de ${contract.teams?.name || 'tu equipo'}. Tu cupo en esa división ha quedado liberado.`
      })
      setPastTeams(prev => [{ ...contract, status: 'completado', conclusion_date: new Date().toISOString() }, ...prev])
      setActiveTeams(prev => prev.filter(c => c.id !== contract.id))
    } else {
      toast.error('Error al aceptar la baja: ' + error.message, { id: 'player-release' })
    }
    setProcessingContractId(null)
  }

  // Jugador rechaza la baja solicitada por el equipo
  const handlePlayerRejectTermination = async (contract: any) => {
    if (!contract) return
    setProcessingContractId(contract.id)
    toast.loading('Rechazando baja...', { id: 'player-release' })

    const { error } = await supabase
      .from('contracts')
      .update({ status: 'active' })
      .eq('id', contract.id)

    if (!error) {
      toast.success('Baja Rechazada', {
        id: 'player-release',
        description: 'Has rechazado la solicitud de baja. Tu contrato continúa activo.'
      })
      setActiveTeams(prev => prev.map(c => c.id === contract.id ? { ...c, status: 'active' } : c))
    } else {
      toast.error('Error al rechazar la baja: ' + error.message, { id: 'player-release' })
    }
    setProcessingContractId(null)
  }

  // Jugador pide la baja de su contrato al manager
  const handlePlayerRequestLeave = async () => {
    if (!teamToLeave) return
    setProcessingContractId(teamToLeave.id)
    toast.loading('Enviando solicitud de baja...', { id: 'player-leave' })

    const { error } = await supabase
      .from('contracts')
      .update({ status: 'pending_manager_release' })
      .eq('id', teamToLeave.id)

    if (!error) {
      toast.success('Solicitud Enviada', {
        id: 'player-leave',
        description: `Se notificó al manager de ${teamToLeave.teams?.name || 'equipo'}. En espera de su aprobación.`
      })
      setActiveTeams(prev => prev.map(c => c.id === teamToLeave.id ? { ...c, status: 'pending_manager_release' } : c))
      setRequestingLeave(false)
      setTeamToLeave(null)
    } else {
      toast.error('Error al solicitar la baja: ' + error.message, { id: 'player-leave' })
    }
    setProcessingContractId(null)
  }

  // Jugador cancela su solicitud de baja
  const handlePlayerCancelLeave = async (contract: any) => {
    if (!contract) return
    setProcessingContractId(contract.id)
    toast.loading('Cancelando solicitud...', { id: 'cancel-leave' })

    const { error } = await supabase
      .from('contracts')
      .update({ status: 'active' })
      .eq('id', contract.id)

    if (!error) {
      toast.success('Solicitud Cancelada', {
        id: 'cancel-leave',
        description: 'Tu solicitud de baja fue cancelada. Tu contrato continúa activo.'
      })
      setActiveTeams(prev => prev.map(c => c.id === contract.id ? { ...c, status: 'active' } : c))
    } else {
      toast.error('Error al cancelar la solicitud: ' + error.message, { id: 'cancel-leave' })
    }
    setProcessingContractId(null)
  }

  const pendingContractRequests = teamContracts.filter(c => 
    c.status === 'pending_manager' || c.status === 'pending' || c.status === 'pendiente'
  )

  const pendingPlayerReleases = teamContracts.filter(c => 
    c.status === 'pending_manager_release'
  )

  const activeRosterContracts = teamContracts.filter(c => 
    c.status === 'active' || c.status === 'activo' || c.status === 'pending_player_release' || c.status === 'pending_manager_release'
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

      {/* 1.1 Solicitudes de Baja de Jugadores (Manager) */}
      {managedTeams.length > 0 && pendingPlayerReleases.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-surface p-6 sm:p-8 shadow-xl animate-in fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
              <UserX className="h-6 w-6 text-red-400" />
              Solicitudes de Baja por Jugadores ({pendingPlayerReleases.length})
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-700 uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
              Rescisión Solicitada
            </span>
          </div>

          <p className="text-xs text-muted-foreground mb-6">
            Los siguientes jugadores han solicitado rescindir su contrato y darse de baja de tus equipos:
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {pendingPlayerReleases.map(contract => {
              const playerName = contract.profiles?.name || 'Jugador'
              const playerNickname = contract.profiles?.nickname
              const playerAvatar = contract.profiles?.avatar_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'

              return (
                <div key={contract.id} className="rounded-xl bg-background border border-red-500/30 p-5 flex flex-col justify-between space-y-4 hover:border-red-500/60 transition-colors shadow-lg">
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
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between gap-3 text-xs">
                    <span className="text-red-400 font-500">
                      Pide rescisión de contrato
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleManagerRejectPlayerRelease(contract.id, playerName)}
                        disabled={processingContractId === contract.id}
                        className="px-3 py-1.5 rounded bg-surface hover:bg-white/10 text-muted-foreground hover:text-white border border-border font-600 uppercase text-[11px] tracking-wider transition-colors disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleManagerApprovePlayerRelease(contract.id, playerName)}
                        disabled={processingContractId === contract.id}
                        className="px-4 py-1.5 rounded bg-red-500/20 hover:bg-red-600 hover:text-white text-red-300 border border-red-500/30 font-600 uppercase text-[11px] tracking-wider transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        Aceptar Baja
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Mi Equipo Actual (Jugador)
          </h3>
          {activeTeams.length > 1 && (
            <span className="text-xs font-600 text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
              2 Contratos Activos (Femenil y Mixto)
            </span>
          )}
        </div>

        {activeTeams.length > 0 ? (
          <div className="space-y-6">
            {activeTeams.map((teamContract: any) => {
              const isFemale = teamContract.team_gender_category === 'female' || (teamContract.teams?.name || '').toLowerCase().includes('fem')
              const divisionName = isFemale ? 'División Femenil' : 'División Varonil / Mixto'

              return (
                <div key={teamContract.id} className="space-y-4">
                  {/* Aviso si el equipo solicitó la rescisión al jugador */}
                  {teamContract.status === 'pending_player_release' && (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 animate-in fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-display font-700 text-amber-300 text-base uppercase tracking-wide">
                              Solicitud de Baja por parte del Equipo
                            </h5>
                            <p className="text-xs text-white/90 mt-1 leading-relaxed">
                              El equipo <strong className="text-white">{teamContract.teams?.name}</strong> ha solicitado rescindir tu contrato. Puedes aceptar para quedar como agente libre en esta división o rechazar si deseas continuar.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => handlePlayerRejectTermination(teamContract)}
                            disabled={processingContractId === teamContract.id}
                            className="px-4 py-2 rounded-lg bg-surface hover:bg-white/10 text-muted-foreground hover:text-white border border-border font-600 text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                          >
                            Rechazar Baja
                          </button>
                          <button
                            onClick={() => handlePlayerAcceptTermination(teamContract)}
                            disabled={processingContractId === teamContract.id}
                            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-600 text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-md disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            Aceptar Baja
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Aviso si el jugador solicitó la baja al manager */}
                  {teamContract.status === 'pending_manager_release' && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                        <p className="text-xs text-amber-200">
                          Has solicitado rescindir tu contrato con <strong className="text-white">{teamContract.teams?.name}</strong>. En espera de que el manager acepte tu baja.
                        </p>
                      </div>
                      <button
                        onClick={() => handlePlayerCancelLeave(teamContract)}
                        disabled={processingContractId === teamContract.id}
                        className="px-3 py-1.5 rounded bg-surface hover:bg-white/10 text-muted-foreground hover:text-white border border-border text-xs font-600 uppercase tracking-wider transition-colors self-end sm:self-center"
                      >
                        Cancelar Solicitud
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-6 rounded-lg bg-background p-6 border border-primary/20">
                    <img 
                      src={teamContract.teams?.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                      alt={teamContract.teams?.name} 
                      className="w-24 h-24 rounded-xl object-cover bg-surface border border-border"
                    />
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-700 uppercase tracking-wider border",
                          isFemale ? "bg-pink-500/15 text-pink-300 border-pink-500/30" : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                        )}>
                          {divisionName}
                        </span>

                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-600 uppercase tracking-wider",
                          teamContract.status === 'pending_player_release'
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : teamContract.status === 'pending_manager_release'
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : teamContract.status === 'active' || teamContract.status === 'activo'
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        )}>
                          {teamContract.status === 'pending_player_release'
                            ? 'Baja Solicitada por Equipo'
                            : teamContract.status === 'pending_manager_release'
                            ? 'Baja en Espera de Manager'
                            : teamContract.status === 'active' || teamContract.status === 'activo'
                            ? 'Contrato Activo'
                            : 'Contrato Pendiente'}
                        </div>
                      </div>

                      <h4 className="font-display text-2xl sm:text-3xl font-700 text-white uppercase">{teamContract.teams?.name}</h4>
                      <p className="text-muted-foreground text-sm mt-0.5 mb-2">{teamContract.teams?.country}</p>
                      
                      {teamContract.roles && (
                        <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mt-2">
                          {Array.isArray(teamContract.roles) ? (
                            teamContract.roles.map((r: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-white/5 text-muted-foreground border border-white/10 text-xs">
                                {formatRoleTitle(r)}
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-white/5 text-muted-foreground border border-white/10 text-xs">
                              {formatRoleTitle(teamContract.roles)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                      <Link 
                        href={`/equipos/${getTeamSlug(teamContract.teams)}`} 
                        className="w-full sm:w-auto text-center px-5 py-2.5 rounded bg-primary/10 text-primary font-600 uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-colors"
                      >
                        Ver Perfil
                      </Link>

                      {(teamContract.status === 'active' || teamContract.status === 'activo') && (
                        <button
                          onClick={() => {
                            setTeamToLeave(teamContract)
                            setRequestingLeave(true)
                          }}
                          className="w-full sm:w-auto px-4 py-2.5 rounded bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 font-600 uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-1"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Solicitar Baja
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
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
              <div key={contract.id} className="p-4 rounded-lg bg-background border border-border space-y-3">
                <div className="flex items-center gap-4">
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
                    {contract.status === 'active' || contract.status === 'activo' ? 'Activo' :
                     contract.status === 'pending' || contract.status === 'pendiente' || contract.status === 'pending_manager' ? 'Pendiente' :
                     contract.status === 'cancelled' || contract.status === 'cancelado' || contract.status === 'rejected' ? 'Cancelado' :
                     'Finalizado'}
                  </div>
                </div>

                {contract.bajaJustification && (
                  <div className="rounded bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-200">
                    <div className="flex items-center justify-between font-semibold text-[11px] uppercase tracking-wider text-amber-400 mb-1">
                      <span>Motivo de Baja Administrativa</span>
                      {contract.bajaAdmin && <span>Por: {contract.bajaAdmin}</span>}
                    </div>
                    <p className="italic">"{contract.bajaJustification}"</p>
                  </div>
                )}
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

      {/* Modal de Confirmación para Solicitar Baja del Equipo (Jugador) */}
      {requestingLeave && teamToLeave && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setRequestingLeave(false); setTeamToLeave(null) }} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4 border border-red-500/20">
              <ShieldAlert className="h-7 w-7" />
            </div>
            
            <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white text-center mb-2">
              ¿Solicitar baja del equipo?
            </h3>
            
            <p className="text-sm text-muted-foreground text-center mb-6">
              Estás a punto de solicitar la rescisión de tu contrato con <strong className="text-white">{teamToLeave.teams?.name}</strong>. Se notificará al manager del equipo para que apruebe tu desvinculación. Tu contrato continuará activo hasta que el manager la acepte.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setRequestingLeave(false); setTeamToLeave(null) }}
                className="flex-1 py-2.5 rounded-md border border-border text-sm font-600 text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePlayerRequestLeave}
                disabled={processingContractId === teamToLeave.id}
                className="flex-1 py-2.5 rounded-md bg-red-600 hover:bg-red-700 text-sm font-600 text-white uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
