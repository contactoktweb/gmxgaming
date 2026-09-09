'use client'

import { motion } from 'motion/react'
import { SplitText } from '@/components/split-text'
import { Reveal } from '@/components/anim'
import { GmxButton } from '@/components/gmx-button'
import { useAuth } from '@/lib/auth-context'

export function CtaPrimary() {
  const { user } = useAuth()

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-20">
        <img src="/images/cta-bg.png" alt="" className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0 -z-10 bg-deep/75" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-deep via-deep/60 to-transparent" />

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-10 px-5 py-24 lg:grid-cols-[1.3fr_1fr] lg:px-10 lg:py-32">
        <div>
          <Reveal direction="fade">
            <span className="font-display text-xs font-600 uppercase tracking-[0.3em] text-primary sm:text-sm">
              El siguiente nivel te espera
            </span>
          </Reveal>
          <SplitText
            as="h2"
            variant="title"
            lines={['ÚNETE A GMX GAMING', 'Y CONVIÉRTETE EN', 'EL PRÓXIMO PRO']}
            className="mt-4 font-display text-4xl font-700 uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl"
          />
          <Reveal direction="up" delay={0.2} className="mt-9">
            {user ? (
              <GmxButton href="/micuenta">IR A TU PERFIL</GmxButton>
            ) : (
              <GmxButton href="/crear-cuenta">CREA TU USUARIO</GmxButton>
            )}
          </Reveal>
        </div>

        {/* Character */}
        <motion.div
          initial={{ opacity: 0, x: 120, scale: 0.95 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden justify-center lg:flex"
        >
          <div className="animate-float-bob-y">
            <img
              src="/images/cta-player.png"
              alt="Campeón de GMX Gaming con trofeo"
              className="max-h-[560px] w-auto object-contain drop-shadow-[0_25px_60px_rgba(255,45,32,0.35)]"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
