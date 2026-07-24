'use client'

import { useState } from 'react'
import { Preloader } from '@/components/preloader'
import { SmoothScroll } from '@/components/smooth-scroll'
import { CustomCursor } from '@/components/custom-cursor'
import { SiteHeader } from '@/components/site-header'
import { BackToTop } from '@/components/back-to-top'
import { SiteFooter } from '@/components/sections/site-footer'
import { AltaEquipoForm } from '@/components/forms/alta-equipo-form'

export default function AltaDeEquipoPage() {
  const [ready, setReady] = useState(false)

  return (
    <>
      <Preloader onDone={() => setReady(true)} />
      <SmoothScroll />
      <CustomCursor />
      <SiteHeader />
      <BackToTop />

      <main className="relative min-h-screen pt-32 pb-24">
        {/* Background glow effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-primary/10 blur-[120px]" />
        </div>

        <div className="relative z-10 px-5 lg:px-10">
          <AltaEquipoForm />
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
