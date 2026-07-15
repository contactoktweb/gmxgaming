'use client'

import { motion } from 'motion/react'
import { GmxButton } from '@/components/gmx-button'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}
const titleChar = {
  hidden: { opacity: 0.3, x: -7 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const TITLE_LINES = ['AQUÍ COMIENZA', 'EL CAMINO']

export function Hero({ ready }: { ready: boolean }) {
  return (
    <section id="hero" className="relative flex min-h-[100svh] items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-20">
        <img
          src="/images/hero-bg.png"
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-deep via-deep/85 to-deep/40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-transparent to-background/40" />

      {/* Decorative giant background word */}
      <span className="pointer-events-none absolute -right-6 top-1/2 -z-10 hidden -translate-y-1/2 font-display text-[22vw] font-700 uppercase leading-none text-white/[0.03] lg:block">
        GMX
      </span>

      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-12 px-5 pb-16 pt-32 lg:grid-cols-[42%_58%] lg:px-10">
        {/* Left visual */}
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={ready ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative order-2 lg:order-1"
        >
          <div className="relative mx-auto max-w-sm overflow-hidden clip-corner lg:max-w-none">
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-deep via-transparent to-transparent" />
            <img
              src="/images/hero-player.png"
              alt="Jugador profesional de GMX Gaming"
              className="w-full object-cover"
            />
            <div className="absolute left-4 top-4 z-20 border border-primary/60 bg-deep/60 px-3 py-1.5 font-display text-[11px] font-600 uppercase tracking-[0.2em] text-primary backdrop-blur-sm">
              PRO PLAYER
            </div>
          </div>
        </motion.div>

        {/* Right content */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={ready ? 'visible' : 'hidden'}
          className="order-1 lg:order-2"
        >
          <motion.div variants={fadeUp} className="mb-5 flex items-center gap-3">
            <span className="h-px w-10 bg-primary" />
            <span className="font-display text-xs font-600 uppercase tracking-[0.3em] text-primary sm:text-sm">
              ¡Bienvenidos a GMX Gaming!
            </span>
          </motion.div>

          <motion.h1
            variants={container}
            className="font-display text-5xl font-700 uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl"
          >
            {TITLE_LINES.map((line, li) => (
              <span key={li} className="block">
                {Array.from(line).map((c, ci) => (
                  <motion.span key={ci} variants={titleChar} className="inline-block whitespace-pre">
                    {c === ' ' ? '\u00A0' : c}
                  </motion.span>
                ))}
              </span>
            ))}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-lg font-display text-base font-500 uppercase tracking-[0.12em] text-muted-foreground sm:text-lg"
          >
            Conviértete en jugador profesional de eSports
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-4 sm:flex-row">
            <GmxButton href="#registro">CREA TU USUARIO</GmxButton>
            <GmxButton href="#torneos" variant="secondary">
              VER TORNEOS
            </GmxButton>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex"
      >
        <span className="text-[10px] font-500 uppercase tracking-[0.4em] text-faint">Scroll</span>
        <span className="h-10 w-px animate-pulse bg-gradient-to-b from-primary to-transparent" />
      </motion.div>
    </section>
  )
}
