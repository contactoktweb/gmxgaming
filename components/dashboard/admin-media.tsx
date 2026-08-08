'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, PlaySquare, ExternalLink, Video } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { GmxButton } from '@/components/gmx-button'
import { toast } from 'sonner'

interface Media {
  id: string
  title: string
  youtube_url: string
  created_at: string
}

export function AdminMedia() {
  const [mediaList, setMediaList] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newMedia, setNewMedia] = useState({ title: '', youtube_url: '' })
  const supabase = createClient()

  useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    setLoading(true)
    const { data } = await supabase.from('media').select('*').order('created_at', { ascending: false })
    if (data) setMediaList(data)
    setLoading(false)
  }

  const handleSave = async () => {
    if (!newMedia.title || !newMedia.youtube_url) {
      toast.error('Completa todos los campos')
      return
    }

    const { error } = await supabase.from('media').insert([newMedia])
    
    if (error) {
      toast.error('Error al guardar el video')
    } else {
      toast.success('Video agregado correctamente')
      setIsModalOpen(false)
      setNewMedia({ title: '', youtube_url: '' })
      fetchMedia()
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este video?')) {
      const { error } = await supabase.from('media').delete().eq('id', id)
      if (error) {
        toast.error('Error al eliminar')
      } else {
        toast.success('Video eliminado')
        setMediaList(prev => prev.filter(m => m.id !== id))
      }
    }
  }

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
            <PlaySquare className="w-6 h-6 text-red-500" />
            Media (Videos)
          </h2>
          <GmxButton onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Agregar Video
          </GmxButton>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground animate-pulse">Cargando videos...</div>
        ) : mediaList.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-border rounded-lg bg-background/50">
            <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No hay videos registrados.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mediaList.map(media => {
              const videoId = getYoutubeId(media.youtube_url)
              const thumbnailUrl = videoId 
                ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` 
                : 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop'

              return (
                <div key={media.id} className="group relative rounded-xl border border-border bg-background overflow-hidden hover:border-primary/50 transition-colors">
                  <div className="aspect-video relative overflow-hidden bg-surface">
                    <img src={thumbnailUrl} alt={media.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={media.youtube_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white hover:scale-110 transition-transform">
                        <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </a>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-600 text-white line-clamp-2 text-sm mb-3" title={media.title}>{media.title}</h3>
                    <div className="flex items-center justify-between">
                      <a href={media.youtube_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-600 uppercase tracking-widest text-muted-foreground hover:text-white flex items-center gap-1">
                        Ver en YT <ExternalLink className="w-3 h-3" />
                      </a>
                      <button 
                        onClick={() => handleDelete(media.id)}
                        className="p-1.5 rounded text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white mb-6">
              Agregar Nuevo Video
            </h3>
            
            <div className="space-y-4 mb-8">
              <div className="space-y-2">
                <label className="text-xs font-600 uppercase tracking-widest text-primary">Título del Video</label>
                <input 
                  type="text" 
                  value={newMedia.title}
                  onChange={e => setNewMedia({...newMedia, title: e.target.value})}
                  className="w-full rounded-md border border-border bg-background px-4 py-2 text-white focus:border-primary focus:outline-none"
                  placeholder="Ej: Final Torneo 2024"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-600 uppercase tracking-widest text-primary">URL de YouTube</label>
                <input 
                  type="text" 
                  value={newMedia.youtube_url}
                  onChange={e => setNewMedia({...newMedia, youtube_url: e.target.value})}
                  className="w-full rounded-md border border-border bg-background px-4 py-2 text-white focus:border-primary focus:outline-none"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-md border border-border bg-transparent px-4 py-3 font-display text-[13px] font-600 uppercase tracking-widest text-muted-foreground hover:text-white"
              >
                Cancelar
              </button>
              <GmxButton onClick={handleSave} className="flex-1 px-4 py-3">
                Guardar
              </GmxButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
