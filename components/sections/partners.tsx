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
          const valid = data.value.map((item: any, idx: number) => ({
            id: item.id || `sponsor-${idx}`,
            name: typeof item === 'string' ? item : item.name || 'Sponsor',
            image_url: typeof item === 'string' ? '' : (item.image_url || '').trim(),
            url: typeof item === 'string' ? 'https://gmxgaming.com/' : item.url || 'https://gmxgaming.com/'
          }))
          setSponsors(valid)
        }
      } catch (err) {
        console.error('Error loading sponsors in Partners section:', err)
      }
    }
    loadSponsors()

    // Suscripción en tiempo real para reflejar cambios y nuevos logos al instante
    const channel = supabase
      .channel('public:app_settings:sponsors')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings', filter: 'id=eq.sponsors' }, () => {
        loadSponsors()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const baseList = sponsors.length > 0 ? sponsors : PARTNERS

  // Aseguramos que la pista tenga suficientes elementos para sobrepasar cualquier resolución de pantalla (mínimo 10 items)
  let trackItems = [...baseList]
  while (trackItems.length < 10) {
    trackItems = [...trackItems, ...baseList]
  }

  return (
    <section className="border-y border-border bg-deep py-14 overflow-hidden relative" aria-label="Nuestros Sponsors y Aliados">
      <div className="mx-auto mb-8 max-w-[1400px] px-5 lg:px-10 text-center">
        <h2 className="font-display text-[11px] font-600 uppercase tracking-[0.4em] text-faint">
          Partners · Patrocinadores · Ligas · Federaciones
        </h2>
      </div>

      <div className="relative flex overflow-hidden group w-full">
        {/* Contenedor infinito que se desplaza exactamente el 50% de su ancho total */}
        <div className="flex w-max animate-marquee-left group-hover:[animation-play-state:paused] [animation-duration:35s]">
          {/* Pista 1 */}
          <div className="flex shrink-0 items-center gap-12 sm:gap-16 pr-12 sm:pr-16">
            {trackItems.map((sponsor, i) => (
              <SponsorItem key={`track1-${sponsor.id || sponsor.name}-${i}`} sponsor={sponsor} />
            ))}
          </div>

          {/* Pista 2 (clon idéntico que toma el relevo sin saltos ni cortes) */}
          <div className="flex shrink-0 items-center gap-12 sm:gap-16 pr-12 sm:pr-16" aria-hidden="true">
            {trackItems.map((sponsor, i) => (
              <SponsorItem key={`track2-${sponsor.id || sponsor.name}-${i}`} sponsor={sponsor} />
            ))}
          </div>
        </div>

        {/* Gradientes laterales para efecto fade suave */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-deep to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-deep to-transparent z-10" />
      </div>
    </section>
  )
}

function SponsorItem({ sponsor }: { sponsor: PartnerSponsor }) {
  const [imageFailed, setImageFailed] = useState(false)
  const rawUrl = sponsor.image_url?.trim()
  const hasImage = Boolean(rawUrl && rawUrl !== 'null' && rawUrl !== 'undefined' && !imageFailed)
  const redirectUrl = sponsor.url || 'https://gmxgaming.com/'

  return (
    <a
      href={redirectUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`${sponsor.name} - Abrir en una nueva pestaña`}
      className="shrink-0 flex items-center justify-center transition-all duration-300 hover:scale-105 opacity-80 hover:opacity-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary rounded-lg p-2"
      data-cursor
    >
      {hasImage ? (
        <img
          src={rawUrl}
          alt={sponsor.name}
          loading="lazy"
          className="h-9 sm:h-12 w-auto max-w-[140px] sm:max-w-[180px] object-contain drop-shadow hover:brightness-110 transition-all duration-300"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="font-display text-xl sm:text-2xl font-700 uppercase tracking-tight text-white/60 hover:text-white transition-colors duration-300 whitespace-nowrap">
          {sponsor.name}
        </span>
      )}
    </a>
  )
}

