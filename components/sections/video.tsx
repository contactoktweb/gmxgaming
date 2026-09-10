'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import { Play, X } from 'lucide-react'
import { SplitText } from '@/components/split-text'
import { Reveal } from '@/components/anim'
import { GmxButton } from '@/components/gmx-button'
import { useAuth } from '@/lib/auth-context'

// Configurable: replace with the official GMX Gaming video embed URL.
const VIDEO_URL = 'https://www.youtube.com/embed/dQw4w9WgXcQ'

export function VideoExperience() {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-10%', '10%'])

  return (
    <section className="bg-background px-5 py-8 lg:px-10 lg:py-12">
      <div ref={ref} className="relative mx-auto flex min-h-[380px] max-w-[1400px] items-center overflow-hidden clip-corner lg:min-h-[420px]">
        <motion.div style={{ y }} className="absolute inset-0 -z-20 h-[122%] -top-[11%]">
          <img src="/images/video-bg.png" alt="" className="h-full w-full object-cover" />
        </motion.div>
        <div className="absolute inset-0 -z-10 bg-deep/70" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-deep via-transparent to-deep/50" />

        <div className="relative flex w-full flex-col items-center gap-10 px-6 py-12 text-center lg:flex-row lg:justify-between lg:px-12 lg:py-14 lg:text-left">
          <div className="max-w-xl">
            <Reveal direction="fade">
              <span className="font-display text-xs font-600 uppercase tracking-[0.3em] text-primary sm:text-sm">
                Vive la competencia
              </span>
            </Reveal>
            <SplitText
              as="h2"
              variant="title"
              lines={['TU CAMINO', 'COMIENZA AQUÍ']}
              className="mt-4 font-display text-4xl font-700 uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl"
            />
            <Reveal direction="up" delay={0.2} className="mt-8 flex justify-center lg:justify-start">
              {user ? (
                <GmxButton href="/micuenta">IR A TU PERFIL</GmxButton>
              ) : (
                <GmxButton href="#registro">ÚNETE A GMX</GmxButton>
              )}
            </Reveal>
          </div>

          {/* Play button with ripples */}
          <button
            onClick={() => setOpen(true)}
            aria-label="Reproducir vídeo de GMX Gaming"
            className="relative flex h-24 w-24 shrink-0 items-center justify-center"
            data-cursor
          >
            <span className="absolute inset-0 rounded-full bg-primary/40 animate-ripple" />
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ripple [animation-delay:0.8s]" />
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-ripple [animation-delay:1.6s]" />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white transition-transform duration-300 hover:scale-105">
              <Play className="ml-1 size-7 fill-white" />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/85 p-5 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="relative aspect-video w-full max-w-4xl overflow-hidden border border-border bg-black"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar vídeo"
                className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center bg-primary text-white transition-colors hover:bg-primary-dark"
              >
                <X className="size-5" />
              </button>
              <iframe
                className="h-full w-full"
                src={VIDEO_URL}
                title="Vídeo oficial de GMX Gaming"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
