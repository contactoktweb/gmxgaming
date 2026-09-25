'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { Camera, Tv, Mic, Loader2, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { SplitText } from '@/components/split-text'
import { Reveal, Stagger, StaggerItem } from '@/components/anim'
import { createClient } from '@/utils/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { cn } from '@/lib/utils'

type Caster = {
  id: string
  name: string
  nickname: string
  photo_url: string
  social_twitch?: string
  social_ig?: string
  social_x?: string
  social_fb?: string
  social_tiktok?: string
  social_kick?: string
  social_yt?: string
  twitch_url?: string
  instagram_url?: string
  twitter_url?: string
}

interface CasterSocialItem {
  key: keyof Caster
  altKey?: keyof Caster
  title: string
  hoverClass: string
  icon: React.ReactNode
}

const CASTER_SOCIALS: CasterSocialItem[] = [
  {
    key: 'social_twitch',
    altKey: 'twitch_url',
    title: 'Twitch',
    hoverClass: 'hover:text-purple-500 hover:border-purple-500/50',
    icon: <Tv className="w-4 h-4" />,
  },
  {
    key: 'social_ig',
    altKey: 'instagram_url',
    title: 'Instagram',
    hoverClass: 'hover:text-pink-500 hover:border-pink-500/50',
    icon: <Camera className="w-4 h-4" />,
  },
  {
    key: 'social_x',
    altKey: 'twitter_url',
    title: 'Twitter / X',
    hoverClass: 'hover:text-white hover:border-white/50',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    key: 'social_fb',
    title: 'Facebook',
    hoverClass: 'hover:text-blue-500 hover:border-blue-500/50',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    key: 'social_tiktok',
    title: 'TikTok',
    hoverClass: 'hover:text-cyan-400 hover:border-cyan-400/50',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
      </svg>
    ),
  },
  {
    key: 'social_kick',
    title: 'Kick',
    hoverClass: 'hover:text-[#53FC18] hover:border-[#53FC18]/50',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 3h5v5.5l4-5.5h6l-6.5 8 7 10h-6L9 14.5V21H4V3z"/>
      </svg>
    ),
  },
  {
    key: 'social_yt',
    title: 'YouTube',
    hoverClass: 'hover:text-red-500 hover:border-red-500/50',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
]

