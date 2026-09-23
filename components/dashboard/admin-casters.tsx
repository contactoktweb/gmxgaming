'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Mic, Image as ImageIcon, ExternalLink, Camera, MessageCircle, Tv, Edit3, X, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { GmxButton } from '@/components/gmx-button'
import { toast } from 'sonner'
import { cn, formatNickname, formatPersonName } from '@/lib/utils'
import { compressImage, IMAGE_PRESETS, SUPABASE_STORAGE_CACHE_OPTIONS } from '@/lib/image-compression'

interface Caster {
  id: string
  name: string
  nickname?: string
  photo_url?: string
  avatar_url?: string
  social_twitch?: string
  social_ig?: string
  social_x?: string
  social_fb?: string
  social_tiktok?: string
  social_kick?: string
  social_yt?: string
  instagram_url?: string
  twitter_url?: string
  twitch_url?: string
  created_at: string
}

const SOCIAL_NETWORKS_CONFIG = [
  { key: 'social_twitch', label: 'Twitch', placeholder: 'https://twitch.tv/usuario', color: '#9146FF' },
  { key: 'social_ig', label: 'Instagram', placeholder: 'https://instagram.com/usuario', color: '#E1306C' },
  { key: 'social_x', label: 'Twitter / X', placeholder: 'https://x.com/usuario', color: '#FFFFFF' },
  { key: 'social_fb', label: 'Facebook', placeholder: 'https://facebook.com/usuario', color: '#1877F2' },
  { key: 'social_tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@usuario', color: '#00F2FE' },
  { key: 'social_kick', label: 'Kick', placeholder: 'https://kick.com/usuario', color: '#53FC18' },
  { key: 'social_yt', label: 'YouTube', placeholder: 'https://youtube.com/@usuario', color: '#FF0000' },
] as const

