'use client'

import { ScrollText, Calendar, Building2, User } from 'lucide-react'

interface Contract {
  id: string
  player: string
  team: string
  startDate: string
  endDate: string
  status: 'active' | 'expired'
  documentUrl: string
}

const mockContracts: Contract[] = [
  { id: '1', player: 'Sinner', team: 'STARBOYS', startDate: '2024-01-01', endDate: '2024-12-31', status: 'active', documentUrl: '#' },
  { id: '2', player: 'Tamaal', team: 'ARTAUD', startDate: '2023-06-15', endDate: '2024-06-15', status: 'expired', documentUrl: '#' },
  { id: '3', player: 'Jose Jose', team: 'HYPE TEAM', startDate: '2024-03-01', endDate: '2025-03-01', status: 'active', documentUrl: '#' },
]

export function AdminContracts() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-6">
          Registro de Contratos
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-background">
              <tr>
                <th className="px-4 py-3 font-600 text-muted-foreground">ID</th>
                <th className="px-4 py-3 font-600 text-muted-foreground">JUGADOR</th>
                <th className="px-4 py-3 font-600 text-muted-foreground">EQUIPO</th>
                <th className="px-4 py-3 font-600 text-muted-foreground">VIGENCIA</th>
                <th className="px-4 py-3 font-600 text-muted-foreground">ESTADO</th>
                <th className="px-4 py-3 font-600 text-muted-foreground text-right">DOCUMENTO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockContracts.map(contract => (
                <tr key={contract.id} className="transition-colors hover:bg-white/5">
                  <td className="px-4 py-4 text-muted-foreground font-mono">#{contract.id}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 font-500 text-white">
                      <User className="w-4 h-4 text-primary" />
                      {contract.player}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="w-4 h-4 text-white/50" />
                      {contract.team}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4 text-white/50" />
                      {contract.startDate} - {contract.endDate}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {contract.status === 'active' ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-500 text-emerald-500 ring-1 ring-inset ring-emerald-500/20">
                        Vigente
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-1 text-xs font-500 text-red-500 ring-1 ring-inset ring-red-500/20">
                        Vencido
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <a 
                      href={contract.documentUrl}
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
      </div>
    </div>
  )
}
