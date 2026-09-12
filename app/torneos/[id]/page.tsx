'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { Preloader } from '@/components/preloader'
import { SmoothScroll } from '@/components/smooth-scroll'
import { CustomCursor } from '@/components/custom-cursor'
import { SiteHeader } from '@/components/site-header'
import { BackToTop } from '@/components/back-to-top'
import { SiteFooter } from '@/components/sections/site-footer'
import { Reveal } from '@/components/anim'
import { GmxButton } from '@/components/gmx-button'
import { TournamentInscriptionModal } from '@/components/tournaments/tournament-inscription-modal'
import { Calendar, Users, Trophy, Gamepad2, Swords, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn, getTeamSlug, slugify } from '@/lib/utils'

export default function TournamentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [ready, setReady] = useState(false)
  
  const [tournament, setTournament] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isInscriptionModalOpen, setIsInscriptionModalOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (!params.id) return
      const supabase = createClient()
      
      const paramSlug = Array.isArray(params.id) ? params.id[0] : params.id
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paramSlug)

      let tournamentData = null
      let targetId = paramSlug

      if (isUuid) {
        const { data } = await supabase
          .from('tournaments')
          .select('*, templates:tournament_templates(name, type, logo_url)')
          .eq('id', paramSlug)
          .single()
        tournamentData = data
        if (data) targetId = data.id
      } else {
        const { data: allTournaments } = await supabase
          .from('tournaments')
          .select('*, templates:tournament_templates(name, type, logo_url)')

        if (allTournaments) {
          tournamentData = allTournaments.find(t => slugify(t.name) === paramSlug || t.id === paramSlug)
          if (tournamentData) targetId = tournamentData.id
        }
      }

      if (tournamentData) {
        setTournament(tournamentData)
        const [teamsRes, matchesRes] = await Promise.all([
          supabase.from('tournament_teams').select('teams(id, name, logo_url, tag)').eq('tournament_id', targetId),
          supabase.from('matches').select('*').eq('tournament_id', targetId).order('match_date', { ascending: true })
        ])

        const loadedTeams = teamsRes.data ? teamsRes.data.map((t: any) => t.teams).filter(Boolean) : []
        setTeams(loadedTeams)

        if (matchesRes.data) {
          const teamMap = new Map<string, any>()
          loadedTeams.forEach((t: any) => { if (t?.id) teamMap.set(t.id, t) })
          
          const missingIds = new Set<string>()
          matchesRes.data.forEach(m => {
            const t1Id = m.team_a_id || m.team1_id
            const t2Id = m.team_b_id || m.team2_id
            if (t1Id && !teamMap.has(t1Id)) missingIds.add(t1Id)
            if (t2Id && !teamMap.has(t2Id)) missingIds.add(t2Id)
          })

          if (missingIds.size > 0) {
            const { data: missingTeams } = await supabase
              .from('teams')
              .select('id, name, logo_url, tag')
              .in('id', Array.from(missingIds))
            if (missingTeams) {
              missingTeams.forEach(t => teamMap.set(t.id, t))
            }
          }

          const populatedMatches = matchesRes.data.map(m => {
            const t1Id = m.team_a_id || m.team1_id
            const t2Id = m.team_b_id || m.team2_id
            return {
              ...m,
              team1_id: t1Id,
              team2_id: t2Id,
              team1_score: m.score_a ?? m.team1_score ?? 0,
              team2_score: m.score_b ?? m.team2_score ?? 0,
              team1: teamMap.get(t1Id) || { id: t1Id, name: 'TBD', logo_url: '' },
              team2: teamMap.get(t2Id) || { id: t2Id, name: 'TBD', logo_url: '' }
            }
          })
          setMatches(populatedMatches)
        }
      }
      
      setLoading(false)
    }
    fetchData()
  }, [params.id])

  const refreshTournamentTeams = async () => {
    if (!tournament?.id) return
    const supabase = createClient()
    const teamsRes = await supabase
      .from('tournament_teams')
      .select('teams(id, name, logo_url, tag)')
      .eq('tournament_id', tournament.id)
    if (teamsRes.data) {
      setTeams(teamsRes.data.map((t: any) => t.teams).filter(Boolean))
    }
  }

  const handleInscriptionClick = () => {
    if (!user) {
      toast.info('Debes registrarte o iniciar sesión para inscribir a tu equipo.')
      router.push('/crear-cuenta')
      return
    }
    setIsInscriptionModalOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center text-center p-6">
        <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="font-display text-3xl text-white uppercase mb-2">Torneo no encontrado</h1>
        <p className="text-muted-foreground mb-6">El torneo que buscas no existe o ha sido eliminado.</p>
        <Link href="/torneos" className="px-6 py-3 bg-primary text-white font-600 rounded uppercase tracking-widest text-sm hover:bg-primary-dark transition-colors">Volver a Torneos</Link>
      </div>
    )
  }

  // Agrupar matches por fase
  const phases = Array.from(new Set(matches.map(m => m.phase)))

  return (
    <>
      <Preloader onDone={() => setReady(true)} />
      <SmoothScroll />
      <CustomCursor />
      <SiteHeader />
      <BackToTop />

      <main className="relative min-h-screen pt-32 pb-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-primary/10 blur-[120px]" />
        </div>

        <div className="relative z-10 px-5 lg:px-10 max-w-[1200px] mx-auto">
          {/* Hero Header */}
          <Reveal direction="up" className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16 text-center md:text-left">
            <img 
              src={tournament.templates?.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
              alt={tournament.name}
              className="w-40 h-40 object-cover rounded-2xl bg-surface border-2 border-border shadow-2xl"
            />
            <div className="flex-1">
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-4">
                <span className={cn("px-3 py-1 text-xs font-600 uppercase tracking-widest rounded-full", 
                  tournament.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  tournament.status === 'ongoing' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  'bg-white/5 text-muted-foreground border border-white/10'
                )}>
                  {tournament.status === 'upcoming' ? 'Próximo' : tournament.status === 'ongoing' ? 'En Curso' : 'Finalizado'}
                </span>
                <span className="text-xs font-600 text-primary uppercase tracking-widest flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                  <Gamepad2 className="w-3 h-3" /> {tournament.game}
                </span>
                <span className="text-xs font-600 text-muted-foreground uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                  {tournament.templates?.type || 'Torneo'}
                </span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-700 text-white uppercase tracking-tight mb-6">
                {tournament.name}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-6">
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="font-500">{tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'TBD'} - {tournament.end_date ? new Date(tournament.end_date).toLocaleDateString() : 'TBD'}</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                  <span className="font-500">{tournament.prizepool_total || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="font-500">{teams.length} Equipos</span>
                </div>
              </div>

              {tournament.description && (
                <p className="text-muted-foreground text-sm max-w-2xl mt-4 leading-relaxed text-center md:text-left">
                  {tournament.description}
                </p>
              )}

              {/* Botón de inscripción disponible mientras el torneo no haya iniciado */}
              {tournament.status === 'upcoming' && (
                <div className="mt-8 flex justify-center md:justify-start">
                  <GmxButton
                    onClick={handleInscriptionClick}
                    className="px-8 py-3.5 text-sm flex items-center gap-2.5 shadow-[0_0_25px_rgba(255,45,32,0.35)] hover:shadow-[0_0_35px_rgba(255,45,32,0.5)] transition-shadow"
                  >
                    <Trophy className="w-4 h-4 text-white" />
                    INSCRIBIRME AL TORNEO
                  </GmxButton>
                </div>
              )}
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Sidebar: Prizepool y Equipos */}
            <div className="lg:col-span-1 space-y-10">
              
              {/* Prizepool */}
              <Reveal direction="fade" className="rounded-2xl border border-border bg-surface p-6">
                <h3 className="font-display text-xl font-700 text-white uppercase flex items-center gap-2 mb-6">
                  <DollarSign className="w-5 h-5 text-emerald-400" /> Distribución
                </h3>
                {(!tournament.prizepool_distribution || tournament.prizepool_distribution.length === 0 || tournament.prizepool_distribution[0] === '') ? (
                  <p className="text-muted-foreground text-sm italic">Distribución no anunciada.</p>
                ) : (
                  <div className="space-y-3">
                    {tournament.prizepool_distribution.map((val: string, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                        <span className="flex items-center justify-center w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 font-700 text-xs">{idx+1}º</span>
                        <span className="text-white font-600">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Reveal>

              {/* Teams */}
              <Reveal direction="fade" className="rounded-2xl border border-border bg-surface p-6">
                <h3 className="font-display text-xl font-700 text-white uppercase flex items-center gap-2 mb-6">
                  <Users className="w-5 h-5 text-primary" /> Participantes ({teams.length})
                </h3>
                {teams.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic">Equipos por anunciar.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {teams.map(team => (
                      <Link 
                        key={team.id} 
                        href={`/equipos/${getTeamSlug(team)}`}
                        className="flex flex-col items-center text-center p-3 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors group block"
                      >
                        <img src={team.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} alt={team.name} className="w-12 h-12 rounded-full mb-2 object-cover group-hover:scale-105 transition-transform" />
                        <span className="text-xs font-600 text-white group-hover:text-primary transition-colors truncate w-full">{team.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </Reveal>

            </div>

            {/* Main Content: Matches (Esports Charts Style) */}
            <div className="lg:col-span-2">
              <Reveal direction="fade" className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
                <h3 className="font-display text-2xl font-700 text-white uppercase flex items-center gap-2 mb-8">
                  <Swords className="w-6 h-6 text-primary" /> Encuentros y Resultados
                </h3>

                {matches.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-border rounded-xl bg-background">
                    <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-white font-600 text-lg mb-1">Calendario en preparación</p>
                    <p className="text-muted-foreground text-sm">Los encuentros serán publicados pronto.</p>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {phases.map(phase => (
                      <div key={phase}>
                        <h4 className="font-600 text-primary uppercase tracking-widest border-b border-border pb-3 mb-4">{phase}</h4>
                        <div className="grid gap-3">
                          {matches.filter(m => m.phase === phase).map(m => {
                            const isT1Winner = m.team1_score > m.team2_score
                            const isT2Winner = m.team2_score > m.team1_score
                            const isPlayed = m.team1_score > 0 || m.team2_score > 0
                            
                            return (
                              <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors">
                                <div className="w-full sm:w-24 shrink-0 text-xs font-600 text-muted-foreground uppercase tracking-wider">
                                  {m.match_date ? new Date(m.match_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD'}
                                </div>
                                <div className="flex-1 flex items-center gap-4">
                                  {/* Team 1 */}
                                  <div className={cn("flex items-center gap-3 flex-1 justify-end", isPlayed && isT2Winner ? "opacity-50" : "", isPlayed && isT1Winner ? "font-700 text-white" : "font-500 text-muted-foreground")}>
                                    <span className="text-sm truncate">{m.team1?.name || 'TBD'}</span>
                                    <img src={m.team1?.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} className={cn("w-8 h-8 rounded-full bg-surface border border-border", isPlayed && isT1Winner && "ring-2 ring-primary border-transparent")} />
                                  </div>
                                  
                                  {/* Score */}
                                  <div className="px-4 py-1.5 rounded bg-surface border border-border flex items-center justify-center min-w-[80px]">
                                    {isPlayed ? (
                                      <span className="text-sm font-700 tracking-widest text-white">
                                        <span className={isT1Winner ? "text-primary" : ""}>{m.team1_score}</span>
                                        <span className="mx-2 text-muted-foreground">:</span>
                                        <span className={isT2Winner ? "text-primary" : ""}>{m.team2_score}</span>
                                      </span>
                                    ) : (
                                      <span className="text-xs font-600 text-muted-foreground">VS</span>
                                    )}
                                  </div>

                                  {/* Team 2 */}
                                  <div className={cn("flex items-center gap-3 flex-1", isPlayed && isT1Winner ? "opacity-50" : "", isPlayed && isT2Winner ? "font-700 text-white" : "font-500 text-muted-foreground")}>
                                    <img src={m.team2?.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} className={cn("w-8 h-8 rounded-full bg-surface border border-border", isPlayed && isT2Winner && "ring-2 ring-primary border-transparent")} />
                                    <span className="text-sm truncate">{m.team2?.name || 'TBD'}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Reveal>
            </div>
          </div>
          
        </div>
      </main>

      {tournament && (
        <TournamentInscriptionModal
          isOpen={isInscriptionModalOpen}
          onClose={() => setIsInscriptionModalOpen(false)}
          tournament={tournament}
          alreadyInscribedTeamIds={teams.map(t => t.id)}
          onInscriptionSuccess={refreshTournamentTeams}
        />
      )}

      <SiteFooter />
    </>
  )
}
