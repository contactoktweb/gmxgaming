'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { PARTNERS, PartnerSponsor } from '@/lib/site-data'

export function Partners() {
  const [sponsors, setSponsors] = useState<PartnerSponsor[]>(PARTNERS)
  const supabase = createClient()

  useEffect(() => {
    async function loadSponsors() {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('*')
          .eq('id', 'sponsors')
          .maybeSingle()

        if (data && Array.isArray(data.value) && data.value.length > 0) {
          // Validar y mapear
          const valid = data.value.map((item: any, idx: number) => ({
            id: item.id || `sponsor-${idx}`,
            name: typeof item === 'string' ? item : item.name || 'Sponsor',
            image_url: typeof item === 'string' ? '' : item.image_url || '',
            url: typeof item === 'string' ? 'https://gmxgaming.com/' : item.url || 'https://gmxgaming.com/'
          }))
          setSponsors(valid)
        }
      } catch (err) {
        console.error('Error loading sponsors in Partners section:', err)
      }
    }
    loadSponsors()
  }, [])

  const displayList = sponsors.length > 0 ? sponsors : PARTNERS
  const doubled = [...displayList, ...displayList]

  return (
    <section className="border-y border-border bg-deep py-14 overflow-hidden relative" aria-label="Nuestros Sponsors y Aliados">
      <div className="mx-auto mb-8 max-w-[1400px] px-5 lg:px-10 text-center">
        <h2 className="font-display text-[11px] font-600 uppercase tracking-[0.4em] text-faint">
          Partners · Patrocinadores · Ligas · Federaciones
        </h2>
      </div>

      <div className="relative flex overflow-hidden group">
        <div className="flex shrink-0 items-center gap-12 sm:gap-16 pr-12 sm:pr-16 animate-marquee-right group-hover:[animation-play-state:paused]">
          {doubled.map((sponsor, i) => {
            const hasImage = Boolean(sponsor.image_url)
            const redirectUrl = sponsor.url || 'https://gmxgaming.com/'

            return (
              <a
                key={`${sponsor.id || sponsor.name}-${i}`}
                href={redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`${sponsor.name} - Abrir en una nueva pestaña`}
                className="shrink-0 flex items-center justify-center transition-all duration-300 hover:scale-105 opacity-60 hover:opacity-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary rounded-lg p-2"
                data-cursor
              >
                {hasImage ? (
                  <img
                    src={sponsor.image_url}
                    alt={sponsor.name}
                    loading="lazy"
                    className="h-8 sm:h-11 w-auto max-w-[140px] sm:max-w-[180px] object-contain filter drop-shadow hover:brightness-110 transition-all duration-300"
                    onError={(e) => {
                      // Fallback a texto si la imagen falla al cargar
                      e.currentTarget.style.display = 'none'
                      const sibling = e.currentTarget.nextElementSibling as HTMLElement
                      if (sibling) sibling.style.display = 'inline-block'
                    }}
                  />
                ) : null}

                <span
                  className={hasImage ? "hidden font-display text-xl sm:text-2xl font-700 uppercase tracking-tight text-white/50 hover:text-white transition-colors duration-300" : "font-display text-xl sm:text-2xl font-700 uppercase tracking-tight text-white/50 hover:text-white transition-colors duration-300"}
                >
                  {sponsor.name}
                </span>
              </a>
            )
          })}
        </div>

        {/* Gradientes laterales para efecto fade */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-deep to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-deep to-transparent z-10" />
      </div>
    </section>
  )
}

