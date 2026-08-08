'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Mic, Image as ImageIcon, ExternalLink, Camera, MessageCircle, Tv } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { GmxButton } from '@/components/gmx-button'
import { toast } from 'sonner'

interface Caster {
  id: string
  name: string
  avatar_url: string
  instagram_url: string
  twitter_url: string
  twitch_url: string
  created_at: string
}

export function AdminCasters() {
  const [casters, setCasters] = useState<Caster[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newCaster, setNewCaster] = useState({ name: '', avatar_url: '', instagram_url: '', twitter_url: '', twitch_url: '' })
  const supabase = createClient()

  useEffect(() => {
    fetchCasters()
  }, [])

  const fetchCasters = async () => {
    setLoading(true)
    const { data } = await supabase.from('casters').select('*').order('created_at', { ascending: false })
    if (data) setCasters(data)
    setLoading(false)
  }

  const handleSave = async () => {
    if (!newCaster.name) {
      toast.error('El nombre es obligatorio')
      return
    }

    const { error } = await supabase.from('casters').insert([newCaster])
    
    if (error) {
      toast.error('Error al guardar el caster')
    } else {
      toast.success('Caster agregado correctamente')
      setIsModalOpen(false)
      setNewCaster({ name: '', avatar_url: '', instagram_url: '', twitter_url: '', twitch_url: '' })
      fetchCasters()
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este caster?')) {
      const { error } = await supabase.from('casters').delete().eq('id', id)
      if (error) {
        toast.error('Error al eliminar')
      } else {
        toast.success('Caster eliminado')
        setCasters(prev => prev.filter(c => c.id !== id))
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
            <Mic className="w-6 h-6 text-primary" />
            Casters GMX
          </h2>
          <GmxButton onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Agregar Caster
          </GmxButton>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground animate-pulse">Cargando casters...</div>
        ) : casters.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-border rounded-lg bg-background/50">
            <Mic className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No hay casters registrados.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {casters.map(caster => (
              <div key={caster.id} className="relative rounded-xl border border-border bg-background p-5 hover:border-primary/50 transition-colors">
                <button 
                  onClick={() => handleDelete(caster.id)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-surface border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-all z-10"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex flex-col items-center text-center mt-2">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 mb-4 bg-surface">
                    <img 
                      src={caster.avatar_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                      alt={caster.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-display text-lg font-700 text-white uppercase tracking-tight mb-4">{caster.name}</h3>
                  
                  <div className="flex items-center gap-3">
                    {caster.twitch_url && (
                      <a href={caster.twitch_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded bg-surface border border-border text-muted-foreground hover:text-[#9146FF] transition-colors">
                        <Twitch className="w-4 h-4" />
                      </a>
                    )}
                    {caster.instagram_url && (
                      <a href={caster.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded bg-surface border border-border text-muted-foreground hover:text-[#E1306C] transition-colors">
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {caster.twitter_url && (
                      <a href={caster.twitter_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded bg-surface border border-border text-muted-foreground hover:text-[#1DA1F2] transition-colors">
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative flex flex-col w-full max-w-md max-h-[90vh] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="flex shrink-0 items-center justify-between border-b border-border p-6 bg-surface z-10">
              <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" />
                Nuevo Caster
              </h3>
            </div>
            
            <div data-lenis-prevent data-modal-scrollbody className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-600 uppercase tracking-widest text-primary">Nombre del Caster</label>
                <input 
                  type="text" 
                  value={newCaster.name}
                  onChange={e => setNewCaster({...newCaster, name: e.target.value})}
                  className="w-full rounded-md border border-border bg-background px-4 py-2 text-white focus:border-primary focus:outline-none"
                  placeholder="Nombre o Nickname"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-600 uppercase tracking-widest text-primary">Foto (URL)</label>
                <input 
                  type="text" 
                  value={newCaster.avatar_url}
                  onChange={e => setNewCaster({...newCaster, avatar_url: e.target.value})}
                  className="w-full rounded-md border border-border bg-background px-4 py-2 text-white focus:border-primary focus:outline-none"
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-600 uppercase tracking-widest text-primary">Twitch (URL) - Opcional</label>
                <input 
                  type="text" 
                  value={newCaster.twitch_url}
                  onChange={e => setNewCaster({...newCaster, twitch_url: e.target.value})}
                  className="w-full rounded-md border border-border bg-background px-4 py-2 text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-600 uppercase tracking-widest text-primary">Instagram (URL) - Opcional</label>
                <input 
                  type="text" 
                  value={newCaster.instagram_url}
                  onChange={e => setNewCaster({...newCaster, instagram_url: e.target.value})}
                  className="w-full rounded-md border border-border bg-background px-4 py-2 text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-600 uppercase tracking-widest text-primary">Twitter / X (URL) - Opcional</label>
                <input 
                  type="text" 
                  value={newCaster.twitter_url}
                  onChange={e => setNewCaster({...newCaster, twitter_url: e.target.value})}
                  className="w-full rounded-md border border-border bg-background px-4 py-2 text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex shrink-0 gap-3 border-t border-border p-6 bg-surface z-10">
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
