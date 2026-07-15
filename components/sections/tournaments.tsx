'use client'

import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { SplitText } from '@/components/split-text'
import { Reveal } from '@/components/anim'
import { TOURNAMENTS } from '@/lib/site-data'

const entrances = [
  { x: 80, y: 0 }, // left card enters from right
  { x: 0, y: 60 }, // center fades up
  { x: -80, y: 0 }, // right card enters from left
]

export function Tournaments() {
  return (
    <section id="torneos" className="relative bg-surface py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-10">
        <div className="mb-14">
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TOURNAMENTS.map((t, i) => (
            <motion.article
              key={t.title}
              initial={{ opacity: 0, x: entrances[i].x, y: entrances[i].y }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col overflow-hidden border border-border bg-background clip-corner"
              data-cursor
            >
              <div className="relative aspect-[16/11] overflow-hidden">
                <img
                  src={t.img || '/placeholder.svg'}
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
                <h3 className="mt-3 font-display text-xl font-700 uppercase leading-tight tracking-tight text-white">
                  {t.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{t.desc}</p>
                <span className="mt-5 inline-flex items-center gap-2 font-display text-xs font-600 uppercase tracking-[0.18em] text-primary">
                  Leer más
                  <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
