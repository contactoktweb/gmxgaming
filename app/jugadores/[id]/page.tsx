import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/sections/site-footer'
import { Trophy, Shield, Gamepad2, Users, Medal, ExternalLink, Camera, Tv } from 'lucide-react'
import { cn, formatRoleTitle, getPlayerSlug, getTeamSlug, slugify } from '@/lib/utils'
import { cookies } from 'next/headers'
import { translations, type Language } from '@/lib/i18n/translations'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: paramSlug } = await params
  const cookieStore = await cookies()
  const lang = (cookieStore.get('gmx_lang')?.value as Language) || 'es'
  const d = translations[lang] || translations.es
  const supabase = createClient(cookieStore)

  // Verificar si el usuario actual es administrador
  const { data: { user: authUser } } = await supabase.auth.getUser()
  let isAdmin = false
  if (authUser) {
    const { data: authProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .single()
    isAdmin = authProfile?.role === 'admin'
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paramSlug)

  let player = null
  if (isUuid) {
    const { data } = await supabase
      .from('profiles')
      .select(`
        *,
        player_game_info (
          game,
          game_id,
          server,
          game_nickname,
          country_account
        )
      `)
      .eq('id', paramSlug)
      .single()
    player = data
  } else {
    // Buscar jugador por slug de nickname o nombre
    const { data: allPlayers } = await supabase
      .from('profiles')
      .select(`
        *,
        player_game_info (
          game,
          game_id,
          server,
          game_nickname,
          country_account
        )
      `)
      .eq('is_player', true)

    if (allPlayers) {
      player = allPlayers.find(p => getPlayerSlug(p) === paramSlug || slugify(p.nickname) === paramSlug || slugify(p.name) === paramSlug || p.id === paramSlug)
    }
  }

  if (!player || !player.is_player) {
    notFound()
  }

  // Fetch Current Contracts (Teams)
  const { data: contracts } = await supabase
    .from('contracts')
    .select(`
      roles,
      status,
      team_id,
      teams (
        id,
        name,
        logo_url,
        tag
      )
    `)
    .eq('player_id', player.id)
    .in('status', ['active', 'activo', 'pending_player_release', 'pending_manager_release'])

  const gameInfo = player.player_game_info?.[0]
  const playerCountry = gameInfo?.country_account || player.country || null
  const activeContracts = contracts || []
  const activeRoles = Array.from(
    new Set(
      activeContracts.flatMap((c: any) => {
        if (!c.roles) return []
        if (Array.isArray(c.roles)) return c.roles
        return [c.roles]
      }).filter(Boolean)
    )
  )

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-deep pt-24 pb-32">
        {/* Banner */}
        <div className="relative overflow-hidden border-b border-border bg-surface px-5 py-24 lg:px-10">
          <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-surface to-surface" />
          {player.cover_url && (
            <div 
              className="absolute inset-0 z-0 opacity-10 bg-cover bg-center" 
              style={{ backgroundImage: `url(${player.cover_url})`, filter: 'blur(20px)' }}
            />
          )}
          
          <div className="container relative z-10 mx-auto max-w-5xl flex flex-col items-center gap-8 sm:flex-row sm:items-end">
            <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded border-4 border-border bg-deep shadow-2xl">
              <img 
                src={player.avatar_url || '/images/placeholder.jpg'} 
                alt={player.nickname || player.name} 
                className="h-full w-full object-cover"
              />
              {player.is_featured && (
                <div className="absolute top-2 right-2 rounded-full bg-emerald-500 p-1.5 text-white shadow-lg" title={d.playerDetail.featuredPlayer}>
                  <Medal className="h-4 w-4" />
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
              {gameInfo?.game && (
                <span className="mb-3 rounded bg-primary/20 px-3 py-1 text-xs font-600 uppercase tracking-widest text-primary">
                  {gameInfo.game}
                </span>
              )}
              <h1 className="font-display text-4xl font-700 uppercase tracking-tight text-white sm:text-6xl">
                {gameInfo?.game_nickname || player.nickname || player.name}
              </h1>
              {/* Solo el administrador ve el nombre real */}
              {isAdmin && player.name && (
                <p className="mt-2 text-xl font-500 text-muted-foreground">
                  {player.name}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-4">
                {player.social_ig && (
                  <a href={player.social_ig} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md border border-border bg-deep px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    Instagram
                  </a>
                )}
                {player.social_twitch && (
                  <a href={player.social_twitch} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md border border-border bg-deep px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>
                    Twitch
                  </a>
                )}
                {player.social_x && (
                  <a href={player.social_x} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md border border-border bg-deep px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    <ExternalLink className="h-4 w-4" /> Twitter
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto mt-16 max-w-5xl px-5 lg:px-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            
            {/* Left Column: Info & Game Stats */}
            <div className="flex flex-col gap-8 lg:col-span-1">
              
              <div className="rounded-xl border border-border bg-surface p-6 shadow-xl">
                <h3 className="mb-6 font-display text-lg font-600 uppercase tracking-widest text-white flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                  {d.playerDetail.gameInfo}
                </h3>
                
                {playerCountry || (activeContracts.length > 0 && activeRoles.length > 0) ? (
                  <div className="flex flex-col gap-5">
                    {playerCountry && (
                      <div>
                        <p className="text-xs font-600 uppercase tracking-widest text-muted-foreground">{d.playerDetail.country}</p>
                        <p className="mt-1 font-display text-lg text-white">{playerCountry}</p>
                      </div>
                    )}
                    {activeContracts.length > 0 && activeRoles.length > 0 && (
                      <div>
                        <p className="text-xs font-600 uppercase tracking-widest text-muted-foreground">{d.playerDetail.contractRole}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {activeRoles.map((r: string, i: number) => (
                            <span key={i} className="rounded bg-white/5 px-2.5 py-1 text-xs font-600 text-white/90 border border-white/10">
                              {formatRoleTitle(r, lang)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-faint">{d.playerDetail.noGameInfo}</p>
                )}
              </div>
            </div>

            {/* Right Column: Teams & Contracts */}
            <div className="flex flex-col gap-12 lg:col-span-2">
              
              <div>
                <h3 className="mb-6 font-display text-2xl font-600 uppercase tracking-widest text-white flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  {d.playerDetail.currentTeams}
                </h3>
                
                {contracts && contracts.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {contracts.map((contract: any, idx: number) => {
                      const team = contract.teams
                      return (
                        <Link 
                          key={idx}
                          href={`/equipos/${getTeamSlug(team)}`}
                          className="group flex items-center justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary/50 hover:bg-white/5"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-deep border border-border">
                              <img 
                                src={team.logo_url || '/images/placeholder.jpg'} 
                                alt={team.name} 
                                className="h-full w-full object-cover transition-transform group-hover:scale-110"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-display text-xl font-700 uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                                {team.name}
                              </span>
                              <div className="mt-1 flex flex-wrap gap-2 text-xs font-500 text-muted-foreground">
                                {Array.isArray(contract.roles) ? (
                                  contract.roles.map((r: string, i: number) => (
                                    <span key={i} className="rounded bg-white/5 px-2 py-0.5 text-xs font-600 text-white/80 border border-white/10">
                                      {formatRoleTitle(r, lang)}
                                    </span>
                                  ))
                                ) : contract.roles ? (
                                  <span className="rounded bg-white/5 px-2 py-0.5 text-xs font-600 text-white/80 border border-white/10">
                                    {formatRoleTitle(contract.roles, lang)}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          
                          <div className="rounded bg-emerald-500/10 px-3 py-1 text-xs font-600 uppercase tracking-widest text-emerald-500">
                            {d.playerDetail.activeStatus}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center">
                    <p className="text-sm text-muted-foreground">{d.playerDetail.noContracts}</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
