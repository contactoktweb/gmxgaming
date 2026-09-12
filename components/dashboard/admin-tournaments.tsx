'use client'

import { useState, useEffect } from 'react'
import { Trophy, Calendar, Users, Edit, Plus, Trash2, CheckCircle2, Eye, X, AlertCircle, Gamepad2, Link, Save, Swords, ChevronDown, Loader2 } from 'lucide-react'
import { GmxButton } from '@/components/gmx-button'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Tournament {
  id: string
  name: string
  game: string
  type?: string
  description?: string
  status: 'upcoming' | 'ongoing' | 'finished'
  start_date: string
  end_date: string
  prizepool_total: string
  prizepool_distribution: any
  template_id: string
  templates?: { name: string, type: string, logo_url: string }
}

interface TournamentEditState {
  name: string
  game: string
  type: string
  description: string
  status: 'upcoming' | 'ongoing' | 'finished'
  start_date: string
  end_date: string
  prizepool_total: string
  prizepool_distribution: string[]
}

interface Team {
  id: string
  name: string
  logo_url: string
}

interface Match {
  id: string
  tournament_id: string
  phase: string
  match_date: string
  team1_id: string
  team2_id: string
  team1_score: number
  team2_score: number
  team1?: Team
  team2?: Team
}

export function AdminTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])
  
  const [isCreating, setIsCreating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [editInfo, setEditInfo] = useState<TournamentEditState | null>(null)
  const [isSavingInfo, setIsSavingInfo] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'teams' | 'matches'>('info')
  const [confirmAction, setConfirmAction] = useState<{ id: string, name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Data for tabs
  const [tourneyTeams, setTourneyTeams] = useState<any[]>([])
  const [tourneyMatches, setTourneyMatches] = useState<Match[]>([])
  const [newTeamId, setNewTeamId] = useState('')
  const [newMatch, setNewMatch] = useState({ phase: 'Fase de Grupos', date: '', t1: '', t2: '', s1: 0, s2: 0 })
  const [editMatch, setEditMatch] = useState<{ id: string, s1: number, s2: number, t1_name?: string, t2_name?: string } | null>(null)
  const [matchToDelete, setMatchToDelete] = useState<any | null>(null)

  // Tournament form dates
  const todayStr = new Date().toISOString().split('T')[0]
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')

  const supabase = createClient()

  const fetchBaseData = async () => {
    setLoading(true)
    const [tRes, tmplRes, teamsRes] = await Promise.all([
      supabase.from('tournaments').select('*, templates:tournament_templates(name, type, logo_url)').order('created_at', { ascending: false }),
      supabase.from('tournament_templates').select('*'),
      supabase.from('teams').select('id, name, logo_url').eq('status', 'active')
    ])
    
    if (tRes.data) setTournaments(tRes.data as any)
    if (tmplRes.data) setTemplates(tmplRes.data)
    if (teamsRes.data) setAvailableTeams(teamsRes.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchBaseData()
  }, [])

  const fetchTourneyMatches = async (tournamentId: string) => {
    const { data: rawMatches, error } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('match_date', { ascending: true })

    if (error) {
      console.error('Error fetching matches:', error)
      return
    }

    if (rawMatches) {
      const teamIds = new Set<string>()
      rawMatches.forEach(m => {
        const t1Id = m.team_a_id || m.team1_id
        const t2Id = m.team_b_id || m.team2_id
        if (t1Id) teamIds.add(t1Id)
        if (t2Id) teamIds.add(t2Id)
      })

      const teamMap = new Map<string, Team>()
      availableTeams.forEach(t => teamMap.set(t.id, t))

      const missingIds = Array.from(teamIds).filter(id => !teamMap.has(id))
      if (missingIds.length > 0) {
        const { data: fetchedTeams } = await supabase
          .from('teams')
          .select('id, name, logo_url')
          .in('id', missingIds)
        if (fetchedTeams) {
          fetchedTeams.forEach(t => teamMap.set(t.id, t))
        }
      }

      const populatedMatches = rawMatches.map(m => {
        const t1Id = m.team_a_id || m.team1_id
        const t2Id = m.team_b_id || m.team2_id
        return {
          ...m,
          team1_id: t1Id,
          team2_id: t2Id,
          team1_score: m.score_a ?? m.team1_score ?? 0,
          team2_score: m.score_b ?? m.team2_score ?? 0,
          team1: teamMap.get(t1Id) || { id: t1Id, name: 'Equipo A', logo_url: '' },
          team2: teamMap.get(t2Id) || { id: t2Id, name: 'Equipo B', logo_url: '' }
        }
      })

      setTourneyMatches(populatedMatches as any)
    }
  }

  // Load Tab Data
  useEffect(() => {
    if (selectedTournament) {
      if (activeTab === 'teams') {
        supabase
          .from('tournament_teams')
          .select('tournament_id, team_id, teams(id, name, logo_url)')
          .eq('tournament_id', selectedTournament.id)
          .then(({ data, error }) => {
            if (error) console.error('Error fetching tournament teams:', error)
            if (data) setTourneyTeams(data.filter((tt: any) => tt.teams))
          })
      } else if (activeTab === 'matches') {
        fetchTourneyMatches(selectedTournament.id)
      }
    }
  }, [selectedTournament, activeTab, availableTeams])

  // Sincronizar datos de edición cuando se abre o cambia el torneo seleccionado
  useEffect(() => {
    if (selectedTournament) {
      setEditInfo({
        name: selectedTournament.name || '',
        game: selectedTournament.game || 'Mobile Legends',
        status: selectedTournament.status || 'upcoming',
        description: selectedTournament.description || '',
        start_date: selectedTournament.start_date ? selectedTournament.start_date.split('T')[0] : '',
        end_date: selectedTournament.end_date ? selectedTournament.end_date.split('T')[0] : '',
        prizepool_total: String(selectedTournament.prizepool_total ?? ''),
        type: selectedTournament.type || selectedTournament.templates?.type || '',
        prizepool_distribution: Array.isArray(selectedTournament.prizepool_distribution) && selectedTournament.prizepool_distribution.length > 0
          ? selectedTournament.prizepool_distribution.map(String)
          : ['']
      })
    } else {
      setEditInfo(null)
    }
  }, [selectedTournament])

  useEffect(() => {
    if (selectedTournament || confirmAction) {
      window.__lenis?.stop()
    } else {
      window.__lenis?.start()
    }
    return () => { window.__lenis?.start() }
  }, [selectedTournament, confirmAction])

  const [distPlaces, setDistPlaces] = useState<string[]>([''])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    
    const prizepoolTotalStr = formData.get('prizepool_total') as string
    
    const parseNumber = (val: string) => {
      const num = Number(val.replace(/[^0-9.-]+/g, ""))
      return isNaN(num) ? 0 : num
    }

    const total = parseNumber(prizepoolTotalStr)
    const sumPlaces = distPlaces.reduce((acc, curr) => acc + parseNumber(curr), 0)

    if (total > 0 && sumPlaces !== total) {
      alert(`La suma de la distribución de premios (${sumPlaces}) no coincide con la Bolsa Total (${total}). Por favor verifica los montos.`)
      return
    }

    const templateId = formData.get('template_id') as string
    const tmpl = templates.find(t => t.id === templateId)
    // Si no hay plantilla, usar el juego seleccionado directamente en el form
    const gameSelected = (formData.get('game') as string) || (tmpl ? tmpl.game : 'Mobile Legends')

    const newTournament = {
      name: formData.get('name') as string,
      game: gameSelected,
      description: (formData.get('description') as string)?.trim() || null,
      template_id: templateId || null,
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string,
      prizepool_total: formData.get('prizepool_total') as string,
      prizepool_distribution: distPlaces,
      status: 'upcoming'
    }

    const { error } = await supabase.from('tournaments').insert(newTournament)
    if (!error) {
      setShowSuccess(true)
      fetchBaseData()
      setTimeout(() => {
        setShowSuccess(false)
        setIsCreating(false)
        setDistPlaces([''])
        setFormStartDate('')
        setFormEndDate('')
      }, 2000)
    } else {
      alert('Error al crear el torneo: ' + error.message)
    }
  }

  const handleDelete = async () => {
    if (confirmAction) {
      await supabase.from('tournaments').delete().eq('id', confirmAction.id)
      setTournaments(prev => prev.filter(t => t.id !== confirmAction.id))
      setConfirmAction(null)
    }
  }

  const handleAddTeam = async () => {
    if (!selectedTournament || !newTeamId) return

    // Evitar duplicados en estado local
    const alreadyExists = tourneyTeams.some(
      tt => tt.teams?.id === newTeamId || tt.team_id === newTeamId
    )
    if (alreadyExists) {
      toast.warning('Este equipo ya está agregado a este torneo.')
      setNewTeamId('')
      return
    }

    const { error } = await supabase
      .from('tournament_teams')
      .insert({ tournament_id: selectedTournament.id, team_id: newTeamId })

    if (error) {
      if (error.code === '23505' || error.message.includes('unique constraint') || error.message.includes('duplicate key')) {
        toast.info('El equipo ya formaba parte de este torneo.')
        // Recargar equipos para sincronizar UI
        const { data } = await supabase
          .from('tournament_teams')
          .select('tournament_id, team_id, teams(id, name, logo_url)')
          .eq('tournament_id', selectedTournament.id)
        if (data) setTourneyTeams(data.filter((tt: any) => tt.teams))
        setNewTeamId('')
        return
      }
      toast.error('Error al agregar equipo: ' + error.message)
      return
    }

    toast.success('Equipo agregado al torneo con éxito')
    // Buscar el equipo en availableTeams para actualizar el estado local
    const addedTeam = availableTeams.find(t => t.id === newTeamId)
    if (addedTeam) {
      setTourneyTeams(prev => [
        ...prev,
        {
          tournament_id: selectedTournament.id,
          team_id: newTeamId,
          teams: addedTeam,
        },
      ])
    }
    setNewTeamId('')
  }

  const handleRemoveTeam = async (teamId: string) => {
    if (!selectedTournament) return
    const { error } = await supabase
      .from('tournament_teams')
      .delete()
      .eq('tournament_id', selectedTournament.id)
      .eq('team_id', teamId)

    if (error) {
      toast.error('Error al eliminar equipo: ' + error.message)
      return
    }

    toast.success('Equipo eliminado del torneo')
    setTourneyTeams(prev => prev.filter(t => t.teams?.id !== teamId && t.team_id !== teamId))
  }

  const handleAddMatch = async () => {
    if (!selectedTournament) return

    if (!newMatch.t1 || !newMatch.t2) {
      toast.error('Debes seleccionar los dos equipos para el encuentro')
      return
    }

    if (newMatch.t1 === newMatch.t2) {
      toast.error('Los dos equipos deben ser diferentes')
      return
    }

    if (!newMatch.date) {
      toast.error('Debes seleccionar una fecha para el encuentro')
      return
    }

    const matchDateStr = newMatch.date.split('T')[0]
    const tourneyStartStr = selectedTournament.start_date ? selectedTournament.start_date.split('T')[0] : null
    const tourneyEndStr = selectedTournament.end_date ? selectedTournament.end_date.split('T')[0] : null

    if (tourneyStartStr && matchDateStr < tourneyStartStr) {
      toast.error(`La fecha del encuentro no puede ser anterior al inicio del torneo (${new Date(selectedTournament.start_date).toLocaleDateString()})`)
      return
    }

    if (tourneyEndStr && matchDateStr > tourneyEndStr) {
      toast.error(`La fecha del encuentro no puede ser posterior a la finalización del torneo (${new Date(selectedTournament.end_date).toLocaleDateString()})`)
      return
    }

    const { error } = await supabase.from('matches').insert({
      tournament_id: selectedTournament.id,
      phase: newMatch.phase || 'Fase de Grupos',
      match_date: newMatch.date,
      team_a_id: newMatch.t1,
      team_b_id: newMatch.t2,
      score_a: newMatch.s1 || 0,
      score_b: newMatch.s2 || 0,
      status: 'scheduled'
    })

    if (error) {
      console.error('Error creating match:', error)
      toast.error('Error al crear el encuentro: ' + error.message)
    } else {
      toast.success('Encuentro programado exitosamente')
      fetchTourneyMatches(selectedTournament.id)
      setNewMatch({ 
        phase: newMatch.phase || 'Fase de Grupos', 
        date: tourneyStartStr || '', 
        t1: '', 
        t2: '', 
        s1: 0, 
        s2: 0 
      })
    }
  }

  const handleConfirmDeleteMatch = async () => {
    if (!matchToDelete) return
    const matchId = matchToDelete.id
    const { error } = await supabase.from('matches').delete().eq('id', matchId)
    if (!error) {
      setTourneyMatches(prev => prev.filter(m => m.id !== matchId))
      toast.success('Encuentro eliminado correctamente')
    } else {
      toast.error('Error al eliminar el encuentro: ' + error.message)
    }
    setMatchToDelete(null)
  }

  const handleUpdateMatchScore = async () => {
    if (!editMatch) return
    const { error } = await supabase.from('matches').update({
      score_a: editMatch.s1,
      score_b: editMatch.s2
    }).eq('id', editMatch.id)

    if (!error) {
      setTourneyMatches(prev => prev.map(m => m.id === editMatch.id ? { ...m, team1_score: editMatch.s1, team2_score: editMatch.s2, score_a: editMatch.s1, score_b: editMatch.s2 } : m))
      setEditMatch(null)
    }
  }

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTournament) return
    await supabase.from('tournaments').update({ status }).eq('id', selectedTournament.id)
    setSelectedTournament({ ...selectedTournament, status: status as any })
    if (editInfo) {
      setEditInfo({ ...editInfo, status: status as any })
    }
    fetchBaseData()
    toast.success('Estatus del torneo actualizado')
  }

  const handleSaveTournamentInfo = async () => {
    if (!selectedTournament || !editInfo) return

    if (!editInfo.name.trim()) {
      toast.error('El nombre del torneo no puede estar vacío.')
      return
    }

    if (editInfo.start_date && editInfo.end_date && editInfo.end_date < editInfo.start_date) {
      toast.error('La fecha de fin no puede ser anterior a la fecha de inicio.')
      return
    }

    setIsSavingInfo(true)
    toast.loading('Guardando cambios del torneo...', { id: 'save-tournament' })

    try {
      const cleanDistribution = editInfo.prizepool_distribution
        .map(v => v.trim())
        .filter(v => v !== '')

      const updates = {
        name: editInfo.name.trim(),
        game: editInfo.game,
        status: editInfo.status,
        description: editInfo.description.trim() || null,
        start_date: editInfo.start_date ? new Date(editInfo.start_date + 'T00:00:00Z').toISOString() : null,
        end_date: editInfo.end_date ? new Date(editInfo.end_date + 'T23:59:59Z').toISOString() : null,
        prizepool_total: editInfo.prizepool_total.trim(),
        type: editInfo.type.trim() || null,
        prizepool_distribution: cleanDistribution.length > 0 ? cleanDistribution : [],
      }

      const { error } = await supabase
        .from('tournaments')
        .update(updates)
        .eq('id', selectedTournament.id)

      if (error) throw error

      const updatedTournamentObj: Tournament = {
        ...selectedTournament,
        name: updates.name,
        game: updates.game,
        status: updates.status,
        description: updates.description || undefined,
        start_date: updates.start_date || '',
        end_date: updates.end_date || '',
        prizepool_total: updates.prizepool_total,
        prizepool_distribution: cleanDistribution,
        type: updates.type || undefined,
        templates: selectedTournament.templates ? {
          ...selectedTournament.templates,
          name: updates.name,
          type: updates.type || selectedTournament.templates.type
        } : undefined
      }

      setSelectedTournament(updatedTournamentObj)
      setTournaments(prev => prev.map(t => t.id === selectedTournament.id ? updatedTournamentObj : t))

      toast.success('Datos del torneo actualizados exitosamente', { id: 'save-tournament' })
    } catch (err: any) {
      console.error('Error saving tournament:', err)
      toast.error('Error al actualizar torneo: ' + (err?.message || 'Error inesperado'), { id: 'save-tournament' })
    } finally {
      setIsSavingInfo(false)
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
          <form onSubmit={handleCreate} className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-500 text-white">Nombre del Torneo</label>
                <input name="name" type="text" required className="w-full rounded-md border border-border bg-background px-4 py-3 text-white focus:border-primary focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-500 text-white">Juego
                  <span className="text-primary"> *</span>
                </label>
                <div className="relative">
                  <select name="game" required className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-3 pr-10 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/50 transition-colors cursor-pointer">
                    <option value="Mobile Legends">Mobile Legends</option>
                    <option value="Free Fire">Free Fire</option>
                    <option value="Valorant">Valorant</option>
                    <option value="League of Legends">League of Legends</option>
                    <option value="Otro">Otro</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-500 text-white">Plantilla Base <span className="text-xs text-muted-foreground">(Opcional)</span></label>
                <div className="relative">
                  <select name="template_id" className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-3 pr-10 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/50 transition-colors cursor-pointer">
                    <option value="">Sin plantilla</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.game})</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {templates.length === 0 && <p className="text-xs text-muted-foreground">No tienes plantillas creadas en Configuración. Puedes crear el torneo sin plantilla.</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-500 text-white">Fecha de Inicio</label>
                <input
                  name="start_date"
                  type="date"
                  required
                  min={todayStr}
                  value={formStartDate}
                  onChange={e => {
                    setFormStartDate(e.target.value)
                    // Resetear fecha fin si queda antes que la nueva inicio
                    if (formEndDate && formEndDate < e.target.value) setFormEndDate('')
                  }}
                  className="w-full rounded-md border border-border bg-background px-4 py-3 text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-500 text-white">Fecha de Fin</label>
                <input
                  name="end_date"
                  type="date"
                  required
                  min={formStartDate || todayStr}
                  value={formEndDate}
                  onChange={e => setFormEndDate(e.target.value)}
                  disabled={!formStartDate}
                  title={!formStartDate ? 'Selecciona primero la Fecha de Inicio' : undefined}
                  className="w-full rounded-md border border-border bg-background px-4 py-3 text-white focus:border-primary focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                />
                {!formStartDate && (
                  <p className="text-[11px] text-muted-foreground">Selecciona primero la Fecha de Inicio.</p>
                )}
              </div>
              
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-500 text-white">Descripción del Torneo <span className="text-xs text-muted-foreground">(Opcional)</span></label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Breve descripción que se mostrará en la página principal y en la ficha del torneo..."
                  className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-white focus:border-primary focus:outline-none resize-none leading-relaxed placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="space-y-2 sm:col-span-2 border-t border-border pt-6 mt-2">
                <h4 className="text-sm font-600 text-primary uppercase tracking-widest">Prizepool</h4>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-500 text-white">Bolsa Total ($ USD u otra moneda)</label>
                <input name="prizepool_total" type="text" placeholder="Ej. $1,000 USD" required className="w-full rounded-md border border-border bg-background px-4 py-3 text-white focus:border-primary focus:outline-none" />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-500 text-white flex justify-between">
                  Distribución de Premios
                  <button type="button" onClick={() => setDistPlaces([...distPlaces, ''])} className="text-primary text-xs hover:underline">+ Agregar lugar</button>
                </label>
                {distPlaces.map((val, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="w-8 shrink-0 flex items-center justify-center bg-white/5 rounded text-xs font-600 text-muted-foreground">{i+1}º</span>
                    <input 
                      type="text" 
                      value={val}
                      onChange={e => {
                        const n = [...distPlaces]
                        n[i] = e.target.value
                        setDistPlaces(n)
                      }}
                      placeholder={`Monto para el lugar ${i+1}`}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                      required
                    />
                    {i > 0 && (
                      <button type="button" onClick={() => setDistPlaces(distPlaces.filter((_, idx) => idx !== i))} className="px-2 text-muted-foreground hover:text-red-500"><X className="w-4 h-4"/></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="px-6 py-3 font-display text-sm font-600 uppercase tracking-wider text-muted-foreground hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 overflow-hidden bg-primary px-8 py-3 font-display text-[13px] font-600 uppercase tracking-widest text-white transition-colors duration-300 clip-corner hover:bg-primary/90"
              >
                CREAR TORNEO
              </button>
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
                  <img 
                    src={tournament.templates?.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                    alt={tournament.name}
                    className="w-12 h-12 rounded-lg object-cover bg-surface border border-border"
                  />
                  <div>
                    <h3 className="font-600 text-white">{tournament.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 text-primary">
                        <Gamepad2 className="w-3 h-3" /> {tournament.game}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'TBD'}
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
                    onClick={() => { 
                      setSelectedTournament(tournament); 
                      setActiveTab('info'); 
                      setNewMatch({
                        phase: 'Fase de Grupos',
                        date: tournament.start_date ? tournament.start_date.split('T')[0] : '',
                        t1: '',
                        t2: '',
                        s1: 0,
                        s2: 0
                      });
                    }}
                    title="Administrar" 
                    className="px-3 py-1.5 text-xs font-500 bg-primary/20 text-primary hover:bg-primary/30 rounded transition-colors cursor-pointer"
                  >
                    Administrar
                  </button>
                  <button 
                    onClick={() => setConfirmAction({ id: tournament.id, name: tournament.name })} 
                    title="Eliminar" 
                    className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
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
          <div className="relative flex flex-col w-full max-w-4xl h-[90vh] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex shrink-0 items-center justify-between border-b border-border p-6 bg-surface z-10">
              <div className="flex items-center gap-4">
                <img 
                  src={selectedTournament.templates?.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                  alt="Logo"
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white">{editInfo?.name || selectedTournament.name}</h3>
                  <p className="text-sm text-primary">{editInfo?.game || selectedTournament.game}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTournament(null)} className="text-muted-foreground hover:text-white p-2 rounded-full hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex shrink-0 border-b border-border px-6">
              {[
                { id: 'info', label: 'Info General', icon: Trophy },
                { id: 'teams', label: 'Equipos Activos', icon: Users },
                { id: 'matches', label: 'Encuentros', icon: Swords }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-4 text-sm font-600 transition-colors relative",
                    activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-white"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                </button>
              ))}
            </div>

            {/* Body */}
            <div data-lenis-prevent data-modal-scrollbody className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 bg-background">
              
              {activeTab === 'info' && editInfo && (
                <div className="space-y-6 animate-in fade-in">
                  
                  {/* Grid de 4 tarjetas principales */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Estatus */}
                    <div className="p-4 rounded-lg border border-border bg-surface flex flex-col justify-between">
                      <p className="text-xs font-600 text-muted-foreground uppercase tracking-widest mb-1.5">Estatus</p>
                      <div className="relative mt-auto">
                        <select 
                          value={editInfo.status}
                          onChange={(e) => {
                            const newSt = e.target.value as any
                            setEditInfo({ ...editInfo, status: newSt })
                            handleUpdateStatus(newSt)
                          }}
                          className={cn(
                            "w-full appearance-none rounded-lg border px-3 py-2 pr-8 text-xs font-700 uppercase focus:outline-none focus:ring-1 cursor-pointer transition-colors",
                            editInfo.status === 'ongoing' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 focus:border-emerald-500" :
                            editInfo.status === 'upcoming' ? "bg-blue-500/10 text-blue-400 border-blue-500/30 focus:border-blue-500" :
                            "bg-white/5 text-muted-foreground border-white/10 focus:border-white/30"
                          )}
                        >
                          <option value="upcoming" className="bg-surface text-blue-400">Próximo</option>
                          <option value="ongoing" className="bg-surface text-emerald-400">En Curso</option>
                          <option value="finished" className="bg-surface text-muted-foreground">Finalizado</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Fechas */}
                    <div className="p-4 rounded-lg border border-border bg-surface flex flex-col justify-between">
                      <p className="text-xs font-600 text-muted-foreground uppercase tracking-widest mb-1.5">Fechas</p>
                      <div className="grid grid-cols-2 gap-2 mt-auto">
                        <div>
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase block mb-0.5">Inicio</span>
                          <input
                            type="date"
                            value={editInfo.start_date}
                            onChange={(e) => setEditInfo({ ...editInfo, start_date: e.target.value })}
                            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-white focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase block mb-0.5">Fin</span>
                          <input
                            type="date"
                            value={editInfo.end_date}
                            min={editInfo.start_date || undefined}
                            onChange={(e) => setEditInfo({ ...editInfo, end_date: e.target.value })}
                            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-white focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Prizepool */}
                    <div className="p-4 rounded-lg border border-border bg-surface flex flex-col justify-between">
                      <p className="text-xs font-600 text-muted-foreground uppercase tracking-widest mb-1.5">Prizepool Total</p>
                      <div className="mt-auto">
                        <input
                          type="text"
                          value={editInfo.prizepool_total}
                          onChange={(e) => setEditInfo({ ...editInfo, prizepool_total: e.target.value })}
                          placeholder="Ej: 1500"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-emerald-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Tipo */}
                    <div className="p-4 rounded-lg border border-border bg-surface flex flex-col justify-between">
                      <p className="text-xs font-600 text-muted-foreground uppercase tracking-widest mb-1.5">Tipo de Torneo</p>
                      <div className="mt-auto">
                        <input
                          type="text"
                          list="tournament-types"
                          value={editInfo.type}
                          onChange={(e) => setEditInfo({ ...editInfo, type: e.target.value })}
                          placeholder="Ej: Clasificatorio"
                          className="w-full rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase tracking-wider"
                        />
                        <datalist id="tournament-types">
                          <option value="Clasificatorio" />
                          <option value="Relámpago" />
                          <option value="Invitacional" />
                          <option value="Qualifier" />
                          <option value="Abierto" />
                          <option value="Liga" />
                        </datalist>
                      </div>
                    </div>
                  </div>

                  {/* Distribución del Prizepool */}
                  <div className="rounded-xl border border-border bg-surface/60 p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                      <div>
                        <h4 className="text-xs font-700 uppercase tracking-wider text-primary flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          Distribución del Prizepool
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Edita el monto o premio asignado a cada lugar del torneo.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditInfo({ ...editInfo, prizepool_distribution: [...editInfo.prizepool_distribution, ''] })}
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:text-white transition-colors bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/20 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar Puesto
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {editInfo.prizepool_distribution.map((val, idx) => {
                        const medalColors = [
                          { bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'bg-yellow-500/20' },
                          { bg: 'bg-slate-400/10', border: 'border-slate-400/30', text: 'text-slate-300', label: 'bg-slate-400/20' },
                          { bg: 'bg-amber-700/15', border: 'border-amber-600/30', text: 'text-amber-500', label: 'bg-amber-700/20' },
                        ]
                        const colors = medalColors[idx] ?? { bg: 'bg-white/5', border: 'border-border', text: 'text-muted-foreground', label: 'bg-white/10' }
                        return (
                          <div
                            key={idx}
                            className={`relative flex flex-col gap-2 rounded-xl border ${colors.border} ${colors.bg} p-3 transition-colors hover:border-primary/40`}
                          >
                            {/* Badge de posición */}
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ${colors.label} ${colors.text}`}>
                                {idx + 1}º Lugar
                              </span>
                              {editInfo.prizepool_distribution.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = editInfo.prizepool_distribution.filter((_, i) => i !== idx)
                                    setEditInfo({ ...editInfo, prizepool_distribution: next })
                                  }}
                                  title="Eliminar este puesto"
                                  className="p-1 text-muted-foreground hover:text-red-400 transition-colors rounded hover:bg-white/5 cursor-pointer shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Input del monto */}
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold select-none">$</span>
                              <input
                                type="text"
                                value={val}
                                placeholder="0"
                                onChange={(e) => {
                                  const next = [...editInfo.prizepool_distribution]
                                  next[idx] = e.target.value
                                  setEditInfo({ ...editInfo, prizepool_distribution: next })
                                }}
                                className={`w-full rounded-lg border ${colors.border} bg-background/60 pl-7 pr-3 py-2 text-sm font-bold ${colors.text} focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/40 transition-colors`}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>


                  {/* Identidad del Torneo (Nombre y Juego) */}
                  <div className="rounded-xl border border-border bg-surface/60 p-5 space-y-4">
                    <h4 className="text-xs font-700 uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border/60 pb-3">
                      <Gamepad2 className="w-4 h-4 text-primary" />
                      Identidad del Torneo
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-600 text-muted-foreground uppercase block mb-1">
                          Nombre del Torneo <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={editInfo.name}
                          onChange={(e) => setEditInfo({ ...editInfo, name: e.target.value })}
                          className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-white font-semibold focus:border-primary focus:outline-none uppercase"
                          placeholder="Ej: ETERNAL GLORY 2026"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-600 text-muted-foreground uppercase block mb-1">
                          Juego Oficial
                        </label>
                        <div className="relative">
                          <select
                            value={editInfo.game}
                            onChange={(e) => setEditInfo({ ...editInfo, game: e.target.value })}
                            className="w-full appearance-none rounded-lg border border-border bg-background px-3.5 py-2 pr-9 text-sm text-white focus:border-primary focus:outline-none cursor-pointer font-medium"
                          >
                            <option value="Mobile Legends">Mobile Legends</option>
                            <option value="Free Fire">Free Fire</option>
                            <option value="Valorant">Valorant</option>
                            <option value="League of Legends">League of Legends</option>
                            <option value="Otro">Otro</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    {/* Descripción */}
                    <div>
                      <label className="text-xs font-600 text-muted-foreground uppercase block mb-1">
                        Descripción <span className="text-xs normal-case text-muted-foreground/60 font-400">(se muestra en la página de inicio)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={editInfo.description}
                        onChange={(e) => setEditInfo({ ...editInfo, description: e.target.value })}
                        placeholder="Breve descripción que se mostrará en la tarjeta del torneo en la página principal..."
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none resize-none leading-relaxed placeholder:text-muted-foreground/40 transition-colors"
                      />
                    </div>
                  </div>


                  {/* Barra Fija de Guardar Cambios */}
                  <div className="sticky bottom-0 bg-surface/95 backdrop-blur border border-border p-4 rounded-xl flex items-center justify-between gap-4 z-20 shadow-xl">
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      Los cambios en fechas, prizepool, tipo y distribución se guardarán en la base de datos.
                    </p>
                    <button
                      type="button"
                      disabled={isSavingInfo}
                      onClick={handleSaveTournamentInfo}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-black bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer ml-auto"
                    >
                      {isSavingInfo ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Guardar Cambios del Torneo</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}

              {activeTab === 'teams' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <select 
                        value={newTeamId}
                        onChange={e => setNewTeamId(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-border bg-surface px-4 py-2.5 pr-10 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        <option value="">Seleccionar equipo para agregar...</option>
                        {availableTeams
                          .filter(at => !tourneyTeams.find(tt => (tt.teams?.id || tt.team_id) === at.id))
                          .map(at => (
                            <option key={at.id} value={at.id}>{at.name}</option>
                          ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <GmxButton onClick={handleAddTeam} disabled={!newTeamId} className="px-6 h-auto">Agregar Equipo</GmxButton>
                  </div>

                  {tourneyTeams.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-border rounded-xl">
                      <p className="text-muted-foreground">No hay equipos en este torneo.</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tourneyTeams.map(tt => {
                        const team = tt.teams || { id: tt.team_id, name: 'Equipo', logo_url: '' }
                        return (
                          <div key={team.id || tt.team_id} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface">
                            <img src={team.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} alt="" className="w-10 h-10 rounded-full object-cover" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-600 text-white truncate">{team.name}</h4>
                            </div>
                            <button onClick={() => handleRemoveTeam(team.id || tt.team_id)} className="text-muted-foreground hover:text-red-500 transition-colors p-2"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'matches' && (
                <div className="space-y-8 animate-in fade-in">
                  <div className="p-5 rounded-xl border border-border bg-surface">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <h4 className="text-sm font-600 text-white uppercase tracking-widest">Crear Encuentro</h4>
                      {selectedTournament?.start_date && selectedTournament?.end_date && (
                        <span className="text-xs text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md font-500">
                          Fechas del Torneo: {new Date(selectedTournament.start_date).toLocaleDateString()} al {new Date(selectedTournament.end_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                      <div className="lg:col-span-1">
                        <label className="text-xs text-muted-foreground mb-1 block">Fase/Jornada</label>
                        <input type="text" value={newMatch.phase} onChange={e => setNewMatch({...newMatch, phase: e.target.value})} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
                      </div>
                      <div className="lg:col-span-1">
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Fecha
                          {selectedTournament?.start_date && selectedTournament?.end_date && (
                            <span className="text-[10px] text-primary ml-1 font-600">
                              ({new Date(selectedTournament.start_date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })} - {new Date(selectedTournament.end_date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })})
                            </span>
                          )}
                        </label>
                        <input 
                          type="date" 
                          value={newMatch.date} 
                          min={selectedTournament?.start_date ? selectedTournament.start_date.split('T')[0] : undefined}
                          max={selectedTournament?.end_date ? selectedTournament.end_date.split('T')[0] : undefined}
                          onChange={e => setNewMatch({...newMatch, date: e.target.value})} 
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" 
                        />
                      </div>
                      <div className="lg:col-span-1">
                        <label className="text-xs text-muted-foreground mb-1 block">Equipo A</label>
                        <div className="relative">
                          <select 
                            value={newMatch.t1} 
                            onChange={e => {
                              const val = e.target.value
                              setNewMatch(prev => ({
                                ...prev,
                                t1: val,
                                t2: prev.t2 === val ? '' : prev.t2
                              }))
                            }} 
                            className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:border-primary cursor-pointer"
                          >
                            <option value="">Equipo...</option>
                            {tourneyTeams.map(tt => {
                              const tId = tt.teams?.id || tt.team_id
                              const tName = tt.teams?.name || 'Equipo'
                              const isSelectedInB = tId === newMatch.t2
                              return (
                                <option key={tId} value={tId} disabled={isSelectedInB}>
                                  {tName} {isSelectedInB ? '(Seleccionado en B)' : ''}
                                </option>
                              )
                            })}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="lg:col-span-1">
                        <label className="text-xs text-muted-foreground mb-1 block">Equipo B</label>
                        <div className="relative">
                          <select 
                            value={newMatch.t2} 
                            onChange={e => {
                              const val = e.target.value
                              setNewMatch(prev => ({
                                ...prev,
                                t2: val,
                                t1: prev.t1 === val ? '' : prev.t1
                              }))
                            }} 
                            className={`w-full appearance-none rounded-lg border bg-background px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:border-primary cursor-pointer ${
                              newMatch.t1 && newMatch.t2 && newMatch.t1 === newMatch.t2 ? 'border-red-500' : 'border-border'
                            }`}
                          >
                            <option value="">Equipo...</option>
                            {tourneyTeams.map(tt => {
                              const tId = tt.teams?.id || tt.team_id
                              const tName = tt.teams?.name || 'Equipo'
                              const isSelectedInA = tId === newMatch.t1
                              return (
                                <option key={tId} value={tId} disabled={isSelectedInA}>
                                  {tName} {isSelectedInA ? '(Seleccionado en A)' : ''}
                                </option>
                              )
                            })}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="lg:col-span-1">
                        <GmxButton 
                          onClick={handleAddMatch} 
                          disabled={!newMatch.t1 || !newMatch.t2 || newMatch.t1 === newMatch.t2} 
                          className="w-full h-[38px]"
                        >
                          Crear
                        </GmxButton>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-600 text-white uppercase tracking-widest">Encuentros Programados</h4>
                    {tourneyMatches.length === 0 ? (
                      <p className="text-muted-foreground text-sm italic">No hay encuentros programados.</p>
                    ) : (
                      tourneyMatches.map(m => (
                        <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-surface hover:border-primary/50 transition-colors">
                          <div className="flex-1">
                            <p className="text-xs text-primary font-600 mb-2 uppercase">{m.phase} • {m.match_date ? new Date(m.match_date).toLocaleDateString() : 'TBD'}</p>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 flex-1 justify-end">
                                <span className="font-600 text-white text-sm">{m.team1?.name || 'TBD'}</span>
                                <img src={m.team1?.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} className="w-8 h-8 rounded-full bg-background" />
                              </div>
                              <div className="px-4 py-1 rounded bg-background border border-border text-xs font-700 text-white shrink-0">
                                {m.team1_score} - {m.team2_score}
                              </div>
                              <div className="flex items-center gap-2 flex-1">
                                <img src={m.team2?.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} className="w-8 h-8 rounded-full bg-background" />
                                <span className="font-600 text-white text-sm">{m.team2?.name || 'TBD'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => setEditMatch({ id: m.id, s1: m.team1_score, s2: m.team2_score, t1_name: m.team1?.name, t2_name: m.team2?.name })} 
                              className="text-muted-foreground hover:text-primary p-2"
                              title="Editar Resultado"
                            >
                              <Edit className="w-4 h-4"/>
                            </button>
                            <button 
                              onClick={() => setMatchToDelete(m)} 
                              className="text-muted-foreground hover:text-red-500 p-2"
                              title="Eliminar Encuentro"
                            >
                              <Trash2 className="w-4 h-4"/>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Edit Match Modal */}
                  {editMatch && (
                    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditMatch(null)} />
                      <div className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white mb-6">
                          Actualizar Resultado
                        </h3>
                        
                        <div className="flex items-center justify-between gap-4 mb-8">
                          <div className="flex-1 space-y-2 text-center">
                            <label className="text-xs font-600 text-muted-foreground uppercase">{editMatch.t1_name || 'Equipo A'}</label>
                            <input 
                              type="number" 
                              min="0"
                              value={editMatch.s1}
                              onChange={e => setEditMatch({...editMatch, s1: parseInt(e.target.value) || 0})}
                              className="w-full text-center text-2xl font-700 rounded-md border border-border bg-background px-4 py-3 text-white focus:border-primary focus:outline-none"
                            />
                          </div>
                          <span className="font-700 text-muted-foreground mt-6">VS</span>
                          <div className="flex-1 space-y-2 text-center">
                            <label className="text-xs font-600 text-muted-foreground uppercase">{editMatch.t2_name || 'Equipo B'}</label>
                            <input 
                              type="number" 
                              min="0"
                              value={editMatch.s2}
                              onChange={e => setEditMatch({...editMatch, s2: parseInt(e.target.value) || 0})}
                              className="w-full text-center text-2xl font-700 rounded-md border border-border bg-background px-4 py-3 text-white focus:border-primary focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button 
                            onClick={() => setEditMatch(null)}
                            className="flex-1 rounded-md border border-border bg-transparent px-4 py-3 font-display text-[13px] font-600 uppercase tracking-widest text-muted-foreground transition-colors hover:text-white"
                          >
                            CANCELAR
                          </button>
                          <GmxButton onClick={handleUpdateMatchScore} className="flex-1 px-4 py-3">
                            GUARDAR
                          </GmxButton>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}
              
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

      {/* Match Delete Confirmation Modal */}
      {matchToDelete && (
        <div className="fixed inset-0 z-[1060] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMatchToDelete(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-6 bg-red-500/10 text-red-500">
              <AlertCircle className="h-8 w-8" />
            </div>

            <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-2">
              ¿Eliminar Encuentro?
            </h3>
            
            <p className="text-muted-foreground mb-4 text-sm">
              Estás a punto de eliminar este encuentro del torneo:
            </p>

            <div className="p-4 rounded-lg bg-background border border-border mb-6">
              <div className="text-xs text-primary font-600 uppercase mb-1">
                {matchToDelete.phase} • {matchToDelete.match_date ? new Date(matchToDelete.match_date).toLocaleDateString() : 'TBD'}
              </div>
              <div className="flex items-center justify-center gap-3 text-white font-700 text-sm">
                <span>{matchToDelete.team1?.name || 'Equipo A'}</span>
                <span className="text-xs text-muted-foreground">VS</span>
                <span>{matchToDelete.team2?.name || 'Equipo B'}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setMatchToDelete(null)}
                className="flex-1 rounded-md border border-border bg-transparent px-4 py-3 font-display text-[13px] font-600 uppercase tracking-widest text-muted-foreground transition-colors hover:text-white"
              >
                CANCELAR
              </button>
              <button 
                onClick={handleConfirmDeleteMatch}
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
