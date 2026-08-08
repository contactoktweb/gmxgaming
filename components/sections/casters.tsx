'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { Camera, Tv, Mic, Loader2, ArrowRight } from 'lucide-react'
import { SplitText } from '@/components/split-text'
import { Reveal, Stagger, StaggerItem } from '@/components/anim'
import { createClient } from '@/utils/supabase/client'

type Caster = {
  id: string
  name: string
  nickname: string
  photo_url: string
  social_ig?: string
  social_twitch?: string
  social_x?: string
}

export function Casters() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [40, -40])
  const [casters, setCasters] = useState<Caster[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCasters() {
      const supabase = createClient()
      const { data } = await supabase
        .from('casters')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(4)
      
      if (data && data.length > 0) {
        setCasters(data.map(c => ({ ...c, nickname: c.name })))
      } else {
        setCasters([])
      }
      setLoading(false)
    }
    loadCasters()
  }, [])

  if (!loading && casters.length === 0) return <section ref={ref} className="hidden" />

  return (
    <section ref={ref} className="relative overflow-hidden bg-deep py-24 lg:py-32">
      {/* Giant background text */}
      <span className="pointer-events-none absolute -right-20 top-20 select-none font-display text-[15vw] font-700 uppercase leading-none text-white/[0.02]">
        TALENTO
      </span>

      <div className="container relative z-10 mx-auto px-5 lg:px-10">
        <div className="mb-16 flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div>
            <Reveal>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-10 bg-primary" />
                <span className="font-display text-sm font-600 uppercase tracking-widest text-primary">
                  Voces de GMX
                </span>
              </div>
            </Reveal>

            <SplitText
              as="h2"
              variant="title"
              lines={['NUESTROS', 'CASTERS']}
              className="font-display text-5xl font-700 uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl"
            />
          </div>
          
          <Reveal direction="left" delay={0.2}>
            <a
              href="https://wa.me/1234567890?text=Hola,%20me%20gustar%C3%ADa%20postularme%20como%20caster%20para%20GMX%20Gaming!"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 border border-border bg-surface px-6 py-4 transition-colors hover:border-primary/50 clip-corner"
            >
              <div className="flex flex-col">
                <span className="font-display text-sm font-600 uppercase tracking-widest text-white transition-colors group-hover:text-primary">
                  ¿Quieres ser Caster?
                </span>
                <span className="text-xs text-muted-foreground">Postúlate por WhatsApp</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </a>
          </Reveal>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {casters.map((caster) => (
              <StaggerItem key={caster.id}>
                <motion.div 
                  style={{ y }}
                  className="group relative overflow-hidden bg-surface clip-corner aspect-[3/4]"
                >
                  <img
                    src={caster.avatar_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'}
                    alt={caster.nickname}
                    className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-100"
                  />
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-deep/90 via-deep/40 to-transparent" />
                  
                  {/* Content */}
                  <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col items-center text-center">
                    <div className="mb-4 rounded-full bg-primary/20 p-3 backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-2">
                      <Mic className="h-6 w-6 text-primary" />
                    </div>
                    
                    <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white">
                      {caster.nickname}
                    </h3>
                    <p className="mt-1 text-sm font-500 text-muted-foreground">
                      {caster.name}
                    </p>
                    
                    {/* Socials - Reveal on hover */}
                    <div className="mt-4 flex gap-3 overflow-hidden">
                      <div className="flex gap-3 translate-y-8 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        {caster.instagram_url && (
                          <a href={caster.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface border border-border rounded-full text-muted-foreground hover:text-pink-500 hover:border-pink-500/50 transition-colors">
                            <Camera className="w-4 h-4" />
                          </a>
                        )}
                        {caster.twitch_url && (
                          <a href={caster.twitch_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface border border-border rounded-full text-muted-foreground hover:text-purple-500 hover:border-purple-500/50 transition-colors">
                            <Tv className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </section>
  )
}
