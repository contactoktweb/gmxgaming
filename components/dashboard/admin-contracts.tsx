'use client'

import { useState, useEffect } from 'react'
import { ScrollText, Calendar, Building2, User } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface Contract {
  id: string
  player_name: string
  team_name: string
  start_date: string
  duration: string
  status: 'active' | 'expired' | 'pending'
  documentUrl?: string
}

export function AdminContracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchContracts() {
      setLoading(true)
      const { data } = await supabase.from('contracts').select('*').order('created_at', { ascending: false })
      if (data) setContracts(data as Contract[])
      setLoading(false)
    }
    fetchContracts()
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-6">
          Registro de Contratos
        </h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground animate-pulse">Cargando contratos...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground">No hay contratos registrados aún.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 font-600 text-muted-foreground">ID</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">JUGADOR</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">EQUIPO</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">VIGENCIA / INICIO</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">ESTADO</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground text-right">DOCUMENTO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contracts.map(contract => (
                  <tr key={contract.id} className="transition-colors hover:bg-white/5">
                    <td className="px-4 py-4 text-muted-foreground font-mono">#{contract.id.substring(0, 8)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 font-500 text-white">
                        <User className="w-4 h-4 text-primary" />
                        {contract.player_name}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="w-4 h-4 text-white/50" />
                        {contract.team_name}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 text-white/50" />
                        {contract.start_date || 'TBD'} ({contract.duration || 'N/A'})
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {contract.status === 'active' ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-500 text-emerald-500 ring-1 ring-inset ring-emerald-500/20">
                          Vigente
                        </span>
                      ) : contract.status === 'pending' ? (
                        <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-500 text-yellow-500 ring-1 ring-inset ring-yellow-500/20">
                          Pendiente
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-1 text-xs font-500 text-red-500 ring-1 ring-inset ring-red-500/20">
                          Vencido
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <a 
                        href={contract.documentUrl || '#'}
                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                        title="Ver PDF"
                      >
                        <ScrollText className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
