'use client'

import { useState } from 'react'
import { Preloader } from '@/components/preloader'
import { SmoothScroll } from '@/components/smooth-scroll'
import { CustomCursor } from '@/components/custom-cursor'
import { SiteHeader } from '@/components/site-header'
import { BackToTop } from '@/components/back-to-top'
import { SiteFooter } from '@/components/sections/site-footer'
import { SplitText } from '@/components/split-text'
import { Reveal } from '@/components/anim'
import { ArrowUpRight } from 'lucide-react'

const TORNEOS_MEXICO = [
  {
    title: 'Torneos Profesionales - Varonil/Mixto',
    description: 'El GMX Lightborn es la Liga Nacional Profesional Oficial en México, avalada por la Federación Nacional de Deportes Electrónicos de México.',
    leagues: [
      {
        logo: 'https://i0.wp.com/gmxgaming.com/wp-content/uploads/2025/07/Lightborn-Tournament-2025-Logo-128x128.png?resize=128%2C128&ssl=1',
        links: [
          { label: 'GMX Lightborn Tournament 2025', url: 'https://liquipedia.net/mobilelegends/GMX_Lightborn_Tournament/2025' },
          { label: 'GMX Lightborn Tournament 2024', url: 'https://liquipedia.net/mobilelegends/GMX_Lightborn_Tournament/2024' },
          { label: 'GMX Lightborn Tournament 2023', url: 'https://liquipedia.net/mobilelegends/GMX_Lightborn_Tournament/2023' },
          { label: 'GMX Lightborn Tournament 2022', url: 'https://liquipedia.net/mobilelegends/GMX_Lightborn_Tournament/2022' },
        ]
      }
    ]
  },
  {
    title: 'Torneos Amateur - Varonil/Mixto',
    description: 'El GMX Showdown es un evento mensual en México organizado por GMX Gaming.',
    leagues: [
      {
        logo: 'https://i0.wp.com/gmxgaming.com/wp-content/uploads/2025/01/GMX-Showdown-128x128.png?resize=128%2C128&ssl=1',
        links: [
          { label: 'GMX Showdown - Junio 2025', url: 'https://liquipedia.net/mobilelegends/GMX_Showdown/2025/June' },
          { label: 'GMX Showdown - Mayo 2025', url: 'https://liquipedia.net/mobilelegends/GMX_Showdown/2025/May' },
          { label: 'GMX Showdown - Abril 2025', url: 'https://liquipedia.net/mobilelegends/GMX_Showdown/2025/April' },
          { label: 'GMX Showdown - Marzo 2025', url: 'https://liquipedia.net/mobilelegends/GMX_Showdown/2025/March' },
          { label: 'GMX Showdown - Febrero 2025', url: 'https://liquipedia.net/mobilelegends/GMX_Showdown/2025/February' },
          { label: 'GMX Showdown - Enero 2025', url: 'https://liquipedia.net/mobilelegends/GMX_Showdown/2025/January' },
        ]
      },
      {
        description: 'La Liga Monou-GMX es una liga nacional amateur-profesional en México, avalada por Monou.gg.',
        logo: 'https://i0.wp.com/gmxgaming.com/wp-content/uploads/2025/01/Logo-Liga-Monou-GMX-128x128.png?resize=128%2C128&ssl=1',
        links: [
          { label: 'Liga Monou-GMX 2', url: 'https://liquipedia.net/mobilelegends/GMX_Liga_Monou/2' },
          { label: 'Liga Monou-GMX 1', url: 'https://liquipedia.net/mobilelegends/GMX_Liga_Monou/1' },
        ]
      }
    ]
  },
  {
    title: 'Torneos Amateur - Femenil',
    description: 'El GMX Immortal Queens es un evento mensual exclusivo para mujeres en México, organizado por GMX Gaming.',
    leagues: [
      {
        logo: 'https://i0.wp.com/gmxgaming.com/wp-content/uploads/2025/07/Immortal-Queens-Logo-128x128.png?resize=128%2C128&ssl=1',
        links: [
          { label: 'GMX Immortal Queens - Junio 2025', url: 'https://liquipedia.net/mobilelegends/GMX_Immortal_Queens/2025/June' },
        ]
      }
    ]
  }
]

const TORNEOS_COLOMBIA = [
  {
    title: 'Torneos Amateur - Varonil/Mixto',
    description: 'El GMX Showdown es un evento mensual en Colombia organizado por GMX Gaming.',
    leagues: [
      {
        logo: 'https://i0.wp.com/gmxgaming.com/wp-content/uploads/2025/07/GMX-Legends-128x128.png?resize=128%2C128&ssl=1',
        links: [
          { label: 'GMX Legends - Marzo 2025', url: 'https://liquipedia.net/mobilelegends/GMX_Legends/2025/March' },
          { label: 'GMX Legends - Febrero 2025', url: 'https://liquipedia.net/mobilelegends/GMX_Legends/2025/February' },
        ]
      }
    ]
  }
]

