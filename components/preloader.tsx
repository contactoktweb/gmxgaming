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
        <div 
          className="fixed inset-0 z-[10000] flex w-full h-[100dvh] min-h-[100dvh] items-center justify-center overflow-hidden bg-deep"
          style={{ height: '100dvh', width: '100vw' }}
          aria-hidden
        >
          {/* Center content */}
          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 sm:gap-8 px-4 text-center select-none"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              paddingLeft: 'env(safe-area-inset-left, 0px)',
              paddingRight: 'env(safe-area-inset-right, 0px)',
            }}
            animate={
              phase === 'reveal'
                ? { y: -30, opacity: 0 }
                : { y: 0, opacity: 1 }
            }
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {/* Glowing Dual-Arc Spinner */}
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-transparent border-y-primary animate-spin-fast filter drop-shadow-[0_0_12px_#ff2d20] shrink-0" />

            {/* GMX GAMING letters */}
            <div className="flex items-center justify-center font-display text-2xl xs:text-3xl sm:text-5xl font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] pl-[0.2em] sm:pl-[0.25em] text-white max-w-full overflow-visible">
              {LETTERS.map((l, i) =>
                l === ' ' ? (
                  <span key={i} className="inline-block w-2 sm:w-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <motion.span
                    key={i}
                    className="inline-block animate-neon-glow shrink-0"
                    style={{ animationDelay: `${i * 0.08}s` }}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.12, duration: 0.4, ease: 'easeOut' }}
                  >
                    {l}
                  </motion.span>
                )
              )}
            </div>

            <motion.span
              className="text-[11px] font-700 uppercase tracking-[0.6em] pl-[0.6em] text-primary/80 animate-pulse-opacity shrink-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.6 }}
            >
              Loading
            </motion.span>
          </motion.div>

          {/* Four vertical panels */}
          <div className="absolute inset-0 z-10 flex w-full h-full pointer-events-none">
            {panels.map((p) => (
              <motion.div
                key={p}
                className="h-full flex-1 bg-deep will-change-transform"
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
