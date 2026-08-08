'use client'

import { useState, useEffect } from 'react'
import { Shield, ShieldAlert, History, Calendar } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export function PlayerTeams() {
  const { user } = useAuth()
  const [activeTeam, setActiveTeam] = useState<any>(null)
  const [pastTeams, setPastTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTeams() {
      if (!user) return
      const supabase = createClient()
      
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
        const active = data.find(c => c.status === 'activo' || c.status === 'pendiente')
        if (active) setActiveTeam(active)
        
        const past = data.filter(c => c.status === 'completado' || c.status === 'cancelado')
        setPastTeams(past)
      }
      setLoading(false)
    }
    fetchTeams()
  }, [user])

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando equipos...</div>
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Equipo Actual */}
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-6 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Mi Equipo Actual
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
              href={`/equipos/${activeTeam.teams?.id}`} 
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

      {/* Historial de Equipos */}
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
                    {new Date(contract.start_date).toLocaleDateString()} - {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Cancelado'}
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

    </div>
  )
}
