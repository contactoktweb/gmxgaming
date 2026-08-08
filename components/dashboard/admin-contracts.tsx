'use client'

import { useState, useEffect, useMemo } from 'react'
import { ScrollText, Calendar, Building2, User, Search, Ban, Download, Filter } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { GmxButton } from '@/components/gmx-button'
import { cn } from '@/lib/utils'

interface Contract {
  id: string
  player_name: string
  team_name: string
  start_date: string
  end_date: string
  cancellation_date?: string
  conclusion_date: string
  status: string
  documentUrl?: string
}

export function AdminContracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTeam, setFilterTeam] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    async function fetchContracts() {
      setLoading(true)
      const { data } = await supabase
        .from('contracts')
        .select('*, profiles(name), teams(name)')
        .order('created_at', { ascending: false })
      
      if (data) {
        const formattedContracts = data.map((c: any) => {
          const computedConclusion = c.cancellation_date || c.end_date
          return {
            id: c.id,
            player_name: c.profiles?.name || 'Jugador Desconocido',
            team_name: c.teams?.name || 'Equipo Desconocido',
            start_date: c.start_date || new Date(c.created_at).toISOString(),
            end_date: c.end_date || 'N/A',
            cancellation_date: c.cancellation_date,
            conclusion_date: computedConclusion || 'N/A',
            status: c.status
          }
        })
        setContracts(formattedContracts)
      }
      setLoading(false)
    }
    fetchContracts()
  }, [])

  const handleCancelContract = async (id: string) => {
    const confirmation = window.prompt('Para cancelar este contrato forzosamente, escribe "SI"')
    if (confirmation === 'SI') {
      const now = new Date().toISOString()
      const { error } = await supabase.from('contracts').update({ 
        status: 'Cancelado',
        cancellation_date: now
      }).eq('id', id)
      
      if (!error) {
        setContracts(prev => prev.map(c => c.id === id ? { ...c, status: 'Cancelado', cancellation_date: now, conclusion_date: now } : c))
      }
    }
  }

  const uniqueTeams = useMemo(() => Array.from(new Set(contracts.map(c => c.team_name))), [contracts])

  const filteredContracts = useMemo(() => {
    let result = contracts.filter(c => {
      if (filterTeam !== 'all' && c.team_name !== filterTeam) return false
      if (filterStatus !== 'all' && c.status !== filterStatus) return false
      if (searchQuery) {
        if (!c.player_name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      }
      if (dateFrom) {
        if (new Date(c.conclusion_date) < new Date(dateFrom)) return false
      }
      if (dateTo) {
        if (new Date(c.conclusion_date) > new Date(dateTo)) return false
      }
      return true
    })

    // Sort by conclusion date descending
    result.sort((a, b) => {
      if (a.conclusion_date === 'N/A') return 1
      if (b.conclusion_date === 'N/A') return -1
      return new Date(b.conclusion_date).getTime() - new Date(a.conclusion_date).getTime()
    })

    return result
  }, [contracts, filterTeam, filterStatus, searchQuery, dateFrom, dateTo])

  const getStatusBadge = (status: string) => {
    if (status === 'active') return <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-500 text-emerald-500 ring-1 ring-inset ring-emerald-500/20">Vigente</span>
    if (status === 'Cancelado') return <span className="inline-flex rounded-full bg-red-500/10 px-2 py-1 text-xs font-500 text-red-500 ring-1 ring-inset ring-red-500/20">Cancelado</span>
    if (status.includes('Petición')) return <span className="inline-flex rounded-full bg-purple-500/10 px-2 py-1 text-xs font-500 text-purple-500 ring-1 ring-inset ring-purple-500/20 text-center">{status}</span>
    if (status.startsWith('pending')) return <span className="inline-flex rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-500 text-yellow-500 ring-1 ring-inset ring-yellow-500/20">Pendiente</span>
    return <span className="inline-flex rounded-full bg-surface px-2 py-1 text-xs font-500 text-muted-foreground ring-1 ring-inset ring-border">{status}</span>
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        
        {/* Header & Filters */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white shrink-0">
              Contratos
            </h2>
            <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-600 text-primary">
              {filteredContracts.length} Total
            </span>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Buscar jugador..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 rounded-md border border-border bg-background pl-9 pr-4 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto items-center">
              <span className="text-xs text-muted-foreground font-500 uppercase">Conclusión:</span>
              <input 
                type="date" 
                value={dateFrom} 
                onChange={e => setDateFrom(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-2 text-sm text-white focus:border-primary focus:outline-none" 
              />
              <span className="text-muted-foreground">-</span>
              <input 
                type="date" 
                value={dateTo} 
                onChange={e => setDateTo(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-2 text-sm text-white focus:border-primary focus:outline-none" 
              />
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                className="flex-1 sm:flex-none rounded-md border border-border bg-background px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              >
                <option value="all">Todos los Estados</option>
                <option value="active">Vigente</option>
                <option value="Cancelado">Cancelado</option>
                <option value="Petición Cancelación - Jugador">Petición Cancelación - Jugador</option>
                <option value="Petición Cancelación - Manager">Petición Cancelación - Manager</option>
              </select>

              <select 
                value={filterTeam} 
                onChange={e => setFilterTeam(e.target.value)}
                className="flex-1 sm:flex-none rounded-md border border-border bg-background px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              >
                <option value="all">Todos los Equipos</option>
                {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground animate-pulse">Cargando contratos...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="flex justify-center items-center py-12 border border-dashed border-border rounded-lg bg-background/50">
            <p className="text-muted-foreground">No hay contratos que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 font-600 text-muted-foreground">ID</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">JUGADOR</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">EQUIPO</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">INICIO</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">CONCLUSIÓN</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">ESTADO</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {filteredContracts.map(contract => (
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
                    <td className="px-4 py-4 text-muted-foreground">
                      {new Date(contract.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-white font-500">
                      {contract.conclusion_date !== 'N/A' ? new Date(contract.conclusion_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(contract.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <a 
                          href={contract.documentUrl || '#'}
                          className="inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                          title="Ver PDF"
                        >
                          <ScrollText className="h-4 w-4" />
                        </a>
                        {(contract.status === 'active' || contract.status.includes('Petición')) && (
                          <button 
                            onClick={() => handleCancelContract(contract.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-colors hover:border-red-500 hover:text-red-500"
                            title="Cancelar Contrato"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                      </div>
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
