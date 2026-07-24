'use client'

import { useState } from 'react'
import { ForgotPasswordForm } from '@/components/forms/forgot-password-form'
import { Preloader } from '@/components/preloader'
import { SmoothScroll } from '@/components/smooth-scroll'
import { CustomCursor } from '@/components/custom-cursor'
import { SiteHeader } from '@/components/site-header'
import { BackToTop } from '@/components/back-to-top'
import { SiteFooter } from '@/components/sections/site-footer'

export default function OlvidePasswordPage() {
  const [ready, setReady] = useState(false)

  return (
    <>
      <Preloader onDone={() => setReady(true)} />
      <SmoothScroll />
      <CustomCursor />
      <SiteHeader />
      <BackToTop />
      
      <main className="min-h-screen bg-deep py-32 sm:py-40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <ForgotPasswordForm />
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
