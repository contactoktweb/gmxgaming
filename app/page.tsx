'use client'

import { useState } from 'react'
import { Preloader } from '@/components/preloader'
import { SmoothScroll } from '@/components/smooth-scroll'
import { CustomCursor } from '@/components/custom-cursor'
import { SiteHeader } from '@/components/site-header'
import { BackToTop } from '@/components/back-to-top'
import { Hero } from '@/components/sections/hero'
import { About } from '@/components/sections/about'
import { MarqueeBand } from '@/components/sections/marquee'
import { Cinematic } from '@/components/sections/cinematic'
import { Players } from '@/components/sections/players'
import { VideoExperience } from '@/components/sections/video'
import { WhatYouGet } from '@/components/sections/what-you-get'
import { Teams } from '@/components/sections/teams'
import { Tournaments } from '@/components/sections/tournaments'
import { CtaPrimary } from '@/components/sections/cta-primary'
import { Partners } from '@/components/sections/partners'
import { Newsletter } from '@/components/sections/newsletter'
import { SiteFooter } from '@/components/sections/site-footer'

export default function Page() {
  const [ready, setReady] = useState(false)

  return (
    <>
      <Preloader onDone={() => setReady(true)} />
      <SmoothScroll />
      <CustomCursor />
      <SiteHeader />
      <BackToTop />

      <main>
        <Hero ready={ready} />
        <About />
        <MarqueeBand />
        <Cinematic />
        <Players />
        <VideoExperience />
        <WhatYouGet />
        <Teams />
        <Tournaments />
        <CtaPrimary />
        <Partners />
        <Newsletter />
      </main>

      <SiteFooter />
    </>
  )
}
