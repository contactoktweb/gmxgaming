'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Mic, Image as ImageIcon, ExternalLink, Camera, MessageCircle, Tv, Edit3, X, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { GmxButton } from '@/components/gmx-button'
import { toast } from 'sonner'
import { cn, formatNickname, formatPersonName } from '@/lib/utils'

interface Caster {
  id: string
  name: string
  nickname?: string
  photo_url?: string
  avatar_url?: string
  social_ig?: string
  social_x?: string
  social_twitch?: string
  instagram_url?: string
  twitter_url?: string
  twitch_url?: string
  created_at: string
}

export function AdminCasters() {
  const [casters, setCasters] = useState<Caster[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [casterForm, setCasterForm] = useState({
    name: '',
    nickname: '',
    photo_url: '',
    social_ig: '',
    social_x: '',
    social_twitch: ''
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchCasters()
  }, [])

  const fetchCasters = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('casters').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching casters:', error)
      toast.error('Error al cargar casters: ' + error.message)
    } else if (data) {
      setCasters(data)
    }
    setLoading(false)
  }

  const openNewCasterModal = () => {
    setEditingId(null)
    setCasterForm({ name: '', nickname: '', photo_url: '', social_ig: '', social_x: '', social_twitch: '' })
    setAvatarFile(null)
    setAvatarPreview(null)
    setIsModalOpen(true)
  }

  const openEditCasterModal = (caster: Caster) => {
    setEditingId(caster.id)
    setCasterForm({
      name: caster.name || '',
      nickname: caster.nickname || caster.name || '',
      photo_url: caster.photo_url || caster.avatar_url || '',
      social_ig: caster.social_ig || caster.instagram_url || '',
      social_x: caster.social_x || caster.twitter_url || '',
      social_twitch: caster.social_twitch || caster.twitch_url || ''
    })
    setAvatarFile(null)
    setAvatarPreview(caster.photo_url || caster.avatar_url || null)
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!casterForm.name.trim()) {
      toast.error('El nombre del caster es obligatorio')
      return
    }

    setIsSaving(true)

    try {
      let finalPhotoUrl = casterForm.photo_url || ''

      if (avatarFile) {
        toast.loading('Subiendo foto del caster...', { id: 'caster-upload' })
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `caster-${Date.now()}.${fileExt}`
        const { error: uploadError, data } = await supabase.storage.from('teams').upload(`casters/${fileName}`, avatarFile)
        toast.dismiss('caster-upload')
        
        if (uploadError) {
          console.error('Error al subir foto:', uploadError)
          toast.error('Error al subir la foto: ' + (uploadError.message || 'Inténtalo de nuevo'))
          setIsSaving(false)
          return
        }
        
        const { data: publicUrlData } = supabase.storage.from('teams').getPublicUrl(data.path)
        finalPhotoUrl = publicUrlData.publicUrl
      }

      const cleanName = formatPersonName(casterForm.name).trim()
      const cleanNick = formatNickname(casterForm.nickname || casterForm.name).trim()

      const payload = {
        name: cleanName,
        nickname: cleanNick,
        photo_url: finalPhotoUrl || null,
        social_ig: casterForm.social_ig?.trim() || null,
        social_x: casterForm.social_x?.trim() || null,
        social_twitch: casterForm.social_twitch?.trim() || null
      }

      if (editingId) {
        const { error } = await supabase.from('casters').update(payload).eq('id', editingId)
        if (error) throw error
        toast.success('Caster actualizado correctamente')
      } else {
        const { error } = await supabase.from('casters').insert([payload])
        if (error) throw error
        toast.success('Caster agregado correctamente')
      }

      setIsModalOpen(false)
      setCasterForm({ name: '', nickname: '', photo_url: '', social_ig: '', social_x: '', social_twitch: '' })
      setAvatarFile(null)
      setAvatarPreview(null)
      setEditingId(null)
      fetchCasters()
    } catch (err: any) {
      console.error('Error al guardar caster:', err)
      toast.error('Error al guardar el caster: ' + (err.message || 'Error desconocido'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este caster?')) {
      const { error } = await supabase.from('casters').delete().eq('id', id)
      if (error) {
        toast.error('Error al eliminar: ' + error.message)
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
          <div>
            <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
              <Mic className="w-6 h-6 text-primary" />
              Casters GMX
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Gestiona el talento y las voces oficiales de las transmisiones de GMX Gaming.
            </p>
          </div>
          <GmxButton onClick={openNewCasterModal} className="gap-2">
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
            {casters.map(caster => {
              const photo = caster.photo_url || caster.avatar_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'
              const twitch = caster.social_twitch || caster.twitch_url
              const instagram = caster.social_ig || caster.instagram_url
              const twitter = caster.social_x || caster.twitter_url

              return (
                <div key={caster.id} className="relative rounded-xl border border-border bg-background p-5 hover:border-primary/50 transition-colors group">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
                    <button 
                      onClick={() => openEditCasterModal(caster)}
                      className="p-2 rounded-full bg-surface border border-border text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all cursor-pointer"
                      title="Editar Caster"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(caster.id)}
                      className="p-2 rounded-full bg-surface border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-all cursor-pointer"
                      title="Eliminar Caster"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center text-center mt-2">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 mb-4 bg-surface shadow-md">
                      <img 
                        src={photo} 
                        alt={caster.nickname || caster.name}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <h3 className="font-display text-lg font-700 text-white uppercase tracking-tight">
                      {caster.nickname || caster.name}
                    </h3>
                    {caster.nickname && caster.nickname !== caster.name && (
                      <p className="text-xs text-muted-foreground font-500 mb-3">{caster.name}</p>
                    )}
                    
                    <div className="flex items-center gap-2.5 mt-3">
                      {twitch && (
                        <a href={twitch} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-surface border border-border text-muted-foreground hover:text-[#9146FF] hover:border-[#9146FF]/30 transition-colors" title="Twitch">
                          <Tv className="w-4 h-4" />
                        </a>
                      )}
                      {instagram && (
                        <a href={instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-surface border border-border text-muted-foreground hover:text-[#E1306C] hover:border-[#E1306C]/30 transition-colors" title="Instagram">
                          <Camera className="w-4 h-4" />
                        </a>
                      )}
                      {twitter && (
                        <a href={twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-surface border border-border text-muted-foreground hover:text-white hover:border-white/30 transition-colors" title="X / Twitter">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </a>
                      )}
                      {!twitch && !instagram && !twitter && (
                        <span className="text-[11px] text-muted-foreground/60 italic">Sin redes agregadas</span>
                      )}
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
          <div className="relative flex flex-col w-full max-w-md max-h-[90vh] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="flex shrink-0 items-center justify-between border-b border-border p-6 bg-surface z-10">
              <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" />
                {editingId ? "Editar Caster" : "Nuevo Caster"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div data-lenis-prevent data-modal-scrollbody className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-600 uppercase tracking-widest text-primary">
                  Nombre del Caster <span className="text-red-400">*</span>
                </label>
                <input 
                  type="text" 
                  value={casterForm.name}
                  onChange={e => setCasterForm({...casterForm, name: formatPersonName(e.target.value)})}
                  className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none uppercase"
                  placeholder="EJ: CARLOS MENDOZA"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-600 uppercase tracking-widest text-primary">
                  Nickname / IGN (Opcional)
                </label>
                <input 
                  type="text" 
                  value={casterForm.nickname}
                  onChange={e => setCasterForm({...casterForm, nickname: formatNickname(e.target.value)})}
                  className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none uppercase"
                  placeholder="EJ: CASTERPRO"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-600 uppercase tracking-widest text-primary">Foto del Caster</label>
                <div 
                  className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background p-6 transition-colors hover:border-primary/50"
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const file = e.dataTransfer.files[0]
                      setAvatarFile(file)
                      setAvatarPreview(URL.createObjectURL(file))
                    }
                  }}
                >
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0]
                        setAvatarFile(file)
                        setAvatarPreview(URL.createObjectURL(file))
                      }
                    }}
                    className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
                  />
                  {avatarPreview ? (
                    <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-primary/20 shadow-md">
                      <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground opacity-50" />
                      <p className="text-sm text-white">Haz clic o arrastra una imagen</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG hasta 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-600 uppercase tracking-widest text-primary">Twitch (URL) - Opcional</label>
                <input 
                  type="text" 
                  value={casterForm.social_twitch}
                  onChange={e => setCasterForm({...casterForm, social_twitch: e.target.value})}
                  className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                  placeholder="https://twitch.tv/usuario"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-600 uppercase tracking-widest text-primary">Instagram (URL) - Opcional</label>
                <input 
                  type="text" 
                  value={casterForm.social_ig}
                  onChange={e => setCasterForm({...casterForm, social_ig: e.target.value})}
                  className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                  placeholder="https://instagram.com/usuario"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-600 uppercase tracking-widest text-primary">Twitter / X (URL) - Opcional</label>
                <input 
                  type="text" 
                  value={casterForm.social_x}
                  onChange={e => setCasterForm({...casterForm, social_x: e.target.value})}
                  className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                  placeholder="https://x.com/usuario"
                />
              </div>
            </div>

            <div className="flex shrink-0 gap-3 border-t border-border p-6 bg-surface z-10">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-md border border-border bg-transparent px-4 py-3 font-display text-[13px] font-600 uppercase tracking-widest text-muted-foreground hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <GmxButton 
                onClick={handleSave} 
                disabled={isSaving || !casterForm.name.trim()}
                className="flex-1 px-4 py-3"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </GmxButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

