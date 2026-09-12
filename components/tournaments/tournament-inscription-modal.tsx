'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { GmxButton } from '@/components/gmx-button'
import { X, Trophy, ShieldAlert, CheckCircle2, Clock, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TournamentInscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  tournament: {
    id: string
    name: string
    game?: string
    status?: string
    templates?: {
      logo_url?: string
      type?: string
    }
  }
  alreadyInscribedTeamIds: string[]
  onInscriptionSuccess?: () => void
}

export function TournamentInscriptionModal({
  isOpen,
  onClose,
  tournament,
  alreadyInscribedTeamIds,
  onInscriptionSuccess
}: TournamentInscriptionModalProps) {
  const { user } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<any[]>([])
  const [pendingTeamIds, setPendingTeamIds] = useState<Set<string>>(new Set())
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen || !user?.id) return

    async function fetchUserTeamsAndValidations() {
      setLoading(true)
      try {
        // 1. Obtener equipos activos del usuario
        const { data: userTeams, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, logo_url, tag, status')
          .eq('manager_id', user!.id)
          .in('status', ['active', 'aprobado', 'approved'])

        if (teamsError) {
          console.error('Error al consultar equipos:', teamsError)
          toast.error('No se pudieron cargar tus equipos.')
          setTeams([])
        } else {
          setTeams(userTeams || [])
        }

        // 2. Obtener solicitudes pendientes de inscripción para este torneo
        const { data: validations, error: valError } = await supabase
          .from('validations')
          .select('id, details, status')
          .eq('type', 'inscripcion_torneo')
          .eq('status', 'pending')

        if (!valError && validations) {
          const pendingSet = new Set<string>()
          validations.forEach((val: any) => {
            if (val.details?.tournament_id === tournament.id && val.details?.team_id) {
              pendingSet.add(val.details.team_id)
            }
          })
          setPendingTeamIds(pendingSet)
        }
      } catch (err) {
        console.error('Error general al cargar datos de inscripción:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserTeamsAndValidations()
    setSelectedTeamId('')
  }, [isOpen, user?.id, tournament.id])

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!selectedTeamId || !user) return

    const selectedTeam = teams.find(t => t.id === selectedTeamId)
    if (!selectedTeam) return

    if (alreadyInscribedTeamIds.includes(selectedTeam.id)) {
      toast.warning('Este equipo ya se encuentra registrado en el torneo.')
      return
    }

    if (pendingTeamIds.has(selectedTeam.id)) {
      toast.info('Ya enviaste una solicitud de inscripción para este equipo.')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('validations').insert({
        type: 'inscripcion_torneo',
        target_name: `${selectedTeam.name} — ${tournament.name}`,
        submitted_by: user.id,
        status: 'pending',
        details: {
          tournament_id: tournament.id,
          tournament_name: tournament.name,
          tournament_logo: tournament.templates?.logo_url || null,
          game: tournament.game || 'Mobile Legends',
          team_id: selectedTeam.id,
          team_name: selectedTeam.name,
          team_logo: selectedTeam.logo_url || null,
          team_tag: selectedTeam.tag || null,
          manager_id: user.id,
          manager_name: user.name || user.nickname || 'Manager',
          manager_email: user.email || '',
          created_at: new Date().toISOString()
        }
      })

      if (error) {
        throw error
      }

      toast.success('¡Solicitud de inscripción enviada con éxito!', {
        description: 'Un administrador validará y aprobará la inscripción de tu equipo.'
      })

      setPendingTeamIds(prev => new Set(prev).add(selectedTeam.id))
      onInscriptionSuccess?.()
      onClose()
    } catch (err: any) {
      console.error('Error al solicitar inscripción:', err)
      toast.error('Error al enviar la solicitud: ' + (err.message || 'Intenta de nuevo.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-deep/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-700 uppercase tracking-tight text-white">
                Inscripción al Torneo
              </h2>
              <p className="text-xs text-muted-foreground truncate max-w-[280px] sm:max-w-xs">
                {tournament.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-500">Verificando equipos...</p>
            </div>
          ) : teams.length === 0 ? (
            // No teams state
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display text-lg font-700 uppercase text-white mb-2">
                  No tienes un equipo dado de alta
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Para participar en este torneo oficial debes registrar tu equipo previamente en la plataforma y tenerlo activo.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/registro/alta-de-equipo"
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-display text-sm font-700 uppercase tracking-wider transition-colors w-full"
                >
                  Registrar mi Equipo <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            // Team selection state
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-600 uppercase tracking-wider text-muted-foreground mb-2">
                  Selecciona el equipo que deseas inscribir:
                </label>
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {teams.map(team => {
                    const isInscribed = alreadyInscribedTeamIds.includes(team.id)
                    const isPending = pendingTeamIds.has(team.id)
                    const isDisabled = isInscribed || isPending
                    const isSelected = selectedTeamId === team.id

                    return (
                      <div
                        key={team.id}
                        onClick={() => {
                          if (!isDisabled) setSelectedTeamId(team.id)
                        }}
                        className={cn(
                          "relative flex items-center justify-between p-3.5 rounded-xl border transition-all",
                          isDisabled
                            ? "border-border/40 bg-white/[0.02] opacity-60 cursor-not-allowed"
                            : isSelected
                            ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(255,45,32,0.15)] cursor-pointer"
                            : "border-border bg-background/60 hover:border-border hover:bg-white/[0.04] cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={team.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'}
                            alt={team.name}
                            className="w-10 h-10 rounded-full object-cover bg-surface border border-border shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-display font-700 text-sm text-white uppercase truncate">
                              {team.name}
                            </p>
                            {team.tag && (
                              <p className="text-xs text-muted-foreground font-mono">
                                [{team.tag}]
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status badges */}
                        <div className="shrink-0 ml-3">
                          {isInscribed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-600 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Inscrito
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-600 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                              <Clock className="w-3 h-3" /> Pendiente
                            </span>
                          ) : (
                            <div className={cn(
                              "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                              isSelected
                                ? "border-primary bg-primary text-white"
                                : "border-muted-foreground/40 bg-transparent"
                            )}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-lg bg-deep/40 border border-border p-3.5 text-xs text-muted-foreground flex items-start gap-2">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Al solicitar la inscripción, el equipo pasará a revisión por el equipo administrativo de GMX Gaming antes de confirmarse en el cuadro del torneo.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {teams.length > 0 && !loading && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-border bg-deep/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-600 uppercase tracking-wider text-muted-foreground hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <GmxButton
              onClick={handleSubmit}
              disabled={!selectedTeamId || submitting}
              className={cn(
                "px-6 py-2.5 text-xs",
                (!selectedTeamId || submitting) && "opacity-50 cursor-not-allowed"
              )}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                </span>
              ) : (
                'Solicitar Inscripción'
              )}
            </GmxButton>
          </div>
        )}
      </div>
    </div>
  )
}