export function Casters() {
  const ref = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { d } = useLanguage()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [40, -40])
  const [casters, setCasters] = useState<Caster[]>([])
  const [loading, setLoading] = useState(true)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 10)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10)
    }
  }, [])

  useEffect(() => {
    async function loadCasters() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('casters')
          .select('*')
          .order('created_at', { ascending: true })

        // Sincronizar con respaldo de redes sociales si la BD aún no tiene columnas nativas
        const { data: settingsData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('id', 'casters_socials_fallback')
          .maybeSingle()

        const fallbackMap = (settingsData?.value as Record<string, any>) || {}
        
        if (data && data.length > 0) {
          setCasters(data.map(c => {
            const extra = fallbackMap[c.id] || {}
            return {
              ...c,
              nickname: c.nickname || c.name,
              social_twitch: c.social_twitch || c.twitch_url || extra.social_twitch,
              social_ig: c.social_ig || c.instagram_url || extra.social_ig,
              social_x: c.social_x || c.twitter_url || extra.social_x,
              social_fb: c.social_fb || extra.social_fb,
              social_tiktok: c.social_tiktok || extra.social_tiktok,
              social_kick: c.social_kick || extra.social_kick,
              social_yt: c.social_yt || extra.social_yt,
            }
          }))
        } else {
          setCasters([])
        }
      } catch (err) {
        console.error('Error al cargar casters:', err)
      } finally {
        setLoading(false)
      }
    }
    loadCasters()
  }, [])

  useEffect(() => {
    if (casters.length > 4) {
      checkScroll()
      const el = scrollContainerRef.current
      if (el) {
        el.addEventListener('scroll', checkScroll, { passive: true })
        window.addEventListener('resize', checkScroll)
        return () => {
          el.removeEventListener('scroll', checkScroll)
          window.removeEventListener('resize', checkScroll)
        }
      }
    }
  }, [casters, checkScroll])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const card = scrollContainerRef.current.querySelector<HTMLElement>('[data-caster-card]')
      const scrollAmount = card ? card.offsetWidth + 24 : 340
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (!loading && casters.length === 0) return <section ref={ref} className="hidden" />

  const renderCasterCard = (caster: Caster, useParallax: boolean) => {
    const photo = caster.photo_url || (caster as any).avatar_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'

    const cardInner = (
      <div className="group relative h-full w-full overflow-hidden bg-surface clip-corner aspect-[3/4] border border-border/80 hover:border-primary/50 transition-colors shadow-lg">
        <img
          src={photo}
          alt={caster.nickname || caster.name}
          className="h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-100"
          loading="lazy"
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-deep/95 via-deep/45 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col items-center text-center">
          <div className="mb-3 rounded-full bg-primary/20 p-2.5 backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-1 shadow-md">
            <Mic className="h-5 w-5 text-primary" />
          </div>
          
          <h3 className="font-display text-xl sm:text-2xl font-700 uppercase tracking-tight text-white drop-shadow-sm line-clamp-1">
            {caster.nickname || caster.name}
          </h3>
          {caster.nickname && caster.nickname !== caster.name && (
            <p className="mt-0.5 text-xs sm:text-sm font-500 text-muted-foreground line-clamp-1">
              {caster.name}
            </p>
          )}
          
          {/* Socials - Reveal on hover on desktop, directly visible on mobile */}
          <div className="mt-3 flex justify-center overflow-hidden w-full px-1">
            <div className="flex flex-wrap justify-center gap-1.5 transition-all duration-300 sm:translate-y-8 sm:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 max-sm:translate-y-0 max-sm:opacity-100">
              {CASTER_SOCIALS.map((social) => {
                const url = (caster as any)[social.key] || (social.altKey ? (caster as any)[social.altKey] : undefined)
                if (!url) return null
                return (
                  <a
                    key={social.key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 bg-surface/90 border border-border rounded-full text-muted-foreground transition-all duration-200 hover:scale-110 ${social.hoverClass}`}
                    title={social.title}
                  >
                    {social.icon}
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )

    if (useParallax) {
      return (
        <motion.div style={{ y }} className="h-full">
          {cardInner}
        </motion.div>
      )
    }

    return cardInner
  }

  return (
    <section ref={ref} className="relative overflow-hidden bg-deep py-12 lg:py-16">
      {/* Giant background text */}
      <span className="pointer-events-none absolute -right-20 top-20 select-none font-display text-[15vw] font-700 uppercase leading-none text-white/[0.02]">
        {d.casters.bgText}
      </span>

      <div className="container relative z-10 mx-auto px-5 lg:px-10">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 lg:mb-10">
          <div>
            <Reveal>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-10 bg-primary" />
                <span className="font-display text-sm font-600 uppercase tracking-widest text-primary">
                  {d.casters.badge}
                </span>
              </div>
            </Reveal>

            <SplitText
              as="h2"
              variant="title"
              lines={[d.casters.title1, d.casters.title2]}
              className="font-display text-5xl font-700 uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {casters.length > 4 && (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  aria-label="Desplazar casters hacia la izquierda"
                  className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-border bg-surface text-white hover:border-primary hover:text-primary transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-md hover:shadow-primary/20 hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  aria-label="Desplazar casters hacia la derecha"
                  className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-border bg-surface text-white hover:border-primary hover:text-primary transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-md hover:shadow-primary/20 hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            )}

            <Reveal direction="left" delay={0.2}>
              <a
                href="https://wa.me/525567862008?text=Hola,%20me%20gustar%C3%ADa%20postularme%20como%20caster%20para%20GMX%20Gaming!"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 border border-border bg-surface px-6 py-4 transition-colors hover:border-primary/50 clip-corner"
              >
                <div className="flex flex-col">
                  <span className="font-display text-sm font-600 uppercase tracking-widest text-white transition-colors group-hover:text-primary">
                    {d.casters.wantToBeCaster}
                  </span>
                  <span className="text-xs text-muted-foreground">{d.casters.applyWhatsApp}</span>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </a>
            </Reveal>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : casters.length > 4 ? (
          <div className="relative -mx-5 px-5 lg:-mx-10 lg:px-10">
            <div
              ref={scrollContainerRef}
              data-lenis-prevent
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-6 pt-2 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {casters.map((caster) => (
                <div
                  key={caster.id}
                  data-caster-card
                  className="snap-start shrink-0 w-[280px] sm:w-[300px] lg:w-[320px]"
                >
                  {renderCasterCard(caster, false)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Stagger className={cn(
            "grid gap-6",
            casters.length === 1 ? "grid-cols-1 max-w-sm mx-auto" :
            casters.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto" :
            casters.length === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto" :
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          )}>
            {casters.map((caster) => (
              <StaggerItem key={caster.id}>
                {renderCasterCard(caster, true)}
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </section>
  )
}
