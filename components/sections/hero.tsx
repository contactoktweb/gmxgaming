'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { GmxButton } from '@/components/gmx-button'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'

// Animations
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } },
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } },
}

const titleLineVariants = {
  hidden: { y: '110%' },
  visible: { y: '0%', transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } }
}

const titleCharVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }
}

export function Hero({ ready }: { ready: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { d } = useLanguage()
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  // Parallax transforms mapped to scroll position
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const playerY = useTransform(scrollYProgress, [0, 1], ['0%', '-10%'])
  const playerScale = useTransform(scrollYProgress, [0, 1], [1, 0.95])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])

  const word1 = d.hero.titleWords[0] || 'AQUÍ'
  const word2 = d.hero.titleWords[1] || 'COMIENZA'
  const word3 = d.hero.titleWords[2] || 'EL'
  const word4 = d.hero.titleWords[3] || 'CAMINO'
  const tickerItems = d.hero.ticker

  return (
    <section ref={containerRef} id="hero" className="relative flex min-h-[100svh] w-full flex-col justify-center overflow-hidden bg-deep">
      
      {/* LAYER 1: Background Layer */}
      <motion.div 
        className="absolute inset-0 z-0 origin-center"
        style={{ y: bgY }}
        initial={{ scale: 1.05 }}
        animate={ready ? { scale: 1 } : {}}
        transition={{ duration: 1.8, ease: 'easeOut' }}
      >
        <div className="absolute inset-0 z-10 bg-deep/70" /> {/* Dark overlay */}
        <div className="absolute inset-0 z-10 mix-blend-screen bg-[radial-gradient(circle_at_45%_50%,rgba(255,45,32,0.18),transparent_65%)]" /> {/* Red spotlight */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_20%,#050505_100%)]" /> {/* Vignette */}
        <img
          src="/images/hero-bg.png"
          alt="GMX Gaming Arena"
          className="h-full w-full object-cover opacity-60"
        />
      </motion.div>

      {/* LAYER 2: Main Visual (Asymmetrical Right) */}
      <motion.div 
        className="absolute bottom-0 right-0 z-10 w-[120%] max-w-[600px] origin-bottom sm:w-full md:max-w-[700px] lg:right-[5%] lg:max-w-[850px] xl:right-[10%]"
        style={{ y: playerY, scale: playerScale }}
        initial={{ opacity: 0, y: 80, scale: 1.05 }}
        animate={ready ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      >
        <div className="relative w-full" style={{ maskImage: 'linear-gradient(to top, transparent 2%, black 35%)', WebkitMaskImage: 'linear-gradient(to top, transparent 2%, black 35%)' }}>
          <img
            src="/images/hero-player.png"
            alt="Jugador Profesional de GMX"
            className="w-full object-contain object-bottom drop-shadow-[0_0_20px_rgba(255,45,32,0.2)]"
          />
        </div>
      </motion.div>

      {/* LAYER 3: Editorial Content (Asymmetrical Left) */}
      <motion.div 
        className="relative z-20 mx-auto flex w-full max-w-[1400px] flex-col px-6 pt-32 pb-40 lg:px-12"
        style={{ y: textY }}
        variants={containerVariants}
        initial="hidden"
        animate={ready ? 'visible' : 'hidden'}
      >
        
        {/* HUD: Top Left Technical Details */}
        <motion.div variants={fadeUpVariants} className="absolute left-6 top-24 hidden items-center gap-4 text-[10px] font-500 tracking-[0.3em] text-faint lg:flex xl:left-12">
          <span>{d.hero.hudEst}</span>
          <span className="h-px w-8 bg-border" />
          <span>{d.hero.hudSubtitle}</span>
        </motion.div>

        {/* HUD: Competitive Floating Panel */}
        <motion.div variants={fadeUpVariants} className="absolute right-6 top-[35%] hidden flex-col gap-3 border-l border-primary/40 pl-4 text-[10px] font-600 tracking-[0.2em] text-muted-foreground lg:flex xl:right-12">
          <span className="hover:text-white transition-colors">{d.hero.hudCompete}</span>
          <span className="hover:text-white transition-colors">{d.hero.hudGrow}</span>
          <span className="hover:text-white transition-colors">{d.hero.hudDominate}</span>
        </motion.div>

        <div className="mt-auto max-w-[700px] lg:max-w-[850px] xl:max-w-[1000px]">
          
          <motion.div variants={fadeUpVariants} className="mb-6 flex items-center gap-4 lg:mb-8">
            <span className="h-px w-10 bg-primary lg:w-16" />
            <span className="font-display text-xs font-700 uppercase tracking-[0.3em] text-primary sm:text-sm">
              {d.hero.welcomeBadge}
            </span>
          </motion.div>

          <h1 className="font-display text-[14vw] font-black uppercase leading-[0.85] tracking-tight text-white md:text-[8rem] lg:text-[9.5rem] xl:text-[11rem]">
            {/* Title Line 1 */}
            <div className="overflow-hidden pb-1">
              <motion.div variants={titleLineVariants} className="origin-left">
                {Array.from(word1).map((char, i) => (
                  <motion.span key={i} variants={titleCharVariants} className="inline-block">{char}</motion.span>
                ))}
              </motion.div>
            </div>
            
            {/* Title Line 2 */}
            <div className="overflow-hidden pb-1">
              <motion.div variants={titleLineVariants} className="origin-left ml-[2vw] lg:ml-[1vw]">
                {Array.from(word2).map((char, i) => (
                  <motion.span key={i} variants={titleCharVariants} className="inline-block">{char}</motion.span>
                ))}
              </motion.div>
            </div>
            
            {/* Title Line 3 & 4 */}
            <div className="overflow-hidden pb-4">
              <motion.div variants={titleLineVariants} className="flex flex-wrap items-center gap-[3vw] origin-left lg:gap-8">
                <span>
                  {Array.from(word3).map((char, i) => (
                    <motion.span key={i} variants={titleCharVariants} className="inline-block">{char}</motion.span>
                  ))}
                </span>
                <span className="text-primary drop-shadow-[0_0_15px_rgba(255,45,32,0.4)]">
                  {Array.from(word4).map((char, i) => (
                    <motion.span key={i} variants={titleCharVariants} className="inline-block">{char}</motion.span>
                  ))}
                </span>
              </motion.div>
            </div>
          </h1>

          <motion.h2 variants={fadeUpVariants} className="mt-8 max-w-2xl font-display text-sm font-600 uppercase tracking-[0.2em] text-white sm:text-base lg:text-xl">
            {d.hero.subtitle}
          </motion.h2>

          <motion.p variants={fadeUpVariants} className="mt-5 max-w-[480px] text-sm font-400 leading-relaxed text-muted-foreground sm:text-base lg:mt-6">
            {d.hero.description}
          </motion.p>

          <motion.div variants={fadeUpVariants} className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center lg:mt-12">
            {user ? (
              <GmxButton href="/micuenta" className="w-full sm:w-auto">
                {d.hero.goToProfile}
              </GmxButton>
            ) : (
              <GmxButton href="/crear-cuenta" className="w-full sm:w-auto">
                {d.hero.createUserBtn}
              </GmxButton>
            )}
            <GmxButton href="#torneos" variant="secondary" className="w-full sm:w-auto border-white/20 hover:border-white">
              {d.hero.exploreTournaments}
            </GmxButton>
          </motion.div>

        </div>
      </motion.div>

      {/* BOTTOM TICKER */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-0 z-30 flex w-full items-center overflow-hidden border-t border-white/10 bg-deep/80 py-3 backdrop-blur-md"
      >
        <div className="flex w-max animate-marquee-left items-center">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex shrink-0 items-center">
              {tickerItems.map((item, j) => (
                <div key={j} className="flex items-center">
                  <span className="mx-6 font-display text-xs font-600 uppercase tracking-[0.2em] text-faint hover:text-white transition-colors cursor-default">
                    {item}
                  </span>
                  <span className="text-[10px] text-primary/50">×</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ delay: 2.2, duration: 1 }}
        className="absolute bottom-24 right-6 z-30 hidden flex-col items-center gap-4 xl:right-12 lg:flex"
      >
        <span className="font-display text-[9px] font-600 uppercase tracking-[0.3em] text-faint" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
          {d.hero.scrollIndicator}
        </span>
        <span className="h-14 w-[1px] animate-pulse bg-gradient-to-b from-primary to-transparent" />
      </motion.div>

      {/* Corner Technical Borders (HUD) */}
      <div className="pointer-events-none absolute inset-6 z-20 hidden border border-white/5 lg:block xl:inset-10" />
      <div className="pointer-events-none absolute left-5 top-5 z-20 hidden h-4 w-4 border-l border-t border-primary lg:block xl:left-9 xl:top-9" />
      <div className="pointer-events-none absolute right-5 top-5 z-20 hidden h-4 w-4 border-r border-t border-primary lg:block xl:right-9 xl:top-9" />
      <div className="pointer-events-none absolute bottom-5 right-5 z-20 hidden h-4 w-4 border-b border-r border-primary lg:block xl:bottom-9 xl:right-9" />
      <div className="pointer-events-none absolute bottom-5 left-5 z-20 hidden h-4 w-4 border-b border-l border-primary lg:block xl:bottom-9 xl:left-9" />

    </section>
  )
}
