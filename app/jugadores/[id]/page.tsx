import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/sections/site-footer'
import { Trophy, Shield, Gamepad2, Users, Medal, ExternalLink, Camera, Tv } from 'lucide-react'
import { cn } from '@/lib/utils'

export const revalidate = 60

export default async function PlayerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  // Fetch Player
  const { data: player } = await supabase
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
    .eq('id', params.id)
    .single()

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
    .eq('status', 'active')

  const gameInfo = player.player_game_info?.[0]

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
                <div className="absolute top-2 right-2 rounded-full bg-emerald-500 p-1.5 text-white shadow-lg" title="Jugador Destacado">
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
              <p className="mt-2 text-xl font-500 text-muted-foreground">
                {player.name}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                {player.social_ig && (
                  <a href={player.social_ig} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md border border-border bg-deep px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    <Instagram className="h-4 w-4" /> Instagram
                  </a>
                )}
                {player.social_twitch && (
                  <a href={player.social_twitch} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md border border-border bg-deep px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    <Twitch className="h-4 w-4" /> Twitch
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
                  Info del Juego
                </h3>
                
                {gameInfo ? (
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-xs font-600 uppercase tracking-widest text-muted-foreground">ID del Juego</p>
                      <p className="mt-1 font-display text-lg text-white">{gameInfo.game_id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-600 uppercase tracking-widest text-muted-foreground">Servidor</p>
                      <p className="mt-1 font-display text-lg text-white">{gameInfo.server || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-600 uppercase tracking-widest text-muted-foreground">País (Cuenta)</p>
                      <p className="mt-1 font-display text-lg text-white">{gameInfo.country_account || 'N/A'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-faint">No hay información del juego registrada.</p>
                )}
              </div>
            </div>

            {/* Right Column: Teams & Contracts */}
            <div className="flex flex-col gap-12 lg:col-span-2">
              
              <div>
                <h3 className="mb-6 font-display text-2xl font-600 uppercase tracking-widest text-white flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  Equipos Actuales
                </h3>
                
                {contracts && contracts.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {contracts.map((contract: any, idx: number) => {
                      const team = contract.teams
                      return (
                        <a 
                          key={idx}
                          href={`/equipos/${team.id}`}
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
                              <div className="mt-1 flex gap-2 text-xs font-500 uppercase tracking-widest text-muted-foreground">
                                {contract.roles && contract.roles.map((r: string, i: number) => (
                                  <span key={i}>{r}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="rounded bg-emerald-500/10 px-3 py-1 text-xs font-600 uppercase tracking-widest text-emerald-500">
                            Activo
                          </div>
                        </a>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center">
                    <p className="text-sm text-muted-foreground">Este jugador no tiene contratos activos con ningún equipo actualmente.</p>
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
