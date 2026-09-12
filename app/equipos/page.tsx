'use client'

import { useState, useEffect } from 'react'
import { Preloader } from '@/components/preloader'
import { SmoothScroll } from '@/components/smooth-scroll'
import { CustomCursor } from '@/components/custom-cursor'
import { SiteHeader } from '@/components/site-header'
import { getTeamSlug } from '@/lib/utils'
import { BackToTop } from '@/components/back-to-top'
import { SiteFooter } from '@/components/sections/site-footer'
import { Reveal } from '@/components/anim'
import { ShieldAlert, MapPin, ArrowUpRight, Search } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useLanguage } from '@/lib/language-context'
import Link from 'next/link'

export default function EquiposPage() {
  const [ready, setReady] = useState(false)
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { d } = useLanguage()

  useEffect(() => {
    async function fetchTeams() {
      const supabase = createClient()
      const { data } = await supabase
        .from('teams')
        .select('*')
        .in('status', ['active', 'activo'])
        .order('name', { ascending: true })
      
      if (data) setTeams(data)
      setLoading(false)
    }
    fetchTeams()
  }, [])

  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <>
      <Preloader onDone={() => setReady(true)} />
      <SmoothScroll />
      <CustomCursor />
      <SiteHeader />
      <BackToTop />

      <main className="relative min-h-screen pt-32 pb-24 bg-background">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-primary/5 blur-[120px]" />
        </div>

        <div className="relative z-10 px-5 lg:px-10 max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <Reveal direction="up" className="flex-1">
              <h1 className="font-display text-4xl font-700 uppercase tracking-tight text-white sm:text-5xl lg:text-6xl mb-4">
                {d.teamsPage.title}
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                {d.teamsPage.subtitle}
              </p>
            </Reveal>

            <Reveal direction="left" delay={0.2} className="w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={d.teamsPage.searchPlaceholder}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-border bg-surface pl-12 pr-6 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </Reveal>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : teams.length === 0 ? (
            <Reveal direction="up">
              <div className="text-center py-24 border border-dashed border-border rounded-xl bg-surface">
                <ShieldAlert className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-50" />
                <h3 className="font-display text-2xl text-white font-700 uppercase tracking-tight mb-2">{d.teamsPage.noTeamsTitle}</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  {d.teamsPage.noTeamsDesc}
                </p>
                <Link href="/registro/alta-de-equipo" className="inline-flex items-center justify-center px-6 py-3 mt-8 bg-primary text-white font-600 rounded uppercase tracking-widest text-xs hover:bg-primary-dark transition-colors clip-corner">
                  {d.teamsPage.registerTeamBtn}
                </Link>
              </div>
            </Reveal>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-border rounded-xl bg-surface">
              <p className="text-muted-foreground">{d.teamsPage.noSearchResults}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTeams.map((team, i) => (
                <Reveal key={team.id} direction="up" delay={i * 0.05}>
                  <Link href={`/equipos/${getTeamSlug(team)}`} className="group relative flex flex-col items-center p-8 rounded-2xl bg-surface border border-border hover:border-primary/50 transition-all overflow-hidden text-center block">
                    
                    {/* Background glow on hover */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative w-28 h-28 mb-6">
                      <img 
                        src={team.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                        alt={team.name}
                        className="w-full h-full object-cover rounded-full bg-background border-4 border-background shadow-xl z-10 relative transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 rounded-full border border-primary/20 scale-[1.15] opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    </div>

                    <h3 className="font-display text-xl font-700 text-white uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-1 w-full relative z-10">
                      {team.name}
                    </h3>
                    
                    <div className="flex items-center justify-center gap-1.5 mt-2 text-muted-foreground relative z-10">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-xs font-500 uppercase tracking-widest">{team.country || d.teamsPage.international}</span>
                    </div>

                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full border border-border bg-background flex items-center justify-center text-white opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>

                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
