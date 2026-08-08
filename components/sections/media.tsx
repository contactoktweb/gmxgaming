'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { Play } from 'lucide-react'
import { SplitText } from '@/components/split-text'
import { Reveal } from '@/components/anim'
import { createClient } from '@/utils/supabase/client'

type MediaLink = {
  id: string
  title: string
  url: string
}

export function Media() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, -100])
  const [videos, setVideos] = useState<MediaLink[]>([])
  const [activeVideo, setActiveVideo] = useState<MediaLink | null>(null)

  useEffect(() => {
    async function loadMedia() {
      const supabase = createClient()
      const { data } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (data && data.length > 0) {
        setVideos(data.map(v => ({ id: v.id, title: v.title, url: v.youtube_url })))
        setActiveVideo({ id: data[0].id, title: data[0].title, url: data[0].youtube_url })
      } else {
        setVideos([])
        setActiveVideo(null)
      }
    }
    loadMedia()
  }, [])

  if (videos.length === 0) return null

  return (
    <section ref={ref} className="relative overflow-hidden bg-background py-24 lg:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <div className="container relative z-10 mx-auto px-5 lg:px-10">
        <div className="mb-16 flex flex-col items-center text-center">
          <Reveal>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-10 bg-primary" />
              <span className="font-display text-sm font-600 uppercase tracking-widest text-primary">
                GMX TV
              </span>
              <span className="h-px w-10 bg-primary" />
            </div>
          </Reveal>

          <SplitText
            as="h2"
            variant="title"
            lines={['CONTENIDO', 'DESTACADO']}
            className="font-display text-5xl font-700 uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl"
          />
        </div>

        {videos.length > 0 && (
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Video Player */}
            <motion.div 
              style={{ y }}
              className="col-span-1 lg:col-span-2 overflow-hidden border border-border bg-surface p-2 shadow-2xl clip-corner relative aspect-video"
            >
              {activeVideo ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={activeVideo.url.replace('watch?v=', 'embed/')}
                  title={activeVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-deep flex items-center justify-center">
                  <Play className="w-12 h-12 text-muted-foreground opacity-50" />
                </div>
              )}
            </motion.div>

            {/* Playlist */}
            <div className="flex flex-col gap-4">
              {videos.map((video, idx) => (
                <button
                  key={video.id}
                  onClick={() => setActiveVideo(video)}
                  className={`group relative flex items-center gap-4 border p-4 text-left transition-all duration-300 clip-corner ${
                    activeVideo?.id === video.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-surface hover:border-primary/50'
                  }`}
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center bg-deep transition-colors ${
                    activeVideo?.id === video.id ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                  }`}>
                    <Play className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-display text-[10px] font-600 uppercase tracking-widest text-primary">
                      VIDEO 0{idx + 1}
                    </span>
                    <span className="line-clamp-2 text-sm font-500 text-white">
                      {video.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
