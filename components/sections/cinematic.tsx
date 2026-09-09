'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { SplitText } from '@/components/split-text'
import { Reveal } from '@/components/anim'
import { GmxButton } from '@/components/gmx-button'
import { useAuth } from '@/lib/auth-context'

export function Cinematic() {
  const ref = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-12%', '12%'])

  return (
    <section ref={ref} className="relative overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0 -z-20 h-[124%] -top-[12%]">
        <img src="/images/cinematic-bg.png" alt="" className="h-full w-full object-cover" />
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-deep/80" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-deep/90 via-transparent to-deep/90" />

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-16 px-5 py-28 lg:grid-cols-2 lg:gap-24 lg:px-10 lg:py-40">
        {/* Left block */}
        <div className="lg:border-r lg:border-border lg:pr-16">
          <Reveal direction="fade">
            <span className="font-display text-xs font-600 uppercase tracking-[0.3em] text-primary sm:text-sm">
              Compite al más alto nivel
            </span>
          </Reveal>
          <SplitText
            as="h2"
            variant="title"
            lines={['CONSTRUYE', 'TU CAMINO', 'HACIA LA CIMA']}
            className="mt-5 font-display text-4xl font-700 uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl"
          />
          <Reveal direction="up" delay={0.2} className="mt-8">
            {user ? (
              <GmxButton href="/micuenta">IR A TU PERFIL</GmxButton>
            ) : (
              <GmxButton href="#registro">REGÍSTRATE AHORA</GmxButton>
            )}
          </Reveal>
        </div>

        {/* Right block */}
        <div>
          <Reveal direction="fade">
            <span className="font-display text-xs font-600 uppercase tracking-[0.3em] text-primary sm:text-sm">
              Tu próxima partida puede cambiarlo todo
            </span>
          </Reveal>
          <SplitText
            as="h2"
            variant="title"
            lines={['JUEGA.', 'MEJORA.', 'CONQUISTA.']}
            className="mt-5 font-display text-4xl font-700 uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl"
          />
          <Reveal direction="up" delay={0.2} className="mt-8">
            <GmxButton href="#torneos" variant="secondary">
              VER TORNEOS
            </GmxButton>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
