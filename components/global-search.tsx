'use client'

import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Search, X, Loader2, Users, Shield, Trophy } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useDebounce } from '@/hooks/use-debounce'
import { cn, getPlayerSlug, getTeamSlug, getTournamentSlug } from '@/lib/utils'
import Link from 'next/link'

import { useLanguage } from '@/lib/language-context'

type SearchResult = {
  id: string
  title: string
  type: 'player' | 'team' | 'tournament'
  subtitle?: string
  slug?: string
  imageUrl?: string | null
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { d } = useLanguage()
  const supabase = createClient()
  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setQuery('')
      setResults([])
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    async function searchDatabase() {
      const cleanTerm = debouncedQuery.replace(/[,()]/g, ' ').trim()
      if (!cleanTerm || cleanTerm.length < 2) {
        setResults([])
        return
      }
      setIsLoading(true)

      const searchTerms = `%${cleanTerm}%`
      const results: SearchResult[] = []

      // Promesas concurrentes buscando jugadores por nickname, game_nickname y nombre
      const [teamsResponse, playersResponse, tournamentsResponse] = await Promise.all([
        supabase
          .from('teams')
          .select('id, name, tag, logo_url')
          .or(`name.ilike.${searchTerms},tag.ilike.${searchTerms}`)
          .limit(5),
        supabase
          .from('profiles')
          .select('id, nickname, avatar_url, is_player')
          .eq('is_player', true)
          .ilike('nickname', searchTerms)
          .limit(5),
        supabase
          .from('tournaments')
          .select('id, name')
          .ilike('name', searchTerms)
          .limit(5)
      ])

      if (teamsResponse.data) {
        teamsResponse.data.forEach(t => {
          const slug = getTeamSlug(t) || t.id
          results.push({
            id: t.id,
            title: t.name,
            subtitle: t.tag,
            type: 'team',
            slug,
            imageUrl: t.logo_url
          })
        })
      }
      if (playersResponse.data) {
        playersResponse.data.forEach(p => {
          const displayNickname = p.nickname || p.game_nickname || d.header.searchTypePlayer
          const slug = getPlayerSlug(p) || p.id
          results.push({
            id: p.id,
            title: displayNickname,
            subtitle: undefined,
            type: 'player',
            slug,
            imageUrl: p.avatar_url
          })
        })
      }
      if (tournamentsResponse.data) {
        tournamentsResponse.data.forEach(t => {
          const slug = getTournamentSlug(t) || t.id
          results.push({
            id: t.id,
            title: t.name,
            type: 'tournament',
            slug
          })
        })
      }

      setResults(results)
      setIsLoading(false)
    }
    searchDatabase()
  }, [debouncedQuery, d])

  return (
    <>
      {/* Botón en el Header */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-white/20 hover:text-white shrink-0 cursor-pointer"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden lg:inline">{d.header.searchPlaceholder}</span>
        <span className="hidden lg:inline ml-auto text-xs opacity-50 border border-border rounded px-1.5">⌘K</span>
      </button>

      {/* Modal de Búsqueda */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setIsOpen(false)} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
            >
              <div className="flex items-center border-b border-border px-4 py-4">
                <Search className="mr-3 h-5 w-5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={d.header.searchModalPlaceholder}
                  className="flex-1 bg-transparent font-display text-lg text-white outline-none placeholder:text-muted-foreground"
                />
                {isLoading && <Loader2 className="ml-3 h-5 w-5 animate-spin text-primary" />}
                <button
                  onClick={() => setIsOpen(false)}
                  className="ml-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto overscroll-contain px-2 py-4">
                {query.length > 0 && query.length < 2 && (
                  <p className="text-center text-sm text-muted-foreground py-6">
                    {d.header.searchMinChars}
                  </p>
                )}

                {query.length >= 2 && results.length === 0 && !isLoading && (
                  <p className="text-center text-sm text-muted-foreground py-6">
                    {d.header.searchNoResults} "{query}".
                  </p>
                )}

                {results.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {results.map((result, idx) => {
                      const destinationUrl = `/${result.type === 'player' ? 'jugadores' : result.type === 'team' ? 'equipos' : 'torneos'}/${result.slug || result.id}`
                      const typeLabel = result.type === 'player' ? d.header.searchTypePlayer : result.type === 'team' ? d.header.searchTypeTeam : d.header.searchTypeTournament
                      return (
                        <motion.div
                          key={`${result.type}-${result.id}-${idx}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <Link
                            href={destinationUrl}
                            onClick={() => setIsOpen(false)}
                            className="group flex items-center justify-between rounded-lg px-4 py-3 transition-colors hover:bg-white/5"
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border overflow-hidden",
                                result.type === 'player' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' :
                                result.type === 'team' ? 'border-blue-500/20 bg-blue-500/10 text-blue-500' :
                                'border-purple-500/20 bg-purple-500/10 text-purple-500'
                              )}>
                                {result.imageUrl ? (
                                  <img
                                    src={result.imageUrl}
                                    alt={result.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <>
                                    {result.type === 'player' && <Users className="h-5 w-5" />}
                                    {result.type === 'team' && <Shield className="h-5 w-5" />}
                                    {result.type === 'tournament' && <Trophy className="h-5 w-5" />}
                                  </>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-600 text-white group-hover:text-primary transition-colors">
                                  {result.title}
                                </span>
                                <span className="text-xs font-500 uppercase tracking-wider text-muted-foreground">
                                  {typeLabel}
                                  {result.subtitle && (result.type === 'team' ? ` • [${result.subtitle}]` : ` • ${result.subtitle}`)}
                                </span>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