type SocialKey = typeof SOCIAL_NETWORKS_CONFIG[number]['key']

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
    social_twitch: '',
    social_ig: '',
    social_x: '',
    social_fb: '',
    social_tiktok: '',
    social_kick: '',
    social_yt: ''
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
    setCasterForm({
      name: '',
      nickname: '',
      photo_url: '',
      social_twitch: '',
      social_ig: '',
      social_x: '',
      social_fb: '',
      social_tiktok: '',
      social_kick: '',
      social_yt: ''
    })
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
      social_twitch: caster.social_twitch || caster.twitch_url || '',
      social_ig: caster.social_ig || caster.instagram_url || '',
      social_x: caster.social_x || caster.twitter_url || '',
      social_fb: caster.social_fb || '',
      social_tiktok: caster.social_tiktok || '',
      social_kick: caster.social_kick || '',
      social_yt: caster.social_yt || ''
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
        const compressed = await compressImage(avatarFile, IMAGE_PRESETS.AVATAR)
        const fileExt = compressed.name.split('.').pop() || 'webp'
        const fileName = `caster-${Date.now()}.${fileExt}`
        const { error: uploadError, data } = await supabase.storage.from('teams').upload(`casters/${fileName}`, compressed, SUPABASE_STORAGE_CACHE_OPTIONS)
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

      const fullPayload: any = {
        name: cleanName,
        nickname: cleanNick,
        photo_url: finalPhotoUrl || null,
        social_twitch: casterForm.social_twitch?.trim() || null,
        social_ig: casterForm.social_ig?.trim() || null,
        social_x: casterForm.social_x?.trim() || null,
        social_fb: casterForm.social_fb?.trim() || null,
        social_tiktok: casterForm.social_tiktok?.trim() || null,
        social_kick: casterForm.social_kick?.trim() || null,
        social_yt: casterForm.social_yt?.trim() || null
      }

      let saveError = null

      if (editingId) {
        const { error } = await supabase.from('casters').update(fullPayload).eq('id', editingId)
        saveError = error
      } else {
        const { error } = await supabase.from('casters').insert([fullPayload])
        saveError = error
      }

      // Si las columnas nuevas aún no existen en la BD de Supabase (error 42703), fallback a columnas base
      if (saveError && (saveError.code === '42703' || saveError.message?.includes('column'))) {
        const basePayload = {
          name: cleanName,
          nickname: cleanNick,
          photo_url: finalPhotoUrl || null,
          social_twitch: casterForm.social_twitch?.trim() || null,
          social_ig: casterForm.social_ig?.trim() || null,
          social_x: casterForm.social_x?.trim() || null
        }

        if (editingId) {
          const { error: fErr } = await supabase.from('casters').update(basePayload).eq('id', editingId)
          if (fErr) throw fErr
        } else {
          const { error: fErr } = await supabase.from('casters').insert([basePayload])
          if (fErr) throw fErr
        }

        toast.info('Caster guardado', {
          description: 'Para habilitar Facebook, TikTok, Kick y YouTube, ejecuta la migración en Supabase.'
        })
      } else if (saveError) {
        throw saveError
      } else {
        toast.success(editingId ? 'Caster actualizado correctamente' : 'Caster agregado correctamente')
      }

      setIsModalOpen(false)
      setCasterForm({
        name: '',
        nickname: '',
        photo_url: '',
        social_twitch: '',
        social_ig: '',
        social_x: '',
        social_fb: '',
        social_tiktok: '',
        social_kick: '',
        social_yt: ''
      })
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
                    
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                      {SOCIAL_NETWORKS_CONFIG.map(network => {
                        const url = (caster as any)[network.key] || 
                                    (network.key === 'social_twitch' ? caster.twitch_url :
                                     network.key === 'social_ig' ? caster.instagram_url :
                                     network.key === 'social_x' ? caster.twitter_url : undefined)
                        if (!url) return null
                        return (
                          <a 
                            key={network.key}
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-2 rounded-lg bg-surface border border-border text-muted-foreground transition-all hover:scale-105"
                            style={{ transition: 'all 0.2s ease' }}
                            onMouseEnter={(e) => { 
                              e.currentTarget.style.color = network.color; 
                              e.currentTarget.style.borderColor = `${network.color}66`;
                              e.currentTarget.style.backgroundColor = `${network.color}15`;
                            }}
                            onMouseLeave={(e) => { 
                              e.currentTarget.style.color = ''; 
                              e.currentTarget.style.borderColor = '';
                              e.currentTarget.style.backgroundColor = '';
                            }}
                            title={network.label}
                          >
                            {network.key === 'social_twitch' && <Tv className="w-4 h-4" />}
                            {network.key === 'social_ig' && <Camera className="w-4 h-4" />}
                            {network.key === 'social_x' && (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
                            )}
                            {network.key === 'social_fb' && (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                            )}
                            {network.key === 'social_tiktok' && (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
                              </svg>
                            )}
                            {network.key === 'social_kick' && (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M4 3h5v5.5l4-5.5h6l-6.5 8 7 10h-6L9 14.5V21H4V3z"/>
                              </svg>
                            )}
                            {network.key === 'social_yt' && (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                              </svg>
                            )}
                          </a>
                        )
                      })}
                      {!caster.social_twitch && !caster.social_ig && !caster.social_x && !caster.social_fb && !caster.social_tiktok && !caster.social_kick && !caster.social_yt && !caster.twitch_url && !caster.instagram_url && !caster.twitter_url && (
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

              {/* Redes Casters */}
              <div className="space-y-3 pt-3 border-t border-border/50">
                <p className="text-xs font-700 uppercase tracking-widest text-primary">Redes Casters</p>
                <div className="space-y-3">
                  {SOCIAL_NETWORKS_CONFIG.map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-xs font-600 uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                        <span>{label}</span>
                        <span className="text-[10px] text-muted-foreground/60 font-normal lowercase">(opcional)</span>
                      </label>
                      <input 
                        type="url" 
                        value={casterForm[key]}
                        onChange={e => setCasterForm({ ...casterForm, [key]: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-4 py-2 text-xs text-white focus:border-primary focus:outline-none placeholder:text-muted-foreground/40 transition-colors"
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                </div>
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

