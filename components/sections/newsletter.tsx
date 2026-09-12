'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SplitText } from '@/components/split-text'
import { Reveal } from '@/components/anim'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'

function NewsletterForm() {
  const [email, setEmail] = useState('')
  const router = useRouter()
  const { user } = useAuth()
  const { d } = useLanguage()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (user) {
          router.push('/micuenta')
        } else if (email) {
          router.push(`/crear-cuenta?email=${encodeURIComponent(email)}`)
        }
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        {user ? (
          <div className="flex w-full items-center border border-white/20 bg-deep/60 px-4 py-4 text-sm text-white backdrop-blur-sm">
            <span className="text-muted-foreground">{d.newsletter.activeSession}</span>
            <span className="ml-2 font-600 text-primary">{user.name || user.email}</span>
          </div>
        ) : (
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={d.newsletter.emailPlaceholder}
            aria-label={d.newsletter.emailPlaceholder}
            className="w-full border border-white/20 bg-deep/60 px-4 py-4 text-sm text-white placeholder:text-faint outline-none backdrop-blur-sm transition-colors focus:border-primary"
          />
        )}
        <button
          type="submit"
          data-cursor
          className="group relative shrink-0 overflow-hidden bg-primary px-7 py-4 font-display text-[13px] font-600 uppercase tracking-[0.18em] text-white clip-corner sm:text-sm"
        >
          <span className="absolute inset-0 origin-left scale-x-0 bg-primary-dark transition-transform duration-300 ease-out group-hover:scale-x-100" />
          <span className="relative z-10">{user ? d.newsletter.goToProfile : d.newsletter.createUser}</span>
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        {user ? d.newsletter.loggedInDesc : d.newsletter.loggedOutDesc}
      </p>
    </form>
  )
}

export function Newsletter() {
  const { d } = useLanguage()

  return (
    <section className="bg-background px-5 py-8 lg:px-10 lg:py-12">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden clip-corner">
        <div className="absolute inset-0 -z-20">
          <img src="/images/newsletter-bg.png" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-deep/80" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary-dark/40 via-deep/60 to-deep/80" />

        <span className="pointer-events-none absolute -right-4 -top-8 select-none font-display text-[16vw] font-700 uppercase leading-none text-white/[0.04]">
          GMX
        </span>

        <div className="relative flex flex-col items-start gap-10 px-6 py-10 sm:px-12 lg:flex-row lg:items-center lg:justify-between lg:py-12">
          <div className="max-w-xl">
            <SplitText
              as="h2"
              variant="title"
              lines={d.newsletter.title}
              className="font-display text-3xl font-700 uppercase leading-[1] tracking-tight text-white sm:text-4xl lg:text-5xl"
            />
          </div>

          <Reveal direction="left" className="w-full max-w-md">
            <NewsletterForm />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