export default function TorneosPage() {
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

        <div className="relative z-10 px-5 lg:px-10 max-w-[1200px] mx-auto">
          <div className="text-center mb-20">
            <Reveal direction="up">
              <h1 className="font-display text-4xl font-700 uppercase tracking-tight text-white sm:text-5xl lg:text-6xl mb-4">
                Torneos, Ligas y Eventos
              </h1>
              <p className="text-lg text-muted-foreground">
                Descubre las competencias oficiales de GMX Gaming.
              </p>
            </Reveal>
          </div>

          {/* MEXICO */}
          <div className="mb-24">
            <Reveal direction="fade" className="flex items-center justify-center gap-4 mb-12">
              <img src="https://i0.wp.com/gmxgaming.com/wp-content/uploads/2024/07/Bandera-Mexico.png?fit=50%2C32&ssl=1" alt="México" className="h-8 w-auto rounded shadow-sm" />
              <h2 className="font-display text-3xl font-700 uppercase text-white tracking-widest">México</h2>
              <img src="https://i0.wp.com/gmxgaming.com/wp-content/uploads/2024/07/Bandera-Mexico.png?fit=50%2C32&ssl=1" alt="México" className="h-8 w-auto rounded shadow-sm" />
            </Reveal>

            <div className="space-y-16">
              {TORNEOS_MEXICO.map((seccion, index) => (
                <div key={index} className="rounded-xl border border-border bg-surface p-8 shadow-2xl">
                  <h3 className="font-display text-2xl font-600 uppercase text-primary mb-4">{seccion.title}</h3>
                  <p className="text-muted-foreground mb-8 text-sm leading-relaxed max-w-2xl">{seccion.description}</p>
                  
                  <div className="grid gap-10 md:grid-cols-2">
                    {seccion.leagues.map((league, lIndex) => (
                      <div key={lIndex} className="flex flex-col sm:flex-row gap-6">
                        <div className="shrink-0 flex justify-center sm:justify-start">
                          <img src={league.logo} alt="Logo" className="w-32 h-32 object-contain" />
                        </div>
                        <div className="flex-1">
                          {league.description && (
                            <p className="text-muted-foreground text-sm mb-4">{league.description}</p>
                          )}
                          <ul className="space-y-3">
                            {league.links.map((link, linkIndex) => (
                              <li key={linkIndex}>
                                <a 
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="group inline-flex items-center gap-2 font-display text-sm font-500 uppercase tracking-wider text-white transition-colors hover:text-primary"
                                >
                                  {link.label}
                                  <ArrowUpRight className="size-4 opacity-50 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COLOMBIA */}
          <div>
            <Reveal direction="fade" className="flex items-center justify-center gap-4 mb-12">
              <img src="https://i0.wp.com/gmxgaming.com/wp-content/uploads/2024/07/Bandera-Colombia.png?fit=50%2C32&ssl=1" alt="Colombia" className="h-8 w-auto rounded shadow-sm" />
              <h2 className="font-display text-3xl font-700 uppercase text-white tracking-widest">Colombia</h2>
              <img src="https://i0.wp.com/gmxgaming.com/wp-content/uploads/2024/07/Bandera-Colombia.png?fit=50%2C32&ssl=1" alt="Colombia" className="h-8 w-auto rounded shadow-sm" />
            </Reveal>

            <div className="space-y-16">
              {TORNEOS_COLOMBIA.map((seccion, index) => (
                <div key={index} className="rounded-xl border border-border bg-surface p-8 shadow-2xl">
                  <h3 className="font-display text-2xl font-600 uppercase text-primary mb-4">{seccion.title}</h3>
                  <p className="text-muted-foreground mb-8 text-sm leading-relaxed max-w-2xl">{seccion.description}</p>
                  
                  <div className="grid gap-10 md:grid-cols-2">
                    {seccion.leagues.map((league, lIndex) => (
                      <div key={lIndex} className="flex flex-col sm:flex-row gap-6">
                        <div className="shrink-0 flex justify-center sm:justify-start">
                          <img src={league.logo} alt="Logo" className="w-32 h-32 object-contain" />
                        </div>
                        <div className="flex-1">
                          <ul className="space-y-3">
                            {league.links.map((link, linkIndex) => (
                              <li key={linkIndex}>
                                <a 
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="group inline-flex items-center gap-2 font-display text-sm font-500 uppercase tracking-wider text-white transition-colors hover:text-primary"
                                >
                                  {link.label}
                                  <ArrowUpRight className="size-4 opacity-50 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
