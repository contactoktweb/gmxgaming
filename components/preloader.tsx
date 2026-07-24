'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

const LETTERS = ['G', 'M', 'X', ' ', 'G', 'A', 'M', 'I', 'N', 'G']

let hasShownPreloader = false

export function Preloader({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase] = useState<'loading' | 'reveal' | 'done'>(
    hasShownPreloader ? 'done' : 'loading'
  )

  useEffect(() => {
    if (hasShownPreloader) {
      onDone?.()
      return
    }

    document.body.style.overflow = 'hidden'
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const loadMs = reduce ? 700 : 2200
    const t1 = setTimeout(() => setPhase('reveal'), loadMs)
    return () => clearTimeout(t1)
  }, [onDone])

  useEffect(() => {
    if (phase === 'reveal') {
      const t = setTimeout(() => {
        setPhase('done')
        hasShownPreloader = true
        document.body.style.overflow = ''
        onDone?.()
      }, 1000)
      return () => clearTimeout(t)
    }
  }, [phase, onDone])

  const panels = [0, 1, 2, 3]

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <div className="fixed inset-0 z-[10000]" aria-hidden>
          {/* Center content */}
          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-8"
            animate={
              phase === 'reveal'
                ? { y: -30, opacity: 0 }
                : { y: 0, opacity: 1 }
            }
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {/* Glowing Dual-Arc Spinner */}
            <div className="h-16 w-16 rounded-full border-2 border-transparent border-y-primary animate-spin-fast filter drop-shadow-[0_0_12px_#ff2d20]" />

            {/* GMX GAMING letters */}
            <div className="flex font-display text-3xl font-black uppercase tracking-[0.25em] text-white sm:text-5xl">
              {LETTERS.map((l, i) => (
                <motion.span
                  key={i}
                  className="inline-block animate-neon-glow"
                  style={{ animationDelay: `${i * 0.08}s` }}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.12, duration: 0.4, ease: 'easeOut' }}
                >
                  {l === ' ' ? '\u00A0\u00A0' : l}
                </motion.span>
              ))}
            </div>

            <motion.span
              className="text-[11px] font-700 uppercase tracking-[0.6em] text-primary/80 animate-pulse-opacity"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.6 }}
            >
              Loading
            </motion.span>
          </motion.div>

          {/* Four vertical panels */}
          <div className="absolute inset-0 z-10 flex">
            {panels.map((p) => (
              <motion.div
                key={p}
                className="h-full flex-1 bg-deep"
                initial={{ y: 0 }}
                animate={
                  phase === 'reveal'
                    ? { y: p % 2 === 0 ? '-100%' : '100%' }
                    : { y: 0 }
                }
                transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1], delay: p * 0.05 }}
              />
            ))}
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
