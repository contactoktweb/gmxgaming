'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { NAV_LINKS, SOCIALS } from '@/lib/site-data'
import { GmxLogo } from '@/components/gmx-logo'
import { GmxButton } from '@/components/gmx-button'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        className={cn(
          'fixed inset-x-0 top-0 z-[900] transition-all duration-300',
          scrolled
            ? 'border-b border-border bg-deep/85 py-3 backdrop-blur-md'
            : 'border-b border-transparent bg-transparent py-5',
        )}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-5 lg:px-10">
          <GmxLogo />

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative font-display text-[13px] font-500 uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-white"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <GmxButton href="#registro" className="px-5 py-3">
                CREA TU USUARIO
              </GmxButton>
            </div>
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
              className="flex h-11 w-11 items-center justify-center border border-border bg-elevated text-white transition-colors hover:border-primary hover:text-primary clip-corner"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Offcanvas menu */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[1000]">
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col overflow-y-auto border-l border-border bg-surface px-8 py-8"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            >
              <div className="flex items-center justify-between">
                <GmxLogo />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar menú"
                  className="flex h-11 w-11 items-center justify-center border border-border text-white transition-colors hover:border-primary hover:text-primary clip-corner"
                >
                  <X className="size-5" />
                </button>
              </div>

              <p className="mt-8 max-w-xs text-sm leading-relaxed text-muted-foreground">
                La organización número 1 en ligas, torneos y eventos de eSports en MOBAs de habla
                hispana.
              </p>

              <nav className="mt-10 flex flex-col">
                {NAV_LINKS.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                    className="group flex items-center justify-between border-b border-border py-4 font-display text-2xl font-600 uppercase tracking-tight text-white transition-colors hover:text-primary"
                  >
                    {link.label}
                    <span className="text-faint transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary">
                      →
                    </span>
                  </motion.a>
                ))}
              </nav>

              <div className="mt-10">
                <GmxButton href="#registro" className="w-full" onClick={() => setOpen(false)}>
                  CREA TU USUARIO
                </GmxButton>
              </div>

              <div className="mt-auto pt-10">
                <p className="mb-3 text-[11px] font-500 uppercase tracking-[0.3em] text-faint">
                  Síguenos
                </p>
                <div className="flex flex-wrap gap-2">
                  {SOCIALS.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      className="flex h-10 w-10 items-center justify-center border border-border text-xs font-600 text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-white"
                    >
                      {s.short}
                    </a>
                  ))}
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
