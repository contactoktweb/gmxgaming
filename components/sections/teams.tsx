'use client'

import { SplitText } from '@/components/split-text'
import { Reveal } from '@/components/anim'
import { TEAMS } from '@/lib/site-data'

export function Teams() {
  const doubled = [...TEAMS, ...TEAMS]
  return (
    <section id="equipos" className="relative overflow-hidden bg-background py-24 lg:py-32">
      <div className="mx-auto mb-14 max-w-[1400px] px-5 lg:px-10">
        <Reveal direction="fade">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-10 bg-primary" />
            <span className="font-display text-xs font-600 uppercase tracking-[0.3em] text-primary sm:text-sm">
              La élite compite con nosotros
            </span>
          </div>
        </Reveal>
        <SplitText
          as="h2"
          variant="title"
          text="EQUIPOS AFILIADOS"
          className="font-display text-4xl font-700 uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl"
        />
      </div>

      <div className="relative flex overflow-hidden">
        <div className="flex shrink-0 gap-6 pr-6 animate-marquee-left">
          {doubled.map((t, i) => (
            <a
              key={i}
              href={t.link || '#'}
              target={t.link ? '_blank' : undefined}
              rel={t.link ? 'noopener noreferrer' : undefined}
              className="group flex h-40 w-72 shrink-0 flex-col items-center justify-center gap-3 border border-border bg-surface transition-colors duration-300 hover:border-primary hover:bg-elevated clip-corner"
              data-cursor
            >
              {t.logo ? (
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-border bg-background transition-transform duration-300 group-hover:scale-110">
                  <img src={t.logo} alt={t.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <span className="flex h-14 w-14 items-center justify-center bg-elevated font-display text-2xl font-700 text-primary transition-transform duration-300 group-hover:scale-110">
                  {t.name.charAt(0)}
                </span>
              )}
              <span className="font-display text-lg font-700 uppercase tracking-tight text-white">
                {t.name}
              </span>
              <span className="text-[10px] font-500 uppercase tracking-[0.2em] text-faint">
                {t.game}
              </span>
            </a>
          ))}
        </div>
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
      </div>
    </section>
  )
}
