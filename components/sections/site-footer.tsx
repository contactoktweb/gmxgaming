'use client'

import { Stagger, StaggerItem } from '@/components/anim'
import { GmxLogo } from '@/components/gmx-logo'
import { SOCIALS } from '@/lib/site-data'

const COLUMNS = [
  {
    title: 'NAVEGACIÓN',
    links: [
      { label: 'Inicio', href: '#hero' },
      { label: 'Registro Esports', href: '#registro' },
      { label: 'Equipos Afiliados', href: '#equipos' },
      { label: 'Torneos', href: '#torneos' },
    ],
  },
  {
    title: 'CATEGORÍAS',
    links: [
      { label: 'GMX Kings Clash', href: '#torneos' },
      { label: 'Honor of Kings', href: '#torneos' },
      { label: 'Torneos', href: '#torneos' },
    ],
  },
  {
    title: 'COMUNIDAD',
    links: [
      { label: 'Crear tu usuario', href: '#registro' },
      { label: 'Participar', href: '#registro' },
      { label: 'Contacto', href: '#' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-deep">
      <div className="mx-auto max-w-[1400px] px-5 py-16 lg:px-10 lg:py-20">
        <Stagger className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4" stagger={0.15} amount={0.1}>
          <StaggerItem className="lg:pr-8">
            <GmxLogo />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              GMX Gaming, la organización número 1 en ligas, torneos y eventos de eSports en MOBAs de
              habla hispana.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center border border-border text-xs font-600 text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-white"
                >
                  {s.short}
                </a>
              ))}
            </div>
          </StaggerItem>

          {COLUMNS.map((col) => (
            <StaggerItem key={col.title}>
              <h3 className="mb-5 font-display text-sm font-600 uppercase tracking-[0.2em] text-white">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      <span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-4" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-5 py-6 text-xs text-faint sm:flex-row lg:px-10">
          <p>Copyright © 2025 GMX Gaming. Todos los Derechos Reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="transition-colors hover:text-white">Privacidad</a>
            <a href="#" className="transition-colors hover:text-white">Términos</a>
            <a href="#" className="transition-colors hover:text-white">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
