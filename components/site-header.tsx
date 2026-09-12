'use client'

import { useEffect, useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, X, LogOut, User, Globe, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { SOCIALS } from '@/lib/site-data'
import { GmxLogo } from '@/components/gmx-logo'
import { GmxButton } from '@/components/gmx-button'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'
import { GlobalSearch } from '@/components/global-search'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { lang, setLanguage, toggleLang, d } = useLanguage()
  const { user, logout } = useAuth()

  const navLinks = useMemo(() => [
    { label: d.nav.home, href: '/#hero' },
    { 
      label: d.nav.esportsRegistration, 
      href: '#registro',
      submenu: [
        { label: d.nav.registerTeam, href: '/registro/alta-de-equipo' },
        { label: d.nav.registerPlayer, href: '/registro/alta-de-jugador' },
        { label: d.nav.registerContract, href: '/registro/alta-de-contrato' }
      ]
    },
    { label: d.nav.affiliatedTeams, href: '/equipos' },
    { label: d.nav.tournaments, href: '/torneos' },
  ], [d])

  const handleLogout = () => {
    logout()
    setShowLogoutModal(false)
    setOpen(false)
  }

  const isApprovedPlayer = Boolean(
    user?.is_player && (user?.player_status === 'active' || user?.player_status === 'approved')
  )

  const handleRestrictedClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!user && href.includes('/registro')) {
      e.preventDefault()
      toast.error(d.header.restrictedAccess, {
        description: d.header.restrictedLoginDesc,
        action: {
          label: d.header.login,
          onClick: () => window.location.href = '/login'
        }
      })
      return
    }

    if (href === '/registro/alta-de-contrato' && !isApprovedPlayer) {
      e.preventDefault()
      toast.error(d.header.restrictedAccess, {
        description: d.header.restrictedPlayerDesc,
        action: {
          label: d.header.viewMyAccount,
          onClick: () => window.location.href = '/micuenta'
        }
      })
      return
    }
  }

  const getFilteredSubmenu = (submenu?: { label: string; href: string }[]) => {
    if (!submenu) return undefined;
    return submenu.filter(sub => {
      // Alta de Contrato SOLO para jugadores aprobados
      if (sub.href === '/registro/alta-de-contrato') {
        return isApprovedPlayer;
      }
      return true;
    });
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open || showLogoutModal ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open, showLogoutModal])

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
          <GmxLogo className="shrink-0" />

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => {
              const filteredSubmenu = getFilteredSubmenu(link.submenu);
              
              return (
              <div key={link.href} className="group relative">
                <a
                  href={link.href}
                  onClick={(e) => handleRestrictedClick(e, link.href)}
                  className="relative flex items-center gap-1 font-display text-[13px] font-500 uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-white whitespace-nowrap"
                >
                  {link.label}
                  {filteredSubmenu && filteredSubmenu.length > 0 && (
                    <svg className="h-3 w-3 transition-transform duration-300 group-hover:rotate-180 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
                
                {filteredSubmenu && filteredSubmenu.length > 0 && (
                  <div className="absolute left-0 top-full pt-4 opacity-0 invisible translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
                    <div className="flex min-w-[240px] flex-col overflow-hidden border border-border bg-surface shadow-xl">
                      {filteredSubmenu.map((sub) => (
                        <a
                          key={sub.label}
                          href={sub.href}
                          onClick={(e) => handleRestrictedClick(e, sub.href)}
                          className="px-5 py-4 font-display text-[13px] font-500 uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:bg-elevated hover:text-primary"
                        >
                          {sub.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )})}
          </nav>

          <div className="flex items-center gap-3">
            <GlobalSearch />
            
            {/* Language Selector */}
            <div className="hidden lg:flex items-center gap-1.5 px-2 border-l border-border/50 ml-1 h-8">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <div className="inline-flex rounded-full border border-white/15 bg-white/5 p-0.5 text-[10px] font-700 tracking-wider">
                <button
                  type="button"
                  onClick={() => setLanguage('es')}
                  title="Español"
                  aria-label="Español"
                  className={cn(
                    "px-2 py-0.5 rounded-full transition-all cursor-pointer",
                    lang === 'es' ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-white"
                  )}
                >
                  ES
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  title="English"
                  aria-label="English"
                  className={cn(
                    "px-2 py-0.5 rounded-full transition-all cursor-pointer",
                    lang === 'en' ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-white"
                  )}
                >
                  EN
                </button>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <>
                  {user.isAdmin ? (
                    <GmxButton href="/administracion" variant="secondary" className="px-5 py-3 border-white/20 hover:border-white gap-2 whitespace-nowrap bg-primary/20 text-white">
                      {d.header.administration}
                    </GmxButton>
                  ) : (
                    <GmxButton href="/micuenta" variant="secondary" className="px-5 py-3 border-white/20 hover:border-white gap-2 whitespace-nowrap">
                      <User className="w-4 h-4 shrink-0" />
                      {d.header.myAccount}
                    </GmxButton>
                  )}
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="group relative inline-flex items-center justify-center gap-2 overflow-hidden bg-primary/10 border border-primary/20 px-5 py-3 font-display text-[13px] font-600 uppercase tracking-[0.14em] text-primary transition-colors duration-300 clip-corner hover:bg-primary hover:text-white whitespace-nowrap cursor-pointer"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <LogOut className="w-4 h-4 shrink-0" />
                      {d.header.logout}
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <GmxButton href="/login" variant="secondary" className="px-5 py-3 border-white/20 hover:border-white whitespace-nowrap">
                    {d.header.login}
                  </GmxButton>
                  <GmxButton 
                    href="/crear-cuenta" 
                    className="px-5 py-3 whitespace-nowrap"
                  >
                    {d.header.createUser}
                  </GmxButton>
                </>
              )}
            </div>
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
              className="flex lg:hidden h-11 w-11 items-center justify-center border border-border bg-elevated text-white transition-colors hover:border-primary hover:text-primary clip-corner cursor-pointer"
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
                  className="flex h-11 w-11 items-center justify-center border border-border text-white transition-colors hover:border-primary hover:text-primary clip-corner cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-8 flex items-center justify-between border-y border-border py-4">
                <span className="text-sm font-500 text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> {d.header.languageLabel}
                </span>
                <div className="inline-flex rounded-full border border-white/15 bg-white/5 p-1 text-xs font-700 tracking-wider">
                  <button
                    type="button"
                    onClick={() => setLanguage('es')}
                    className={cn(
                      "px-3 py-1 rounded-full transition-all cursor-pointer",
                      lang === 'es' ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-white"
                    )}
                  >
                    ES
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={cn(
                      "px-3 py-1 rounded-full transition-all cursor-pointer",
                      lang === 'en' ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-white"
                    )}
                  >
                    EN
                  </button>
                </div>
              </div>

              <nav className="mt-8 flex flex-col">
                {navLinks.map((link, i) => {
                  const filteredSubmenu = getFilteredSubmenu(link.submenu);
                  return (
                  <div key={link.href}>
                    <motion.a
                      href={link.href}
                      onClick={(e) => {
                        handleRestrictedClick(e, link.href)
                        if (!e.defaultPrevented && (!filteredSubmenu || filteredSubmenu.length === 0)) setOpen(false)
                      }}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                      className="group flex items-center justify-between border-b border-border py-4 font-display text-2xl font-600 uppercase tracking-tight text-white transition-colors hover:text-primary"
                    >
                      {link.label}
                      <span className="text-faint transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary">
                        {filteredSubmenu && filteredSubmenu.length > 0 ? '+' : '→'}
                      </span>
                    </motion.a>
                    {filteredSubmenu && filteredSubmenu.length > 0 && (
                      <div className="flex flex-col pl-4">
                        {filteredSubmenu.map((sub, j) => (
                          <motion.a
                            key={sub.label}
                            href={sub.href}
                            onClick={(e) => {
                              handleRestrictedClick(e, sub.href)
                              if (!e.defaultPrevented) setOpen(false)
                            }}
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
                )})}
              </nav>

              <div className="mt-10 flex flex-col gap-3">
                {user ? (
                  <>
                    {user.isAdmin ? (
                      <GmxButton href="/administracion" variant="secondary" className="w-full border-white/20 hover:border-white bg-primary/20 text-white" onClick={() => setOpen(false)}>
                        {d.header.administration}
                      </GmxButton>
                    ) : (
                      <GmxButton href="/micuenta" variant="secondary" className="w-full border-white/20 hover:border-white" onClick={() => setOpen(false)}>
                        {d.header.myAccount}
                      </GmxButton>
                    )}
                    <button
                      onClick={() => setShowLogoutModal(true)}
                      className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden bg-primary/10 border border-primary/20 px-8 py-4 font-display text-[15px] font-600 uppercase tracking-[0.18em] text-primary transition-colors duration-300 clip-corner hover:bg-primary hover:text-white cursor-pointer"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {d.header.logout}
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <GmxButton href="/login" variant="secondary" className="w-full border-white/20 hover:border-white" onClick={() => setOpen(false)}>
                      {d.header.login}
                    </GmxButton>
                    <GmxButton 
                      href="/crear-cuenta" 
                      className="w-full" 
                      onClick={() => setOpen(false)}
                    >
                      {d.header.createUser}
                    </GmxButton>
                  </>
                )}
              </div>

              <div className="mt-auto pt-10">
                <p className="mb-3 text-[11px] font-500 uppercase tracking-[0.3em] text-faint">
                  {d.header.followUs}
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

      {/* Custom Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowLogoutModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-2xl text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-2">
                {d.header.logoutModalTitle}
              </h3>
              <p className="text-sm text-muted-foreground mb-8">
                {d.header.logoutModalDesc}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 rounded-md border border-border bg-transparent px-4 py-3 text-sm font-600 text-muted-foreground hover:text-white transition-colors uppercase tracking-widest cursor-pointer"
                >
                  {d.header.cancel}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 rounded-md bg-primary px-4 py-3 text-sm font-600 text-white hover:bg-primary-dark transition-colors uppercase tracking-widest cursor-pointer"
                >
                  {d.header.confirmLogout}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
