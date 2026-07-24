'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, X, LogOut, User } from 'lucide-react'
import { NAV_LINKS, SOCIALS } from '@/lib/site-data'
import { GmxLogo } from '@/components/gmx-logo'
import { GmxButton } from '@/components/gmx-button'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()

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
              <div key={link.href} className="group relative">
                <a
                  href={link.href}
                  className="relative flex items-center gap-1 font-display text-[13px] font-500 uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-white"
                >
                  {link.label}
                  {link.submenu && (
                    <svg className="h-3 w-3 transition-transform duration-300 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
                
                {link.submenu && (
                  <div className="absolute left-0 top-full pt-4 opacity-0 invisible translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
                    <div className="flex min-w-[240px] flex-col overflow-hidden border border-border bg-surface shadow-xl">
                      {link.submenu.map((sub) => (
                        <a
                          key={sub.label}
                          href={sub.href}
                          className="px-5 py-4 font-display text-[13px] font-500 uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:bg-elevated hover:text-primary"
                        >
                          {sub.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <>
                  <GmxButton href="/micuenta" variant="secondary" className="px-5 py-3 border-white/20 hover:border-white gap-2">
                    <User className="w-4 h-4" />
                    MI CUENTA
                  </GmxButton>
                  <button
                    onClick={logout}
                    className="group relative inline-flex items-center justify-center gap-2 overflow-hidden bg-primary/10 border border-primary/20 px-5 py-3 font-display text-[13px] font-600 uppercase tracking-[0.14em] text-primary transition-colors duration-300 clip-corner hover:bg-primary hover:text-white"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      SALIR
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <GmxButton href="/login" variant="secondary" className="px-5 py-3 border-white/20 hover:border-white">
                    INGRESAR
                  </GmxButton>
                  <GmxButton href="/registro/alta-de-jugador" className="px-5 py-3">
                    CREA TU USUARIO
                  </GmxButton>
                </>
              )}
            </div>
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
              className="flex lg:hidden h-11 w-11 items-center justify-center border border-border bg-elevated text-white transition-colors hover:border-primary hover:text-primary clip-corner"
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
                  <div key={link.href}>
                    <motion.a
                      href={link.href}
                      onClick={() => !link.submenu && setOpen(false)}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                      className="group flex items-center justify-between border-b border-border py-4 font-display text-2xl font-600 uppercase tracking-tight text-white transition-colors hover:text-primary"
                    >
                      {link.label}
                      <span className="text-faint transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary">
                        {link.submenu ? '+' : '→'}
                      </span>
                    </motion.a>
                    {link.submenu && (
                      <div className="flex flex-col pl-4">
                        {link.submenu.map((sub, j) => (
                          <motion.a
                            key={sub.label}
                            href={sub.href}
                            onClick={() => setOpen(false)}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.08 + j * 0.05, duration: 0.4 }}
                            className="flex items-center justify-between border-b border-border/50 py-3 font-display text-lg font-500 uppercase tracking-tight text-muted-foreground transition-colors hover:text-primary"
                          >
                            {sub.label}
                          </motion.a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="mt-10 flex flex-col gap-3">
                {user ? (
                  <>
                    <GmxButton href="/micuenta" variant="secondary" className="w-full border-white/20 hover:border-white" onClick={() => setOpen(false)}>
                      MI CUENTA
                    </GmxButton>
                    <button
                      onClick={() => {
                        logout()
                        setOpen(false)
                      }}
                      className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden bg-primary/10 border border-primary/20 px-8 py-4 font-display text-[15px] font-600 uppercase tracking-[0.18em] text-primary transition-colors duration-300 clip-corner hover:bg-primary hover:text-white"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        SALIR
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <GmxButton href="/login" variant="secondary" className="w-full border-white/20 hover:border-white" onClick={() => setOpen(false)}>
                      INGRESAR
                    </GmxButton>
                    <GmxButton href="/registro/alta-de-jugador" className="w-full" onClick={() => setOpen(false)}>
                      CREA TU USUARIO
                    </GmxButton>
                  </>
                )}
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
