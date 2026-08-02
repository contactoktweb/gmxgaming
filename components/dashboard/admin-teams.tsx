'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Users, MapPin, ExternalLink, Eye, Trash2, X, AlertCircle, Check, ImageIcon, FileText } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'

interface Team {
  id: string
  name: string
  captain: string
  region: string
  logo: string
  status: string
  points: number
  foundation_date: string
}

export function AdminTeams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: string, name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true)
      const { data } = await supabase.from('teams').select('*').order('created_at', { ascending: false })
      if (data) setTeams(data as Team[])
      setLoading(false)
    }
    fetchTeams()
  }, [])

  useEffect(() => {
    if (selectedTeam || confirmAction) {
      window.__lenis?.stop()
    } else {
      window.__lenis?.start()
    }
    return () => { window.__lenis?.start() }
  }, [selectedTeam, confirmAction])

  const handleDelete = async () => {
    if (confirmAction) {
      await supabase.from('teams').delete().eq('id', confirmAction.id)
      setTeams(prev => prev.filter(t => t.id !== confirmAction.id))
      setConfirmAction(null)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white">
            Equipos Registrados
          </h2>
          <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-600 text-primary">
            {teams.length} Total
          </span>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground animate-pulse">Cargando equipos...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground">No hay equipos registrados aún.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map(team => (
              <div key={team.id} className="group relative flex flex-col items-center rounded-lg border border-border bg-background p-6 text-center transition-colors hover:border-primary/50">
                
                <div className="absolute right-3 top-3 flex flex-col gap-2">
                  <button 
                    onClick={() => setSelectedTeam(team)}
                    title="Ver Detalles"
                    className="p-2 text-muted-foreground hover:text-white transition-colors bg-surface border border-border rounded-md hover:border-primary"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setConfirmAction({ id: team.id, name: team.name })}
                    title="Eliminar Equipo"
                    className="p-2 text-muted-foreground hover:text-red-500 transition-colors bg-surface border border-border rounded-md hover:border-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <img 
                  src={team.logo || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                  alt={team.name} 
                  className="mb-4 h-20 w-20 rounded-full object-cover ring-4 ring-surface"
                />
                <h3 className="mb-1 font-display text-lg font-700 uppercase text-white group-hover:text-primary transition-colors">
                  {team.name}
                </h3>
                
                <div className="mb-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    <span>{team.captain || 'Sin Capitán'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{team.region || 'Sin Región'}</span>
                  </div>
                </div>

                <div className="mt-auto flex w-full items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-1.5 text-sm font-500 text-white">
                    <Users className="h-4 w-4 text-primary" />
                    {team.status === 'active' ? 'Activo' : 'Inactivo'} <span className="text-muted-foreground text-xs font-400">estado</span>
                  </div>
                  <button className="text-xs font-500 text-primary hover:text-white transition-colors flex items-center gap-1">
                    Ver Detalles <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedTeam(null)} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="relative h-24 bg-gradient-to-r from-primary/20 to-transparent">
              <button 
                onClick={() => setSelectedTeam(null)}
                className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-8 pb-8">
              <div className="-mt-12 mb-4 flex justify-between items-end">
                <img 
                  src={selectedTeam.logo || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                  alt={selectedTeam.name} 
                  className="h-24 w-24 rounded-full border-4 border-surface object-cover bg-surface"
                />
              </div>

              <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-6">
                {selectedTeam.name}
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-600 mb-1">Capitán</p>
                    <p className="text-sm font-500 text-white truncate">{selectedTeam.captain || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-600 mb-1">Puntos</p>
                    <p className="text-sm font-500 text-white truncate">{selectedTeam.points || 0}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-600 mb-1">Región</p>
                    <p className="text-sm font-500 text-white truncate">{selectedTeam.region || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-600 mb-1">Fundación</p>
                    <p className="text-sm font-500 text-white truncate">{selectedTeam.foundation_date || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-6 bg-red-500/10 text-red-500">
              <AlertCircle className="h-8 w-8" />
            </div>

            <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-2">
              ¿Eliminar Equipo?
            </h3>
            
            <p className="text-muted-foreground mb-8">
              Estás a punto de eliminar al equipo:<br/>
              <span className="text-white mt-2 block font-500">{confirmAction.name}</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-md border border-border bg-transparent px-4 py-3 font-display text-[13px] font-600 uppercase tracking-widest text-muted-foreground transition-colors hover:text-white"
              >
                CANCELAR
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 rounded-md px-4 py-3 font-display text-[13px] font-600 uppercase tracking-widest text-white transition-colors relative overflow-hidden clip-corner group bg-red-600 hover:bg-red-500"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  ELIMINAR <Trash2 className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
