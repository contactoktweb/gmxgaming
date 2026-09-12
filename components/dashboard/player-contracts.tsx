'use client'

import { useState, useEffect } from 'react'
import { ScrollText, Calendar, Clock, AlertCircle, Check, X, UserX, ShieldAlert } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { cn, formatRoleTitle } from '@/lib/utils'
import { toast } from 'sonner'

export function PlayerContracts() {
  const { user } = useAuth()
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [requestingReleaseContract, setRequestingReleaseContract] = useState<any | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchContracts() {
      if (!user) return
      
      const { data } = await supabase
        .from('contracts')
        .select(`
          *,
          teams (name, logo_url)
        `)
        .eq('player_id', user.id)
        .order('created_at', { ascending: false })

      const { data: bajaValidations } = await supabase
        .from('validations')
        .select('*')
        .eq('type', 'baja_contrato')

      const map: Record<string, any> = {}
      const adminIds: string[] = []
      if (bajaValidations) {
        bajaValidations.forEach((v: any) => {
          if (v.details?.contract_id) {
            map[v.details.contract_id] = v
            if (v.details?.admin_id) adminIds.push(v.details.admin_id)
          }
        })
      }

      // Obtener el nickname del administrador desde profiles
      const adminNickMap: Record<string, string> = {}
      if (adminIds.length > 0) {
        const { data: adminProfiles } = await supabase
          .from('profiles')
          .select('id, nickname, name')
          .in('id', adminIds)
        if (adminProfiles) {
          adminProfiles.forEach((p: any) => {
            adminNickMap[p.id] = p.nickname || p.name
          })
        }
      }

      if (data) {
        const enriched = data.map((c: any) => {
          const v = map[c.id]
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
        setContracts(enriched)
      }
      setLoading(false)
    }
    fetchContracts()
  }, [user])

  // Aceptar la baja enviada por el equipo
  const handleAcceptTermination = async (contractId: string, teamName: string) => {
    setProcessingId(contractId)
    toast.loading('Aceptando baja del equipo...', { id: 'contract-action' })

    const { error } = await supabase
      .from('contracts')
      .update({
        status: 'completado',
        conclusion_date: new Date().toISOString()
      })
      .eq('id', contractId)

    if (!error) {
      toast.success('Baja Aceptada', {
        id: 'contract-action',
        description: `Has aceptado la baja de ${teamName}. Ahora eres agente libre en esta división.`
      })
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'completado', conclusion_date: new Date().toISOString() } : c))
    } else {
      toast.error('Error al aceptar la baja: ' + error.message, { id: 'contract-action' })
    }
    setProcessingId(null)
  }

  // Rechazar la baja enviada por el equipo
  const handleRejectTermination = async (contractId: string, teamName: string) => {
    setProcessingId(contractId)
    toast.loading('Rechazando baja...', { id: 'contract-action' })

    const { error } = await supabase
      .from('contracts')
      .update({ status: 'active' })
      .eq('id', contractId)

    if (!error) {
      toast.success('Baja Rechazada', {
        id: 'contract-action',
        description: `Has rechazado la solicitud de baja con ${teamName}. Tu contrato se mantiene activo.`
      })
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'active' } : c))
    } else {
      toast.error('Error al rechazar la baja: ' + error.message, { id: 'contract-action' })
    }
    setProcessingId(null)
  }

  // Jugador solicita rescindir su contrato
  const handleRequestRelease = async () => {
    if (!requestingReleaseContract) return
    const contractId = requestingReleaseContract.id
    const teamName = requestingReleaseContract.teams?.name || 'el equipo'

    setProcessingId(contractId)
    toast.loading('Enviando solicitud de baja...', { id: 'contract-action' })

    const { error } = await supabase
      .from('contracts')
      .update({ status: 'pending_manager_release' })
      .eq('id', contractId)

    if (!error) {
      toast.success('Solicitud Enviada', {
        id: 'contract-action',
        description: `Se notificó al manager de ${teamName}. Tu contrato finalizará cuando el manager acepte tu baja.`
      })
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'pending_manager_release' } : c))
      setRequestingReleaseContract(null)
    } else {
      toast.error('Error al solicitar la baja: ' + error.message, { id: 'contract-action' })
    }
    setProcessingId(null)
  }

  // Jugador cancela su solicitud de rescisión
  const handleCancelRelease = async (contractId: string, teamName: string) => {
    setProcessingId(contractId)
    toast.loading('Cancelando solicitud...', { id: 'contract-action' })

    const { error } = await supabase
      .from('contracts')
      .update({ status: 'active' })
      .eq('id', contractId)

    if (!error) {
      toast.success('Solicitud Cancelada', {
        id: 'contract-action',
        description: `Cancelaste tu solicitud de baja con ${teamName}. Tu contrato sigue activo.`
      })
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'active' } : c))
    } else {
      toast.error('Error al cancelar la solicitud: ' + error.message, { id: 'contract-action' })
    }
    setProcessingId(null)
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando contratos...</div>
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-6 flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-primary" />
          Mis Contratos
        </h3>

        {contracts.length === 0 ? (
          <div className="text-center py-12 rounded-lg bg-background border border-dashed border-border">
            <ScrollText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h4 className="font-display text-xl font-600 text-white">Sin Contratos</h4>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
              Aún no tienes un historial de contratos registrados en la plataforma.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => {
              const isActive = contract.status === 'activo' || contract.status === 'active'
              const isPending = contract.status === 'pendiente' || contract.status === 'pending_manager'
              const isPendingPlayerRelease = contract.status === 'pending_player_release'
              const isPendingManagerRelease = contract.status === 'pending_manager_release'
              const isCancelled = contract.status === 'cancelado' || contract.status === 'cancelled'
              const isCompleted = contract.status === 'completado' || contract.status === 'completed'
              const teamName = contract.teams?.name || 'Equipo'
              const isProcessing = processingId === contract.id

              return (
                <div 
                  key={contract.id} 
                  className={cn(
                    "flex flex-col gap-6 p-6 rounded-xl border transition-colors",
                    isPendingPlayerRelease ? "bg-amber-500/5 border-amber-500/30 shadow-lg" :
                    isPendingManagerRelease ? "bg-amber-500/5 border-amber-500/20" :
                    isActive ? "bg-primary/5 border-primary/20" : "bg-background border-border hover:border-white/20"
                  )}
                >
                  {/* Banner si el equipo solicitó la baja al jugador */}
                  {isPendingPlayerRelease && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 -mb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-700 text-amber-300">
                              El equipo ha solicitado la rescisión de tu contrato
                            </p>
                            <p className="text-xs text-white/90 mt-0.5 leading-relaxed">
                              El manager de <strong>{teamName}</strong> ha pedido darte de baja. Puedes aceptar para quedar como agente libre o rechazar la solicitud.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => handleRejectTermination(contract.id, teamName)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 rounded bg-surface hover:bg-white/10 text-muted-foreground hover:text-white border border-border text-xs font-600 uppercase tracking-wider transition-colors disabled:opacity-50"
                          >
                            Rechazar
                          </button>
                          <button
                            onClick={() => handleAcceptTermination(contract.id, teamName)}
                            disabled={isProcessing}
                            className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-600 uppercase tracking-wider transition-colors flex items-center gap-1 shadow disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Aceptar Baja
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Banner si el jugador solicitó la baja al manager */}
                  {isPendingManagerRelease && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 -mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-amber-200">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Has solicitado la baja de este contrato. Esperando confirmación del manager.</span>
                      </div>
                      <button
                        onClick={() => handleCancelRelease(contract.id, teamName)}
                        disabled={isProcessing}
                        className="px-3 py-1 rounded bg-surface hover:bg-white/10 text-muted-foreground hover:text-white border border-border text-[11px] font-600 uppercase tracking-wider transition-colors self-end sm:self-center"
                      >
                        Cancelar Solicitud
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="shrink-0 flex sm:flex-col items-center sm:items-start gap-4">
                      <img 
                        src={contract.teams?.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                        alt={contract.teams?.name} 
                        className={cn("w-16 h-16 rounded-lg object-cover bg-surface", !isActive && !isPending && !isPendingPlayerRelease && !isPendingManagerRelease && "grayscale opacity-70")}
                      />
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-600 uppercase tracking-widest border text-center",
                        isPendingPlayerRelease ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        isPendingManagerRelease ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        isPending ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        isCancelled ? "bg-red-500/10 text-red-500 border-red-500/20" :
                        "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      )}>
                        {isPendingPlayerRelease ? 'Baja Solicitada' :
                         isPendingManagerRelease ? 'Baja en Trámite' :
                         isActive ? 'Activo' : 
                         isPending ? 'Pendiente' : 
                         isCancelled ? 'Cancelado' : 
                         'Completado'}
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h4 className="font-display text-xl font-700 text-white uppercase">{contract.teams?.name}</h4>
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-700 uppercase tracking-wider border",
                              contract.team_gender_category === 'female' 
                                ? "bg-pink-500/10 text-pink-400 border-pink-500/20" 
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            )}>
                              {contract.team_gender_category === 'female' ? 'División Femenil' : 'División Varonil / Mixta'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-xs text-muted-foreground font-500">Roles asignados:</span>
                            {Array.isArray(contract.roles) ? (
                              contract.roles.map((r: string, idx: number) => (
                                <span 
                                  key={idx} 
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-600"
                                >
                                  {formatRoleTitle(r)}
                                </span>
                              ))
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-600">
                                {formatRoleTitle(contract.roles || contract.role || 'Jugador')}
                              </span>
                            )}
                          </div>
                        </div>

                        {isActive && (
                          <button
                            onClick={() => setRequestingReleaseContract(contract)}
                            className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 text-xs font-600 uppercase tracking-wider transition-colors flex items-center gap-1 self-start shrink-0"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Solicitar Baja
                          </button>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border/50">
                        <div className="space-y-1">
                          <span className="text-[10px] font-600 uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" /> Inicio de Contrato
                          </span>
                          <p className="text-sm text-white font-500">{contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'Pendiente'}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-600 uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> Fin de Contrato
                          </span>
                          <p className="text-sm text-white font-500">
                            {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Indefinido'}
                          </p>
                        </div>
                        {contract.conclusion_date && (
                          <div className="space-y-1 sm:col-span-2">
                            <span className="text-[10px] font-600 uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                              <AlertCircle className="w-3 h-3" /> Fecha de Conclusión / Baja
                            </span>
                            <p className="text-sm text-white font-500">{new Date(contract.conclusion_date).toLocaleDateString()}</p>
                          </div>
                        )}
                        {contract.cancellation_date && (
                          <div className="space-y-1 sm:col-span-2">
                            <span className="text-[10px] font-600 uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                              <AlertCircle className="w-3 h-3" /> Fecha de Cancelación
                            </span>
                            <p className="text-sm text-white font-500">{new Date(contract.cancellation_date).toLocaleDateString()}</p>
                          </div>
                        )}
                        {contract.bajaJustification && (
                          <div className="sm:col-span-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-200">
                            <div className="flex items-center justify-between font-semibold text-[11px] uppercase tracking-wider text-amber-400 mb-1">
                              <span>Motivo de Baja Administrativa</span>
                              {contract.bajaAdmin && <span>Por: {contract.bajaAdmin}</span>}
                            </div>
                            <p className="italic">"{contract.bajaJustification}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal para Solicitar Baja de Contrato */}
      {requestingReleaseContract && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setRequestingReleaseContract(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4 border border-red-500/20">
              <ShieldAlert className="h-7 w-7" />
            </div>
            
            <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white text-center mb-2">
              ¿Solicitar rescisión de contrato?
            </h3>
            
            <p className="text-sm text-muted-foreground text-center mb-6">
              Estás a punto de solicitar la baja de tu contrato con <strong className="text-white">{requestingReleaseContract.teams?.name}</strong>. Se notificará al manager para que acepte tu desvinculación. El contrato permanecerá activo hasta su confirmación.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRequestingReleaseContract(null)}
                className="flex-1 py-2.5 rounded-md border border-border text-sm font-600 text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRequestRelease}
                disabled={processingId === requestingReleaseContract.id}
                className="flex-1 py-2.5 rounded-md bg-red-600 hover:bg-red-700 text-sm font-600 text-white uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Confirmar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
