'use client'

import { useState, useEffect } from 'react'
import { Preloader } from '@/components/preloader'
import { SmoothScroll } from '@/components/smooth-scroll'
import { CustomCursor } from '@/components/custom-cursor'
import { SiteHeader } from '@/components/site-header'
import { BackToTop } from '@/components/back-to-top'
import { SiteFooter } from '@/components/sections/site-footer'
import { Reveal } from '@/components/anim'
import { Calendar, Users, Trophy, ArrowUpRight, Gamepad2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { getTournamentSlug } from '@/lib/utils'
import Link from 'next/link'

export default function TorneosPage() {
  const [ready, setReady] = useState(false)
  const [tournaments, setTournaments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTournaments() {
      const supabase = createClient()
      try {
        let list: any[] = []
        const { data, error } = await supabase
          .from('tournaments')
          .select('*, templates:tournament_templates(name, type, logo_url)')
          .order('start_date', { ascending: false })
        
        if (!error && data) {
          list = data
        } else {
          const { data: rawData } = await supabase
            .from('tournaments')
            .select('*')
            .order('start_date', { ascending: false })
          if (rawData) list = rawData
        }

        const missingIds = list.filter(t => !t.templates && t.template_id).map(t => t.template_id)
        if (missingIds.length > 0) {
          const { data: tmpls } = await supabase
            .from('tournament_templates')
            .select('id, name, type, logo_url')
            .in('id', missingIds)
          if (tmpls) {
            const map = new Map(tmpls.map(tm => [tm.id, tm]))
            list = list.map(t => ({
              ...t,
              templates: t.templates || map.get(t.template_id)
            }))
          }
        }

        setTournaments(list)
      } catch (err) {
        console.error('Error fetching tournaments:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTournaments()
  }, [])

  const upcoming = tournaments.filter(t => t.status === 'upcoming')
  const ongoing = tournaments.filter(t => t.status === 'ongoing')
  const finished = tournaments.filter(t => t.status === 'finished')

  const renderTournamentCard = (t: any) => {
    const tmplObj = Array.isArray(t.templates) ? t.templates[0] : t.templates
    const imgUrl = t.logo_url || t.banner_url || t.image_url || tmplObj?.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'

    return (
    <Link href={`/torneos/${getTournamentSlug(t)}`} key={t.id} className="group relative rounded-xl border border-border bg-surface p-6 sm:p-8 transition-colors hover:border-primary/50 block">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="shrink-0 flex justify-center sm:justify-start">
          <img 
            src={imgUrl} 
            alt={t.name} 
            className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl bg-background border border-border transition-transform duration-500 group-hover:scale-105" 
          />
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-1 text-[10px] font-600 uppercase tracking-widest rounded-full ${
                t.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                t.status === 'ongoing' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                'bg-white/5 text-muted-foreground border border-white/10'
              }`}>
                {t.status === 'upcoming' ? 'Próximo' : t.status === 'ongoing' ? 'En Curso' : 'Finalizado'}
              </span>
              <span className="text-xs font-600 text-primary uppercase tracking-widest flex items-center gap-1">
                <Gamepad2 className="w-3 h-3" /> {t.game}
              </span>
            </div>
            <h3 className="font-display text-2xl font-700 text-white group-hover:text-primary transition-colors">{t.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t.templates?.type}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm text-white font-500">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              {t.start_date ? new Date(t.start_date).toLocaleDateString() : 'TBD'}
            </div>
            <div className="flex items-center gap-2 text-sm text-white font-500">
              <Trophy className="w-4 h-4 text-emerald-400" />
              {t.prizepool_total || 'N/A'}
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute right-6 top-6 sm:bottom-6 sm:top-auto">
        <div className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center text-white transition-colors group-hover:border-primary group-hover:bg-primary">
          <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </Link>
    )
  }

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

        <div className="relative z-10 px-5 lg:px-10 max-w-[1000px] mx-auto">
          <div className="text-center mb-20">
            <Reveal direction="up">
              <h1 className="font-display text-4xl font-700 uppercase tracking-tight text-white sm:text-5xl lg:text-6xl mb-4">
                Torneos y Ligas
              </h1>
              <p className="text-lg text-muted-foreground">
                El ecosistema competitivo oficial de GMX Gaming.
              </p>
            </Reveal>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-20">
              
              {ongoing.length > 0 && (
                <div>
                  <Reveal direction="fade" className="flex items-center gap-4 mb-8">
                    <h2 className="font-display text-3xl font-700 uppercase text-white tracking-widest flex items-center gap-3">
                      <span className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                      </span>
                      En Curso
                    </h2>
                    <div className="h-px bg-border flex-1 ml-4" />
                  </Reveal>
                  <div className="grid gap-6">
                    {ongoing.map(renderTournamentCard)}
                  </div>
                </div>
              )}

              {upcoming.length > 0 && (
                <div>
                  <Reveal direction="fade" className="flex items-center gap-4 mb-8">
                    <h2 className="font-display text-3xl font-700 uppercase text-white tracking-widest text-blue-400">
                      Próximos Torneos
                    </h2>
                    <div className="h-px bg-border flex-1 ml-4" />
                  </Reveal>
                  <div className="grid gap-6">
                    {upcoming.map(renderTournamentCard)}
                  </div>
                </div>
              )}

              {finished.length > 0 && (
                <div>
                  <Reveal direction="fade" className="flex items-center gap-4 mb-8">
                    <h2 className="font-display text-3xl font-700 uppercase text-white tracking-widest text-muted-foreground">
                      Torneos Pasados
                    </h2>
                    <div className="h-px bg-border flex-1 ml-4" />
                  </Reveal>
                  <div className="grid gap-6 opacity-75 hover:opacity-100 transition-opacity">
                    {finished.map(renderTournamentCard)}
                  </div>
                </div>
              )}

              {tournaments.length === 0 && (
                <div className="text-center py-24 border border-dashed border-border rounded-xl bg-surface">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-xl text-white font-700 mb-2">No hay torneos registrados</h3>
                  <p className="text-muted-foreground text-sm">Los próximos torneos aparecerán aquí automáticamente.</p>
                </div>
              )}

            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
