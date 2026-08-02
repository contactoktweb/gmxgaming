'use client'

import { useState, useEffect } from 'react'
import { Trophy, Calendar, Users, Edit, Plus, Trash2, CheckCircle2, Eye, X, AlertCircle, Gamepad2, Link } from 'lucide-react'
import { GmxButton } from '@/components/gmx-button'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'

interface Tournament {
  id: string
  name: string
  game: string
  status: 'upcoming' | 'ongoing' | 'finished'
  prize: string
  start_date: string
  end_date: string
  participants: number
}

export function AdminTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: string, name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchTournaments = async () => {
    setLoading(true)
    const { data } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false })
    if (data) setTournaments(data as Tournament[])
    setLoading(false)
  }

  useEffect(() => {
    fetchTournaments()
  }, [])

  useEffect(() => {
    if (selectedTournament || confirmAction) {
      window.__lenis?.stop()
    } else {
      window.__lenis?.start()
    }
    return () => { window.__lenis?.start() }
  }, [selectedTournament, confirmAction])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    
    const newTournament = {
      name: formData.get('name') as string,
      game: formData.get('game') as string,
      start_date: formData.get('start_date') as string,
      participants: parseInt(formData.get('participants') as string, 10),
      status: 'upcoming'
    }

    const { error } = await supabase.from('tournaments').insert(newTournament)
    
    if (!error) {
      setShowSuccess(true)
      fetchTournaments()
      setTimeout(() => {
        setShowSuccess(false)
        setIsCreating(false)
      }, 2000)
    }
  }

  const handleDelete = async () => {
    if (confirmAction) {
      await supabase.from('tournaments').delete().eq('id', confirmAction.id)
      setTournaments(prev => prev.filter(t => t.id !== confirmAction.id))
      setConfirmAction(null)
    }
  }

  if (isCreating) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-6">
          Crear Nuevo Torneo
        </h2>
        
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in duration-300">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
            <h3 className="font-display text-2xl font-700 text-white">¡TORNEO CREADO!</h3>
            <p className="text-muted-foreground mt-2">El torneo se ha publicado exitosamente.</p>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-500 text-white">Nombre del Torneo</label>
                <input name="name" type="text" required className="w-full rounded-md border border-border bg-background px-4 py-3 text-white focus:border-primary focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-500 text-white">Juego</label>
                <input name="game" type="text" defaultValue="Mobile Legends" required className="w-full rounded-md border border-border bg-background px-4 py-3 text-white focus:border-primary focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-500 text-white">Fecha de Inicio</label>
                <input name="start_date" type="date" required className="w-full rounded-md border border-border bg-background px-4 py-3 text-white focus:border-primary focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-500 text-white">Cupo de Equipos</label>
                <input name="participants" type="number" required min="2" className="w-full rounded-md border border-border bg-background px-4 py-3 text-white focus:border-primary focus:outline-none" />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="px-6 py-3 font-display text-sm font-600 uppercase tracking-wider text-muted-foreground hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <GmxButton type="submit">
                Guardar Torneo
              </GmxButton>
            </div>
          </form>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white">
            Gestor de Torneos
          </h2>
          <GmxButton onClick={() => setIsCreating(true)} className="gap-2 shrink-0 py-2.5">
            <Plus className="w-4 h-4" />
            Crear Torneo
          </GmxButton>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground animate-pulse">Cargando torneos...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground">No hay torneos registrados aún.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tournaments.map(tournament => (
              <div key={tournament.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border bg-background p-4 sm:p-5 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-600 text-white">{tournament.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Gamepad2 className="w-3 h-3" /> {tournament.game}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {tournament.start_date || 'TBD'}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {tournament.participants} equipos
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                  <span className={`px-2.5 py-1 text-[10px] font-600 uppercase tracking-widest rounded-full mr-2 ${
                    tournament.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    tournament.status === 'ongoing' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    'bg-white/5 text-muted-foreground border border-white/10'
                  }`}>
                    {tournament.status === 'upcoming' ? 'Próximo' : tournament.status === 'ongoing' ? 'En Curso' : 'Finalizado'}
                  </span>
                  
                  <button 
                    onClick={() => setSelectedTournament(tournament)}
                    title="Ver Detalles" 
                    className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-md transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setConfirmAction({ id: tournament.id, name: tournament.name })} 
                    title="Eliminar" 
                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedTournament && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedTournament(null)} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border p-6 bg-background">
              <div>
                <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  {selectedTournament.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedTournament(null)}
                className="text-muted-foreground hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-4 mb-6">
                <span className={cn(
                  "px-3 py-1 text-xs font-600 uppercase tracking-widest rounded-full",
                  selectedTournament.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  selectedTournament.status === 'ongoing' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  'bg-white/5 text-muted-foreground border border-white/10'
                )}>
                  {selectedTournament.status === 'upcoming' ? 'Próximo' : selectedTournament.status === 'ongoing' ? 'En Curso' : 'Finalizado'}
                </span>
                <span className="flex items-center gap-1.5 text-sm font-500 text-white">
                  <Gamepad2 className="w-4 h-4 text-primary" /> {selectedTournament.game}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-600 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Fecha
                  </p>
                  <p className="text-sm font-500 text-white truncate">{selectedTournament.start_date || 'TBD'}</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-600 mb-1 flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> Equipos
                  </p>
                  <p className="text-sm font-500 text-white truncate">{selectedTournament.participants}</p>
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
              ¿Eliminar Torneo?
            </h3>
            
            <p className="text-muted-foreground mb-8">
              Estás a punto de eliminar el torneo:<br/>
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
