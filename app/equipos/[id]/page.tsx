'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Preloader } from '@/components/preloader'
import { SmoothScroll } from '@/components/smooth-scroll'
import { CustomCursor } from '@/components/custom-cursor'
import { SiteHeader } from '@/components/site-header'
import { BackToTop } from '@/components/back-to-top'
import { SiteFooter } from '@/components/sections/site-footer'
import { Reveal } from '@/components/anim'
import { Users, Trophy, ShieldAlert, MapPin, CheckCircle2, User, Swords } from 'lucide-react'
import Link from 'next/link'
import { cn, formatRoleTitle, formatRolesList, getPlayerSlug, slugify } from '@/lib/utils'

export default function TeamDetailsPage() {
  const params = useParams()
  const [ready, setReady] = useState(false)
  
  const [team, setTeam] = useState<any>(null)
  const [manager, setManager] = useState<any>(null)
  const [roster, setRoster] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [tournamentsCount, setTournamentsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!params.id) return
      const supabase = createClient()
      
      const paramSlug = Array.isArray(params.id) ? params.id[0] : params.id
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paramSlug)

      let teamData = null
      if (isUuid) {
        const { data } = await supabase.from('teams').select('*').eq('id', paramSlug).single()
        teamData = data
      } else {
        const { data: allTeams } = await supabase.from('teams').select('*')
        if (allTeams) {
          teamData = allTeams.find(t => slugify(t.name) === paramSlug || slugify(t.tag) === paramSlug || t.id === paramSlug)
        }
      }
      
      if (teamData) {
        setTeam(teamData)
        const teamId = teamData.id

        // Fetch Manager profile
        if (teamData.manager_id) {
          const { data: managerProfile } = await supabase
            .from('profiles')
            .select('id, name, nickname, discord_handle, avatar_url')
            .eq('id', teamData.manager_id)
            .maybeSingle()
          if (managerProfile) {
            setManager(managerProfile)
          }
        }
        
        // Fetch Roster (Active contracts)
        const { data: rosterData } = await supabase
          .from('contracts')
          .select(`
            roles, 
            status,
            profiles!contracts_player_id_fkey (id, name, nickname, avatar_url, discord_handle)
          `)
          .eq('team_id', teamId)
          .in('status', ['active', 'activo', 'pending_player_release', 'pending_manager_release'])
        
        if (rosterData) {
          setRoster(rosterData)
        }

        // Fetch Matches where team participated
        const { data: matchesData } = await supabase
          .from('matches')
          .select(`
            *,
            tournaments(name)
          `)
          .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
          .order('match_date', { ascending: false })
          .limit(10)

        if (matchesData) {
          const matchTeamIds = new Set<string>()
          matchesData.forEach(m => {
            const t1Id = m.team_a_id || m.team1_id
            const t2Id = m.team_b_id || m.team2_id
            if (t1Id) matchTeamIds.add(t1Id)
            if (t2Id) matchTeamIds.add(t2Id)
          })

          const teamMap = new Map<string, any>()
          if (teamData) teamMap.set(teamData.id, teamData)

          const missingIds = Array.from(matchTeamIds).filter(id => !teamMap.has(id))
          if (missingIds.length > 0) {
            const { data: teamsData } = await supabase
              .from('teams')
              .select('id, name, logo_url')
              .in('id', missingIds)
            if (teamsData) {
              teamsData.forEach(t => teamMap.set(t.id, t))
            }
          }

          const populatedMatches = matchesData.map(m => {
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
        } else {
          setMatches([])
        }
        
        // Fetch Unique Tournaments count (combinando registros de torneos y encuentros)
        const { data: ttData } = await supabase
          .from('tournament_teams')
          .select('tournament_id')
          .eq('team_id', teamId)
          
        const tourneySet = new Set<string>()
        if (ttData) {
          ttData.forEach((t: any) => { if (t.tournament_id) tourneySet.add(t.tournament_id) })
        }
        if (matchesData) {
          matchesData.forEach((m: any) => { if (m.tournament_id) tourneySet.add(m.tournament_id) })
        }
        setTournamentsCount(tourneySet.size)
      }
      
      setLoading(false)
    }
    fetchData()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center text-center p-6">
        <ShieldAlert className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="font-display text-3xl text-white uppercase mb-2">Equipo no encontrado</h1>
        <p className="text-muted-foreground mb-6">El equipo que buscas no existe o ha sido eliminado.</p>
        <Link href="/" className="px-6 py-3 bg-primary text-white font-600 rounded uppercase tracking-widest text-sm hover:bg-primary-dark transition-colors">Volver al Inicio</Link>
      </div>
    )
  }

  const isTeamActive = team.status === 'activo' || team.status === 'active' || team.status === 'approved'

  return (
    <>
      <Preloader onDone={() => setReady(true)} />
      <SmoothScroll />
      <CustomCursor />
      <SiteHeader />
      <BackToTop />

      <main className="relative min-h-screen pt-32 pb-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-primary/5 blur-[120px]" />
        </div>

        <div className="relative z-10 px-5 lg:px-10 max-w-[1200px] mx-auto">
          
          {/* Hero Header */}
          <Reveal direction="up" className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16 text-center md:text-left">
            <div className="relative w-40 h-40 shrink-0">
              <img 
                src={team.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                alt={team.name}
                className="w-full h-full object-cover rounded-full bg-surface border-4 border-surface shadow-2xl z-10 relative"
              />
              <div className="absolute inset-0 rounded-full border border-primary/30 scale-110 animate-pulse-slow"></div>
            </div>
            
            <div className="flex-1 mt-4 md:mt-6">
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-4">
                <span className={cn("px-3 py-1 text-xs font-600 uppercase tracking-widest rounded-full border", 
                  isTeamActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  team.status === 'pending' || team.status === 'pendiente' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-white/5 text-muted-foreground border-white/10'
                )}>
                  {isTeamActive ? 'Activo' : team.status === 'pending' || team.status === 'pendiente' ? 'Pendiente' : team.status === 'banned' ? 'Baneado' : 'Inactivo'}
                </span>
                <span className="text-xs font-600 text-muted-foreground uppercase tracking-widest flex items-center gap-1 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                  <MapPin className="w-3 h-3" /> {team.country || 'Desconocido'}
                </span>
              </div>
              <h1 className="font-display text-4xl sm:text-6xl font-700 text-white uppercase tracking-tight mb-6">
                {team.name}
              </h1>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-8">
                <div className="flex flex-col text-center md:text-left">
                  <span className="text-[10px] font-600 text-muted-foreground uppercase tracking-widest mb-1">Torneos Jugados</span>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-white">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <span className="font-display font-700 text-xl">{tournamentsCount}</span>
                  </div>
                </div>
                <div className="flex flex-col text-center md:text-left">
                  <span className="text-[10px] font-600 text-muted-foreground uppercase tracking-widest mb-1">Manager</span>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-white">
                    <User className="w-5 h-5 text-primary" />
                    <span className="font-600">
                      {manager 
                        ? (manager.nickname || manager.game_nickname || manager.name)
                        : (team.manager_discord_handle || 'N/A')
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-3 gap-10">
            
            {/* Roster Activo */}
            <div className="lg:col-span-2">
              <Reveal direction="fade" className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
                <h3 className="font-display text-2xl font-700 text-white uppercase flex items-center gap-2 mb-8">
                  <Users className="w-6 h-6 text-primary" /> Roster Actual
                </h3>

                {roster.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border rounded-xl bg-background">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-white font-600 text-lg mb-1">Sin roster activo</p>
                    <p className="text-muted-foreground text-sm">Este equipo no tiene jugadores con contrato activo.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {roster.map((contract, i) => {
                      const player = contract.profiles
                      if (!player) return null
                      const playerSlug = getPlayerSlug(player)
                      const playerAvatar = player.avatar_url || player.avatar || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'

                      return (
                        <Link 
                          key={i} 
                          href={`/jugadores/${playerSlug}`}
                          className="group relative flex items-center gap-4 p-4 rounded-xl bg-background border border-border hover:border-primary/50 transition-all overflow-hidden block"
                        >
                          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="font-display text-6xl font-700 text-primary">{i+1}</span>
                          </div>
                          <img 
                            src={playerAvatar} 
                            alt={player.nickname || player.name}
                            className="w-16 h-16 rounded-lg object-cover bg-surface border border-border shrink-0 z-10"
                          />
                          <div className="z-10 min-w-0">
                            <h4 className="font-display text-lg font-700 text-white group-hover:text-primary transition-colors truncate">
                              {player.nickname || player.game_nickname || player.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-600 text-primary uppercase tracking-widest">
                                {formatRolesList(contract.roles)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </Reveal>
            </div>

            {/* Historial de Encuentros */}
            <div className="lg:col-span-1">
              <Reveal direction="fade" className="rounded-2xl border border-border bg-surface p-6">
                <h3 className="font-display text-xl font-700 text-white uppercase flex items-center gap-2 mb-6">
                  <Swords className="w-5 h-5 text-emerald-400" /> Últimos Encuentros
                </h3>

                {matches.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic">No hay historial de encuentros.</p>
                ) : (
                  <div className="space-y-4">
                    {matches.map(m => {
                      const isPlayed = m.team1_score > 0 || m.team2_score > 0
                      const isT1 = m.team1_id === team.id
                      const myScore = isT1 ? m.team1_score : m.team2_score
                      const enemyScore = isT1 ? m.team2_score : m.team1_score
                      const enemy = isT1 ? m.team2 : m.team1
                      const won = myScore > enemyScore

                      return (
                        <div key={m.id} className="flex flex-col gap-2 p-3 rounded-lg bg-background border border-border hover:border-white/20 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-600 text-primary uppercase truncate pr-4">{m.tournaments?.name || 'Torneo'}</span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {m.match_date ? new Date(m.match_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <img src={enemy?.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} className="w-6 h-6 rounded bg-surface shrink-0" />
                              <span className="font-600 text-xs text-white truncate">vs {enemy?.name || 'TBD'}</span>
                            </div>
                            <div className={cn("px-2 py-1 rounded text-xs font-700 min-w-[50px] text-center", 
                              !isPlayed ? "bg-surface text-muted-foreground" :
                              won ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                            )}>
                              {isPlayed ? `${myScore} - ${enemyScore}` : 'VS'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Reveal>
            </div>

          </div>
          
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
