'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight, Loader2 } from 'lucide-react'
import { SplitText } from '@/components/split-text'
import { Reveal } from '@/components/anim'
import { PLAYERS } from '@/lib/site-data'
import { createClient } from '@/utils/supabase/client'

type FeaturedPlayer = {
  id: string
  name: string
  nickname: string
  game: string
  team: string
  img: string
}

export function Players() {
  const [players, setPlayers] = useState<FeaturedPlayer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFeaturedPlayers() {
      const supabase = createClient()
      // We will try to fetch from the new profiles structure
      // As the database might not be fully populated, we wrap in try-catch
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            name,
            nickname,
            avatar_url,
            is_featured,
            is_player,
            contracts(teams(name), status)
          `)
          .eq('is_player', true)
          .eq('is_featured', true)
          .limit(8)
          
        if (data && data.length > 0) {
          const formatted = data.map((p: any) => {
            const activeContract = p.contracts?.find((c: any) => c.status === 'activo' || c.status === 'active')
            const teamName = activeContract?.teams?.name || 'Agente Libre'

            return {
              id: p.id,
              name: p.nickname || p.name,
              nickname: p.name,
              game: 'Esports', // We can update this later if we add per-game tracking
              team: teamName,
              img: p.avatar_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'
            }
          })
          setPlayers(formatted)
        } else {
          // Si no hay destacados, mostrar array vacio o ocultar seccion, pero dejamos fallback por diseño base
          setPlayers([])
        }
      } catch (err) {
        setPlayers(PLAYERS.map(p => ({
          id: p.name,
          name: p.name,
          nickname: p.name,
          game: p.game,
          team: p.team,
          img: p.img
        })))
      }
      setLoading(false)
    }
    loadFeaturedPlayers()
  }, [])

  if (!loading && players.length === 0) return null

  return (
    <section className="relative bg-background py-12 lg:py-16">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-10">
        <div className="mb-8 flex flex-col items-start justify-between gap-6 lg:mb-10 lg:flex-row lg:items-end">
          <div>
            <Reveal direction="fade">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-primary" />
                <span className="font-display text-xs font-600 uppercase tracking-[0.3em] text-primary sm:text-sm">
                  Conviértete en uno de los mejores
                </span>
              </div>
            </Reveal>
            <SplitText
              as="h2"
              variant="title"
              lines={['CONVIÉRTETE EN', 'UNA ESTRELLA']}
              className="font-display text-5xl font-700 uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {players.map((p, i) => (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: (i % 4) * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="group relative aspect-[3/4] overflow-hidden border border-border clip-corner"
                data-cursor
              >
                <img
                  src={p.img || '/placeholder.svg'}
                  alt={`${p.name} — ${p.team}`}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/30 to-transparent transition-colors duration-500 group-hover:from-primary-dark/60" />

                {/* arrow */}
                <span className="absolute right-4 top-4 flex h-10 w-10 translate-y-2 items-center justify-center bg-primary text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <ArrowUpRight className="size-5" />
                </span>

                <div className="absolute inset-x-0 bottom-0 p-5 transition-transform duration-300 group-hover:-translate-y-1">
                  <span className="mb-2 inline-block bg-primary px-2 py-0.5 font-display text-[10px] font-600 uppercase tracking-[0.15em] text-white">
                    {p.game}
                  </span>
                  <h3 className="font-display text-2xl font-700 uppercase leading-none tracking-tight text-white">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-xs font-500 uppercase tracking-[0.18em] text-muted-foreground">
                    {p.team}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
