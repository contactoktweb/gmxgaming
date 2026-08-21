'use client'

import { useState, useEffect } from 'react'
import { Users, Shield, Clock, Check, X, UserX, AlertCircle, ChevronDown, CheckCircle2, FileText, Calendar, ExternalLink } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { cn, formatRoleTitle, formatRolesList, getTeamSlug, getPlayerSlug } from '@/lib/utils'
import { GmxButton } from '@/components/gmx-button'
import { toast } from 'sonner'
import Link from 'next/link'

interface ManagedTeam {
  id: string
  name: string
  tag?: string
  logo_url?: string
  status: string
  country?: string
}

interface ContractRequest {
  id: string
  player_id: string
  team_id: string
  roles: string[] | string
  status: string
  start_date: string | null
  end_date: string | null
  created_at: string
  profiles?: {
    id: string
    name: string
    nickname?: string
    avatar_url?: string
    discord_handle?: string
    player_game_info?: any[]
  }
}

export function ManagerPlayers() {
  const { user } = useAuth()
  const supabase = createClient()

  const [managedTeams, setManagedTeams] = useState<ManagedTeam[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [contracts, setContracts] = useState<ContractRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  
  // Modal de confirmación para dar de baja a un jugador
  const [terminatingContract, setTerminatingContract] = useState<ContractRequest | null>(null)

  // 1. Cargar equipos que administra el usuario
  useEffect(() => {
    async function loadManagedTeams() {
      if (!user) return
      setLoading(true)

      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .eq('manager_id', user.id)
        .order('created_at', { ascending: false })

      if (teamsData && teamsData.length > 0) {
        setManagedTeams(teamsData)
        setSelectedTeamId(teamsData[0].id)
      } else {
        setManagedTeams([])
      }
      setLoading(false)
    }

    loadManagedTeams()
  }, [user])

  // 2. Cargar contratos para el equipo seleccionado
  useEffect(() => {
    async function loadTeamContracts() {
      if (!selectedTeamId) return

      const { data: contractsData } = await supabase
        .from('contracts')
        .select(`
          *,
          profiles (id, name, nickname, avatar_url, discord_handle, player_game_info(*))
        `)
        .eq('team_id', selectedTeamId)
        .order('created_at', { ascending: false })

      if (contractsData) {
        setContracts(contractsData as ContractRequest[])
      }
    }

    loadTeamContracts()
  }, [selectedTeamId])

  // Acciones sobre contratos
  const handleApproveContract = async (contractId: string, playerName: string) => {
    setProcessingId(contractId)
    toast.loading('Validando y aprobando contrato...', { id: 'contract-action' })

    const contractToApprove = contracts.find(c => c.id === contractId)
    if (!contractToApprove) {
      toast.error('No se encontró el contrato', { id: 'contract-action' })
      setProcessingId(null)
      return
    }

    const playerId = contractToApprove.player_id

    // Check player's existing active contracts in database
    const { data: activePlayerContracts } = await supabase
      .from('contracts')
      .select('id, team_id, team_gender_category, status')
      .eq('player_id', playerId)
      .in('status', ['active', 'activo'])

    // Detect player gender from validations
    let detectedGender: 'Masculino' | 'Femenino' = 'Masculino'
    const { data: userValidations } = await supabase
      .from('validations')
      .select('details')
      .or(`submitted_by.eq.${playerId},details->>user_id.eq.${playerId}`)
      .order('created_at', { ascending: false })
      .limit(5)

    if (userValidations && userValidations.length > 0) {
      for (const v of userValidations) {
        const g = v.details?.gender || v.details?.genero || v.details?.['item_meta[783]'] || v.details?.item_meta?.[783]
        if (typeof g === 'string') {
          if (g.toLowerCase().includes('fem') || g.toLowerCase() === 'f') {
            detectedGender = 'Femenino'
            break
          }
        }
      }
    }

    const activeList = activePlayerContracts || []

    // Current team category
    const isCurrentTeamFemale = contractToApprove.team_gender_category === 'female' || (selectedTeam?.name || '').toLowerCase().includes('fem')
    const currentCategory = isCurrentTeamFemale ? 'Femenil' : 'Varonil / Mixto'

    if (detectedGender === 'Masculino') {
      if (activeList.length >= 1) {
        toast.error('Límite de contratos alcanzado', {
          id: 'contract-action',
          description: `El jugador ${playerName} ya cuenta con 1 contrato activo. Los jugadores varoniles solo pueden tener 1 contrato activo en división Varonil/Mixto.`
        })
        setProcessingId(null)
        return
      }

      if (currentCategory === 'Femenil') {
        toast.error('Restricción de división', {
          id: 'contract-action',
          description: `Los jugadores varoniles no pueden formar parte de la división Femenil.`
        })
        setProcessingId(null)
        return
      }
    } else {
      // Femenino: max 2 (1 varonil/mixto + 1 femenil)
      if (activeList.length >= 2) {
        toast.error('Límite de contratos alcanzado', {
          id: 'contract-action',
          description: `La jugadora ${playerName} ya cuenta con 2 contratos activos (límite máximo permitido: 1 Varonil/Mixto y 1 Femenil).`
        })
        setProcessingId(null)
        return
      }

      const hasSameCategory = activeList.some((c: any) => {
        const cat = c.team_gender_category === 'female' ? 'Femenil' : 'Varonil / Mixto'
        return cat === currentCategory
      })

      if (hasSameCategory) {
        toast.error('Límite de división alcanzado', {
          id: 'contract-action',
          description: `La jugadora ${playerName} ya cuenta con un contrato activo en la división ${currentCategory}. Solo puede tener 1 activo en Varonil/Mixto y 1 en Femenil.`
        })
        setProcessingId(null)
        return
      }
    }

    const { error } = await supabase
      .from('contracts')
      .update({
        status: 'active',
        start_date: new Date().toISOString()
      })
      .eq('id', contractId)

    if (!error) {
      toast.success('¡Contrato Aprobado!', {
        id: 'contract-action',
        description: `${playerName} ahora forma parte oficial del roster de tu equipo.`
      })
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'active', start_date: new Date().toISOString() } : c))
    } else {
      toast.error('Error al aprobar contrato: ' + error.message, { id: 'contract-action' })
    }
    setProcessingId(null)
  }

  const handleRejectContract = async (contractId: string, playerName: string) => {
    setProcessingId(contractId)
    toast.loading('Rechazando solicitud...', { id: 'contract-action' })

    const { error } = await supabase
      .from('contracts')
      .update({ status: 'rejected' })
      .eq('id', contractId)

    if (!error) {
      toast.success('Solicitud Rechazada', {
        id: 'contract-action',
        description: `Se rechazó la solicitud de contrato de ${playerName}.`
      })
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'rejected' } : c))
    } else {
      toast.error('Error al rechazar solicitud', { id: 'contract-action' })
    }
    setProcessingId(null)
  }

  const handleTerminateContract = async () => {
    if (!terminatingContract) return
    const contractId = terminatingContract.id
    const playerName = terminatingContract.profiles?.name || 'el jugador'

    toast.loading('Finalizando contrato...', { id: 'contract-term' })

    const { error } = await supabase
      .from('contracts')
      .update({
        status: 'completado',
        conclusion_date: new Date().toISOString()
      })
      .eq('id', contractId)

    if (!error) {
      toast.success('Contrato Finalizado', {
        id: 'contract-term',
        description: `Se dio de baja el contrato de ${playerName}.`
      })
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'completado' } : c))
      setTerminatingContract(null)
    } else {
      toast.error('Error al finalizar el contrato', { id: 'contract-term' })
    }
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-surface border border-border"></div>
  }

  if (managedTeams.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-12 text-center shadow-xl">
        <Shield className="mx-auto h-16 w-16 text-muted-foreground mb-4 opacity-40" />
        <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-2">
          No eres Líder de ningún Equipo
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-6 text-sm">
          Esta sección está disponible para los líderes o managers de equipos registrados. Si ya solicitaste el alta de tu equipo, espera a que sea validado por los administradores.
        </p>
        <GmxButton href="/registro/alta-de-equipo" className="px-6 py-2">
          REGISTRAR EQUIPO
        </GmxButton>
      </div>
    )
  }

  const currentTeam = managedTeams.find(t => t.id === selectedTeamId) || managedTeams[0]
  const pendingRequests = contracts.filter(c => c.status === 'pending_manager' || c.status === 'pending' || c.status === 'pendiente')
  const activeRoster = contracts.filter(c => c.status === 'active' || c.status === 'activo')
  const pastContracts = contracts.filter(c => c.status === 'rejected' || c.status === 'completado' || c.status === 'cancelado')

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Selector de Equipo y Banner */}
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <img 
              src={currentTeam.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
              alt={currentTeam.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-primary/30 bg-background shadow-lg" 
            />
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl sm:text-3xl font-700 uppercase tracking-tight text-white">
                  {currentTeam.name}
                </h2>
                {currentTeam.tag && (
                  <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-xs font-700">
                    {currentTeam.tag}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <span>Líder / Manager Oficial</span>
                <span>•</span>
                <span className={currentTeam.status === 'active' ? 'text-emerald-400 font-600' : 'text-amber-400 font-600'}>
                  {currentTeam.status === 'active' ? 'EQUIPO ACTIVO' : 'EN REVISIÓN'}
                </span>
                {currentTeam.country && (
                  <>
                    <span>•</span>
                    <span>{currentTeam.country}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Selector si tiene más de 1 equipo */}
          {managedTeams.length > 1 && (
            <div className="w-full md:w-auto">
              <label className="text-xs font-600 uppercase tracking-widest text-muted-foreground block mb-1.5">
                Cambiar Equipo:
              </label>
              <div className="relative">
                <select
                  value={selectedTeamId}
                  onChange={e => setSelectedTeamId(e.target.value)}
                  className="w-full md:w-56 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none appearance-none font-600 cursor-pointer"
                >
                  {managedTeams.map(t => (
                    <option key={t.id} value={t.id} className="bg-surface text-white">
                      {t.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Métricas Rápidas del Equipo */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6">
          <div className="rounded-lg bg-background border border-border p-4">
            <p className="text-xs font-600 uppercase tracking-wider text-muted-foreground">Solicitudes Pendientes</p>
            <p className="font-display text-2xl sm:text-3xl font-700 text-amber-400 mt-1">{pendingRequests.length}</p>
          </div>
          <div className="rounded-lg bg-background border border-border p-4">
            <p className="text-xs font-600 uppercase tracking-wider text-muted-foreground">Jugadores en Roster</p>
            <p className="font-display text-2xl sm:text-3xl font-700 text-emerald-400 mt-1">{activeRoster.length}</p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-lg bg-background border border-border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-600 uppercase tracking-wider text-muted-foreground">Perfil del Equipo</p>
              <Link href={`/equipos/${getTeamSlug(currentTeam)}`} className="text-xs font-700 text-primary hover:underline uppercase mt-1 inline-flex items-center gap-1">
                Ver Página <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Solicitudes de Contrato Pendientes */}
      <div className="rounded-xl border border-amber-500/30 bg-surface p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
            <Clock className="h-6 w-6 text-amber-400" />
            Solicitudes de Contrato Pendientes ({pendingRequests.length})
          </h3>
          {pendingRequests.length > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-700 uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Acción Requerida
            </span>
          )}
        </div>

        {pendingRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background/50 p-8 text-center text-muted-foreground">
            <p>No tienes solicitudes de contrato pendientes para {currentTeam.name}.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {pendingRequests.map(contract => {
              const playerName = contract.profiles?.name || 'Jugador'
              const playerNickname = contract.profiles?.nickname
              const playerAvatar = contract.profiles?.avatar_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'
              const isProcessing = processingId === contract.id

              return (
                <div 
                  key={contract.id} 
                  className="rounded-xl bg-background border border-amber-500/30 p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/60 transition-colors shadow-lg"
                >
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

                      {contract.profiles?.discord_handle && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Discord: <span className="text-white font-500">@{contract.profiles.discord_handle}</span>
                        </p>
                      )}

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
                      Fin de Contrato: <strong className="text-white">{contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Indefinido'}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRejectContract(contract.id, playerName)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 font-600 uppercase text-[11px] tracking-wider transition-colors disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleApproveContract(contract.id, playerName)}
                        disabled={isProcessing}
                        className="px-4 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/30 font-600 uppercase text-[11px] tracking-wider transition-colors flex items-center gap-1 disabled:opacity-50"
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
        )}
      </div>

      {/* 3. Roster de Jugadores Activos */}
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-xl">
        <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-6 flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Roster Oficial de Jugadores ({activeRoster.length})
        </h3>

        {activeRoster.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background/50 p-8 text-center text-muted-foreground">
            <p>Aún no hay jugadores activos en el roster de {currentTeam.name}.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeRoster.map(contract => {
              const playerName = contract.profiles?.name || 'Jugador'
              const playerNickname = contract.profiles?.nickname
              const playerAvatar = contract.profiles?.avatar_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'

              return (
                <div key={contract.id} className="rounded-xl bg-background border border-border p-5 flex flex-col justify-between hover:border-primary/50 transition-colors shadow-md">
                  <div className="flex items-start gap-4 mb-4">
                    <img 
                      src={playerAvatar} 
                      alt={playerName}
                      className="w-14 h-14 rounded-xl object-cover border border-border bg-surface shrink-0" 
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-display font-700 text-white truncate text-base">{playerName}</h4>
                      {playerNickname && (
                        <p className="text-xs text-primary font-600 font-display">IGN: {playerNickname}</p>
                      )}
                      {contract.profiles?.discord_handle && (
                        <p className="text-xs text-muted-foreground">Discord: @{contract.profiles.discord_handle}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex flex-wrap gap-1">
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

                    <div className="text-xs text-muted-foreground pt-2 border-t border-border flex justify-between">
                      <span>Vencimiento:</span>
                      <strong className="text-white">{contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Indefinido'}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex justify-between items-center gap-2">
                    {contract.profiles && (
                      <Link 
                        href={`/jugadores/${getPlayerSlug(contract.profiles)}`}
                        className="text-xs font-600 text-primary hover:underline uppercase tracking-wider"
                      >
                        Ver Perfil
                      </Link>
                    )}
                    <button
                      onClick={() => setTerminatingContract(contract)}
                      className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 font-600 uppercase text-[10px] tracking-wider transition-colors flex items-center gap-1 ml-auto"
                    >
                      <UserX className="w-3 h-3" />
                      Dar de Baja
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. Historial de Contratos (Rechazados / Completados) */}
      {pastContracts.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-xl">
          <h3 className="font-display text-xl font-700 uppercase tracking-tight text-muted-foreground mb-4">
            Historial de Contratos Pasados ({pastContracts.length})
          </h3>
          <div className="divide-y divide-border rounded-lg border border-border bg-background">
            {pastContracts.map(c => (
              <div key={c.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <img 
                    src={c.profiles?.avatar_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                    alt={c.profiles?.name}
                    className="w-8 h-8 rounded-lg object-cover grayscale opacity-70" 
                  />
                  <div>
                    <span className="font-600 text-white">{c.profiles?.name}</span>
                    <span className="text-muted-foreground ml-2">({formatRolesList(c.roles)})</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded font-600 uppercase tracking-wider text-[10px]",
                    c.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-muted-foreground'
                  )}>
                    {c.status === 'rejected' ? 'RECHAZADO' : 'FINALIZADO'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Dar de Baja Contrato */}
      {terminatingContract && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setTerminatingContract(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4 border border-red-500/20">
              <UserX className="h-7 w-7" />
            </div>
            
            <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white text-center mb-2">
              ¿Dar de baja a este jugador?
            </h3>
            
            <p className="text-sm text-muted-foreground text-center mb-6">
              Estás a punto de rescindir el contrato de <strong className="text-white">{terminatingContract.profiles?.name}</strong> en <strong className="text-white">{currentTeam.name}</strong>. El jugador dejará de pertenecer al roster oficial.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setTerminatingContract(null)}
                className="flex-1 py-2.5 rounded-md border border-border text-sm font-600 text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleTerminateContract}
                className="flex-1 py-2.5 rounded-md bg-red-600 hover:bg-red-700 text-sm font-600 text-white uppercase tracking-wider transition-colors"
              >
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
