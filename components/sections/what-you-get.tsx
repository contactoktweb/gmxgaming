'use client'

import { motion } from 'motion/react'
import { SplitText } from '@/components/split-text'
import { Reveal } from '@/components/anim'
import { GMX_BENEFITS } from '@/lib/site-data'
import { cn } from '@/lib/utils'

export function WhatYouGet() {
  return (
    <section className="relative overflow-hidden bg-surface py-24 lg:py-32">
      <span className="pointer-events-none absolute right-0 top-10 select-none font-display text-[18vw] font-700 uppercase leading-none text-white/[0.02]">
        2026
      </span>

      <div className="mx-auto max-w-[1400px] px-5 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <Reveal direction="fade">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-primary" />
                <span className="font-display text-xs font-600 uppercase tracking-[0.3em] text-primary sm:text-sm">
                  Forma parte de algo más grande
                </span>
              </div>
            </Reveal>
            <SplitText
              as="h2"
              variant="title"
              lines={['QUÉ OBTENDRÁS', 'AL UNIRTE A', 'GMX GAMING']}
              className="font-display text-4xl font-700 uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl"
            />
            <Reveal direction="up" delay={0.15} className="mt-7">
              <p className="max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                Al ser parte de nuestra comunidad, ganarás exposición internacional, competirás en
                torneos globales y tendrás la oportunidad de brillar en eventos presenciales de talla
                mundial. Además, obtendrás el prestigioso reconocimiento de la Federación Mexicana de
                Esports, acceso a recompensas exclusivas y la posibilidad de conectar con una red
                apasionada de jugadores. Mejora tus habilidades, vive la adrenalina de la competencia
                y lleva tu pasión por el gaming a nuevos horizontes con GMX Gaming, ¡donde los sueños
                de los gamers se hacen realidad!
              </p>
            </Reveal>
          </div>

          {/* Editorial irregular grid */}
          <div className="grid grid-cols-2 gap-px bg-border">
            {GMX_BENEFITS.map((b, i) => (
              <motion.div
                key={b.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: (i % 2) * 0.1 + Math.floor(i / 2) * 0.05 }}
                className={cn(
                  'group relative flex flex-col justify-between gap-6 bg-surface p-6 transition-colors duration-300 hover:bg-elevated',
                  i % 3 === 0 && 'sm:p-7',
                )}
                data-cursor
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-2xl font-700 leading-none text-primary">
                    {b.n}
                  </span>
                  <span className="h-px flex-1 bg-border transition-colors group-hover:bg-primary/50" />
                </div>
                <h3 className="font-display text-base font-600 uppercase leading-tight tracking-tight text-white sm:text-lg">
                  {b.title}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
