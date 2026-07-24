'use client'

import { useState } from 'react'
import { Preloader } from '@/components/preloader'
import { SmoothScroll } from '@/components/smooth-scroll'
import { CustomCursor } from '@/components/custom-cursor'
import { SiteHeader } from '@/components/site-header'
import { BackToTop } from '@/components/back-to-top'
import { SiteFooter } from '@/components/sections/site-footer'
import { GmxButton } from '@/components/gmx-button'
import { Reveal } from '@/components/anim'

export default function NotFound() {
  const [ready, setReady] = useState(false)

  return (
    <>
      <Preloader onDone={() => setReady(true)} />
      <SmoothScroll />
      <CustomCursor />
      <SiteHeader />
      <BackToTop />

      <main className="relative flex min-h-[90vh] flex-col items-center justify-center pt-32 pb-24 text-center px-5 lg:px-10">
        {/* Background glow effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-primary/10 blur-[120px]" />
        </div>

        <Reveal direction="up" className="relative z-10 w-full max-w-2xl mt-12">
          <div className="relative mb-8">
            <h1 className="font-display text-[150px] sm:text-[200px] font-700 uppercase leading-none tracking-tight text-white/5 select-none">
              404
            </h1>
            <span className="absolute inset-0 flex items-center justify-center font-display text-5xl sm:text-6xl font-700 uppercase tracking-tight text-white mix-blend-overlay">
              GAME OVER
            </span>
          </div>
          
          <h2 className="mt-8 font-display text-2xl sm:text-3xl font-700 uppercase text-primary tracking-widest">
            ¡Página no encontrada!
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
            Parece que te has salido del mapa. La ruta que estás buscando no existe en nuestro servidor o ha sido eliminada.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <GmxButton href="/" className="px-8 py-4 w-full sm:w-auto">
              VOLVER A LA BASE
            </GmxButton>
            <GmxButton href="/torneos" variant="secondary" className="px-8 py-4 w-full sm:w-auto border-white/20 hover:border-white">
              VER TORNEOS
            </GmxButton>
          </div>
        </Reveal>
      </main>

      <SiteFooter />
    </>
  )
}
