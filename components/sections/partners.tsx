'use client'

import { PARTNERS } from '@/lib/site-data'

export function Partners() {
  const doubled = [...PARTNERS, ...PARTNERS]
  return (
    <section className="border-y border-border bg-deep py-14">
      <div className="mx-auto mb-8 max-w-[1400px] px-5 lg:px-10">
        <p className="text-center font-display text-[11px] font-500 uppercase tracking-[0.4em] text-faint">
          Partners · Patrocinadores · Ligas · Federaciones
        </p>
      </div>
      <div className="relative flex overflow-hidden">
        <div className="flex shrink-0 items-center gap-16 pr-16 animate-marquee-right">
          {doubled.map((p, i) => (
            <span
              key={i}
              className="shrink-0 font-display text-xl font-700 uppercase tracking-tight text-white/40 transition-colors duration-300 hover:text-white sm:text-2xl"
              data-cursor
            >
              {p}
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-deep to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-deep to-transparent" />
      </div>
    </section>
  )
}
