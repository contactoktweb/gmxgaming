'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { Reveal, Stagger, StaggerItem } from '@/components/anim'
import { SplitText } from '@/components/split-text'
import { useLanguage } from '@/lib/language-context'
import { cn } from '@/lib/utils'

export function About() {
  const ref = useRef<HTMLDivElement>(null)
  const { d } = useLanguage()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y1 = useTransform(scrollYProgress, [0, 1], [60, -60])
  const y2 = useTransform(scrollYProgress, [0, 1], [-40, 80])

  return (
    <section id="registro" ref={ref} className="relative overflow-hidden bg-background py-12 lg:py-16">
      {/* Giant background word */}
      <span className="pointer-events-none absolute -left-4 top-8 select-none font-display text-[16vw] font-700 uppercase leading-[0.8] text-white/[0.03] lg:text-[12vw]">
        GMX
        <br />
        GAMING
      </span>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-5 lg:grid-cols-2 lg:gap-16 lg:px-10">
        {/* Text column */}
        <div className="relative">
          <Reveal direction="fade">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-10 bg-primary" />
              <span className="font-display text-xs font-600 uppercase tracking-[0.3em] text-primary sm:text-sm">
                {d.about.badge}
              </span>
            </div>
          </Reveal>

          <SplitText
            as="h2"
            variant="title"
            lines={[d.about.title1, d.about.title2]}
            className="font-display text-5xl font-700 uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl"
          />

          <Reveal direction="up" delay={0.15} className="mt-7">
            <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              {d.about.description}
            </p>
          </Reveal>
        </div>

        {/* Images column */}
        <div className="relative h-[320px] sm:h-[450px] lg:h-[520px] mt-8 lg:mt-0">
          <motion.div
            style={{ y: y1 }}
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-0 w-[65%] sm:w-[62%] h-[60%] sm:h-auto overflow-hidden clip-corner"
          >
            <img src="/images/about-1.png" alt="Equipo de GMX celebrando victoria" className="h-full w-full object-cover" />
          </motion.div>

          <motion.div
            style={{ y: y2 }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-0 right-0 w-[60%] sm:w-[55%] h-[55%] sm:h-auto overflow-hidden border border-border clip-corner"
          >
            <img src="/images/about-2.png" alt="Detalle de gaming competitivo" className="h-full w-full object-cover" />
          </motion.div>

          <div className="absolute right-0 sm:right-2 top-4 sm:top-6 border border-primary/50 bg-deep/70 px-3 sm:px-4 py-2 sm:py-3 backdrop-blur-sm z-10">
            <p className="font-display text-2xl sm:text-3xl font-700 leading-none text-primary">{d.about.playersCount}</p>
            <p className="mt-1 text-[9px] sm:text-[10px] font-500 uppercase tracking-[0.2em] text-muted-foreground">
              {d.about.playersLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Benefit blocks */}
      <Stagger className="mx-auto mt-20 grid max-w-[1400px] grid-cols-1 gap-px overflow-hidden border border-border bg-border px-0 sm:grid-cols-2 lg:mt-24 lg:grid-cols-4 lg:mx-auto" amount={0.15}>
        {d.about.benefits.map((b, idx) => {
          const isAccent = idx === 0 || idx === 3
          return (
          <StaggerItem key={b.n} className="h-full">
            <div
              className={cn(
                'group relative flex h-full flex-col justify-between gap-8 p-8 transition-colors duration-300',
                isAccent
                  ? 'bg-primary text-white hover:bg-primary-dark'
                  : 'bg-surface text-white hover:bg-elevated',
              )}
              data-cursor
            >
              <span
                className={cn(
                  'font-display text-5xl font-700 leading-none',
                  isAccent ? 'text-white/40' : 'text-primary/60',
                )}
              >
                {b.n}
              </span>
              <div>
                <h3 className="font-display text-xl font-700 uppercase leading-tight tracking-tight">
                  {b.title}
                </h3>
                <p
                  className={cn(
                    'mt-3 text-sm leading-relaxed',
                    isAccent ? 'text-white/85' : 'text-muted-foreground',
                  )}
                >
                  {b.desc}
                </p>
              </div>
              <span
                className={cn(
                  'h-0.5 w-8 transition-all duration-300 group-hover:w-16',
                  isAccent ? 'bg-white/60' : 'bg-primary',
                )}
              />
            </div>
          </StaggerItem>
        )})}
      </Stagger>
    </section>
  )
}
