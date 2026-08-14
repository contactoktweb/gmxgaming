'use client'

import { useState, useEffect } from 'react'
import { ScrollText, Calendar, Clock, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { cn, formatRoleTitle } from '@/lib/utils'

export function PlayerContracts() {
  const { user } = useAuth()
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchContracts() {
      if (!user) return
      const supabase = createClient()
      
      const { data } = await supabase
        .from('contracts')
        .select(`
          *,
          teams (name, logo_url)
        `)
        .eq('player_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setContracts(data)
      setLoading(false)
    }
    fetchContracts()
  }, [user])

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
              const isCancelled = contract.status === 'cancelado' || contract.status === 'cancelled'
              const isCompleted = contract.status === 'completado' || contract.status === 'completed'

              return (
                <div 
                  key={contract.id} 
                  className={cn(
                    "flex flex-col sm:flex-row gap-6 p-6 rounded-xl border transition-colors",
                    isActive ? "bg-primary/5 border-primary/20" : "bg-background border-border hover:border-white/20"
                  )}
                >
                  <div className="shrink-0 flex sm:flex-col items-center sm:items-start gap-4">
                    <img 
                      src={contract.teams?.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                      alt={contract.teams?.name} 
                      className={cn("w-16 h-16 rounded-lg object-cover bg-surface", !isActive && !isPending && "grayscale opacity-70")}
                    />
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-600 uppercase tracking-widest border",
                      isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      isPending ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      isCancelled ? "bg-red-500/10 text-red-500 border-red-500/20" :
                      "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    )}>
                      {isActive ? 'Activo' : isPending ? 'Pendiente' : isCancelled ? 'Cancelado' : 'Completado'}
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="font-display text-xl font-700 text-white uppercase">{contract.teams?.name}</h4>
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

                    <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border/50">
                      <div className="space-y-1">
                        <span className="text-[10px] font-600 uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" /> Inicio de Contrato
                        </span>
                        <p className="text-sm text-white font-500">{new Date(contract.start_date).toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-600 uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                          <Clock className="w-3 h-3" /> Fin de Contrato
                        </span>
                        <p className="text-sm text-white font-500">
                          {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Indefinido'}
                        </p>
                      </div>
                      {contract.cancellation_date && (
                        <div className="space-y-1 sm:col-span-2">
                          <span className="text-[10px] font-600 uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3" /> Fecha de Cancelación
                          </span>
                          <p className="text-sm text-white font-500">{new Date(contract.cancellation_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
