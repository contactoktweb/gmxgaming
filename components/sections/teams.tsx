'use client'

import { useState, useEffect, useRef } from 'react'
import { SplitText } from '@/components/split-text'
import { Reveal } from '@/components/anim'
import { createClient } from '@/utils/supabase/client'
import { getTeamSlug } from '@/lib/utils'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import Link from 'next/link'

export function Teams() {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchTeams() {
      const supabase = createClient()
      const { data } = await supabase
        .from('teams')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      
      if (data) setTeams(data)
      setLoading(false)
    }
    fetchTeams()
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 350
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (loading || teams.length === 0) return null

  return (
    <section id="equipos" className="relative overflow-hidden bg-background py-12 lg:py-16">
      <div className="mx-auto mb-8 max-w-[1400px] px-5 lg:mb-10 lg:px-10">
        <Reveal direction="fade">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-10 bg-primary" />
            <span className="font-display text-xs font-600 uppercase tracking-[0.3em] text-primary sm:text-sm">
              La élite compite con nosotros
            </span>
          </div>
        </Reveal>
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <SplitText
            as="h2"
            variant="title"
            text="EQUIPOS AFILIADOS"
            className="font-display text-4xl font-700 uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl"
          />
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => scroll('left')}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface text-white hover:border-primary hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface text-white hover:border-primary hover:text-primary transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-5 lg:px-10 pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {teams.map((t) => (
            <Link
              key={t.id}
              href={`/equipos/${getTeamSlug(t)}`}
              className="snap-start group flex h-48 w-[280px] sm:w-[320px] shrink-0 flex-col items-center justify-center gap-4 border border-border bg-surface transition-all duration-300 hover:border-primary hover:bg-elevated clip-corner"
              data-cursor
            >
              {t.logo_url ? (
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-background transition-transform duration-300 group-hover:scale-110 shadow-lg">
                  <img src={t.logo_url} alt={t.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-elevated font-display text-3xl font-700 text-primary transition-transform duration-300 group-hover:scale-110 shadow-lg border border-border">
                  {t.name.charAt(0)}
                </span>
              )}
              <div className="text-center">
                <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                  {t.name}
                </h3>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-600 uppercase tracking-widest text-muted-foreground">
                    {t.country || 'Desconocido'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 lg:w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 lg:w-24 bg-gradient-to-l from-background to-transparent" />
      </div>
    </section>
  )
}
