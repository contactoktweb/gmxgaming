'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { SplitText } from '@/components/split-text'
import { Reveal } from '@/components/anim'
import { createClient } from '@/utils/supabase/client'
import { getTournamentSlug } from '@/lib/utils'
import Link from 'next/link'
import { TOURNAMENTS as DEFAULT_TOURNAMENTS } from '@/lib/site-data'

const entrances = [
  { x: 80, y: 0 }, // left card enters from right
  { x: 0, y: 60 }, // center fades up
  { x: -80, y: 0 }, // right card enters from left
]

export function Tournaments() {
  const [tournamentsList, setTournamentsList] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchTournaments() {
      const { data } = await supabase
        .from('tournaments')
        .select('*, templates:tournament_templates(name, type, logo_url)')
        .order('start_date', { ascending: false })
        .limit(3)

      if (data && data.length > 0) {
        const formatted = data.map((t: any) => {
          const dateStr = t.start_date
            ? new Date(t.start_date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
            : 'Próximamente'

          return {
            id: t.id,
            slug: getTournamentSlug(t),
            category: t.templates?.type || t.game || 'Torneo Oficial',
            title: t.name,
            date: dateStr.toUpperCase(),
            desc: t.description || `Torneo oficial de ${t.game || 'Mobile Legends'}. Los mejores equipos compiten por el título y la gloria.`,
            img: t.templates?.logo_url || '/images/tournament-1.png',
            href: `/torneos/${getTournamentSlug(t)}`
          }
        })
        setTournamentsList(formatted)
      } else {
        setTournamentsList(DEFAULT_TOURNAMENTS.map(t => ({ ...t, href: '/torneos' })))
      }
    }

    fetchTournaments()
  }, [])

  const itemsToDisplay = tournamentsList.length > 0 ? tournamentsList : DEFAULT_TOURNAMENTS

  return (
    <section id="torneos" className="relative bg-surface py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-10">
        <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Reveal direction="fade">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-primary" />
                <span className="font-display text-xs font-600 uppercase tracking-[0.3em] text-primary sm:text-sm">
                  Lo último de la escena
                </span>
              </div>
            </Reveal>
            <SplitText
              as="h2"
              variant="title"
              lines={['ÚLTIMOS TORNEOS', 'Y NOTICIAS']}
              className="font-display text-4xl font-700 uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl"
            />
          </div>

          <Link
            href="/torneos"
            className="inline-flex items-center gap-2 font-display text-xs font-700 uppercase tracking-widest text-primary hover:text-white transition-colors"
          >
            Ver Todos los Torneos
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {itemsToDisplay.map((t, i) => {
            const entranceIndex = i % 3
            return (
              <motion.article
                key={t.id || t.title || i}
                initial={{ opacity: 0, x: entrances[entranceIndex].x, y: entrances[entranceIndex].y }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col overflow-hidden border border-border bg-background clip-corner"
                data-cursor
              >
                <Link href={t.href || (t.id ? `/torneos/${getTournamentSlug(t)}` : '/torneos')} className="flex flex-col flex-1">
                  <div className="relative aspect-[16/11] overflow-hidden bg-surface">
                    <img
                      src={t.img || '/images/tournament-1.png'}
                      alt={t.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                    <span className="absolute left-4 top-4 bg-primary px-2.5 py-1 font-display text-[10px] font-600 uppercase tracking-[0.15em] text-white">
                      {t.category}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <span className="text-[11px] font-500 uppercase tracking-[0.25em] text-faint">
                      {t.date}
                    </span>
                    <h3 className="mt-3 font-display text-xl font-700 uppercase leading-tight tracking-tight text-white group-hover:text-primary transition-colors">
                      {t.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">{t.desc}</p>
                    <span className="mt-5 inline-flex items-center gap-2 font-display text-xs font-600 uppercase tracking-[0.18em] text-primary">
                      Leer más
                      <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
