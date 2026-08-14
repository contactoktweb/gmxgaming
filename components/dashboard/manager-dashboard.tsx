'use client'

import { useState, useEffect } from 'react'
import { Check, X, Shield, Users, Clock, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { cn, formatRolesList } from '@/lib/utils'

interface Contract {
  id: string
  player_id: string
  team_id: string
  roles: string[]
  end_date: string
  status: 'active' | 'pending_manager' | 'rejected'
  created_at: string
  players: {
    name: string
    avatar: string
    game_id: string
  }
  teams: {
    name: string
    manager_id: string
  }
}

export function ManagerDashboard() {
  const { user } = useAuth()
  const supabase = createClient()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [teamName, setTeamName] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!user) return
      
      // 1. Get Manager's team
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name')
        .eq('manager_id', user.id)
        .single()
        
      if (teamsData) {
        setTeamName(teamsData.name)
        
        // 2. Get contracts for this team
        const { data: contractsData } = await supabase
          .from('contracts')
          .select(`
            *,
            players (name, avatar, game_id),
            teams (name, manager_id)
          `)
          .eq('team_id', teamsData.id)
          .order('created_at', { ascending: false })
          
        if (contractsData) {
          setContracts(contractsData as Contract[])
        }
      }
      setLoading(false)
    }
    loadData()
  }, [user])

  const handleApprove = async (contractId: string) => {
    const { error } = await supabase
      .from('contracts')
      .update({ status: 'active' })
      .eq('id', contractId)
      
    if (!error) {
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'active' } : c))
    }
  }

  const handleReject = async (contractId: string) => {
    const { error } = await supabase
      .from('contracts')
      .update({ status: 'rejected' })
      .eq('id', contractId)
      
    if (!error) {
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'rejected' } : c))
    }
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-surface border border-border"></div>
  }

  if (!teamName) {
    return (
      <div className="rounded-xl border border-border bg-surface p-12 text-center">
        <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-2">
          No eres Manager de ningún Equipo
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Esta sección es exclusiva para Managers de equipos registrados. Si ya registraste tu equipo, espera a que el staff valide tu solicitud.
        </p>
      </div>
    )
  }

  const pendingContracts = contracts.filter(c => c.status === 'pending_manager')
  const activeContracts = contracts.filter(c => c.status === 'active')

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-3xl font-700 uppercase tracking-tight text-white">
            Panel de Manager
          </h2>
          <p className="text-primary font-600 uppercase tracking-widest text-sm mt-1">{teamName}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-600 uppercase tracking-widest text-muted-foreground mb-1">Contratos Activos</p>
            <p className="font-display text-4xl font-700 text-white">{activeContracts.length}</p>
          </div>
          <Users className="h-10 w-10 text-primary opacity-20" />
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-600 uppercase tracking-widest text-muted-foreground mb-1">Solicitudes Pendientes</p>
            <p className="font-display text-4xl font-700 text-white">{pendingContracts.length}</p>
          </div>
          <Clock className="h-10 w-10 text-yellow-500 opacity-20" />
        </div>
      </div>

      {/* Pending Contracts */}
      <div className="space-y-4">
        <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-500" /> Solicitudes de Ingreso
        </h3>
        
        {pendingContracts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center text-muted-foreground">
            No tienes solicitudes pendientes de aprobación.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingContracts.map(contract => (
              <div key={contract.id} className="rounded-xl border border-yellow-500/20 bg-surface p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                <div className="flex items-start gap-4 mb-4">
                  <img src={contract.players.avatar || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} alt="" className="w-12 h-12 rounded-full border border-border object-cover" />
                  <div>
                    <h4 className="font-600 text-white truncate">{contract.players.name}</h4>
                    <p className="text-xs text-muted-foreground">ID: {contract.players.game_id}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Roles:</span>
                    <span className="text-white font-500">{formatRolesList(contract.roles)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vence:</span>
                    <span className="text-white font-500">{new Date(contract.end_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleReject(contract.id)}
                    className="flex-1 rounded border border-red-500/20 bg-red-500/10 py-2 text-xs font-600 text-red-500 hover:bg-red-500 hover:text-white transition-colors uppercase tracking-wider"
                  >
                    Rechazar
                  </button>
                  <button 
                    onClick={() => handleApprove(contract.id)}
                    className="flex-1 rounded border border-emerald-500/20 bg-emerald-500/10 py-2 text-xs font-600 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors uppercase tracking-wider"
                  >
                    Aprobar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Contracts */}
      <div className="space-y-4 pt-6">
        <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Roster Activo
        </h3>
        
        {activeContracts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center text-muted-foreground">
            No tienes jugadores activos en tu roster.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeContracts.map(contract => (
              <div key={contract.id} className="rounded-xl border border-border bg-surface p-5 hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-4 mb-4">
                  <img src={contract.players.avatar || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} alt="" className="w-10 h-10 rounded-full border border-border object-cover" />
                  <div>
                    <h4 className="font-600 text-white truncate text-sm">{contract.players.name}</h4>
                    <p className="text-xs text-primary font-500">{formatRolesList(contract.roles)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-border">
                  <span className="text-muted-foreground">Contrato hasta:</span>
                  <span className="text-white">{new Date(contract.end_date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
