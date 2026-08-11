'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Camera, CheckCircle2, AlertCircle, Image as ImageIcon, ShieldAlert, ArrowRight, User, X, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GmxButton } from '@/components/gmx-button'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

export function UserProfile() {
  const { user } = useAuth()
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.avatar || null)
  const [name, setName] = useState(user?.name || 'Usuario')
  const [bio, setBio] = useState('Cuéntanos un poco sobre ti...')

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const supabase = createClient()
  
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    profilePhoto: null as string | null,
    coverPhoto: null as string | null,
    imagesChanged: false
  })

  const [profileData, setProfileData] = useState<any>(null)
  
  useEffect(() => {
    if (user) {
      setName(user.name)
      setProfilePhoto(user.avatar || null)
      
      // Fetch DB Profile
      const fetchProfile = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) setProfileData(data)
      }
      fetchProfile()
    }
  }, [user])

  useEffect(() => {
    if (isEditing) {
      window.__lenis?.stop()
      const blockScroll = (e: WheelEvent) => {
        const modalBody = document.querySelector('[data-modal-scrollbody]')
        if (modalBody && modalBody.contains(e.target as Node)) return
        e.preventDefault()
      }
      window.addEventListener('wheel', blockScroll, { passive: false })
      return () => {
        window.removeEventListener('wheel', blockScroll)
        window.__lenis?.start()
      }
    } else {
      window.__lenis?.start()
    }
  }, [isEditing, showPlayerModal])

  const openEdit = () => {
    setEditForm({
      name,
      bio,
      profilePhoto,
      coverPhoto,
      imagesChanged: false
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    setName(editForm.name)
    setBio(editForm.bio)
    
    if (user) {
      await supabase.from('profiles').update({
        name: editForm.name,
        avatar: editForm.profilePhoto || user.avatar
      }).eq('id', user.id)
    }

    if (editForm.profilePhoto !== profilePhoto || editForm.coverPhoto !== coverPhoto) {
      setProfilePhoto(editForm.profilePhoto)
      setCoverPhoto(editForm.coverPhoto)
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 5000)
    }
    
    setIsEditing(false)
  }

  const requestEdit = async () => {
    if (user) {
      await supabase.from('profiles').update({ edit_requested: true }).eq('id', user.id)
      setProfileData({ ...profileData, edit_requested: true })
      toast.success('Solicitud Enviada', {
        description: 'Un administrador revisará tu solicitud de modificación pronto.'
      })
    }
  }

  const triggerUpload = (type: 'cover' | 'profile', isEditForm = false) => {
    // Simulate file selection
    const newImage = type === 'cover' 
      ? 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop'
      : 'https://i0.wp.com/gmxgaming.com/wp-content/uploads/2024/08/SinnerGMX.png?fit=300%2C300&ssl=1'
      
    if (isEditForm) {
      setEditForm(prev => ({
        ...prev,
        [type === 'cover' ? 'coverPhoto' : 'profilePhoto']: newImage,
        imagesChanged: true
      }))
    } else {
      if (type === 'cover') setCoverPhoto(newImage)
      else setProfilePhoto(newImage)
      
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 5000)
    }
  }

  const canEdit = profileData?.can_edit_profile || user?.role === 'admin'
  const isRequested = profileData?.edit_requested

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Profile Header (Cover + Avatar + Basic Info) */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {/* Cover Photo Area */}
        <div 
          className="group relative h-48 sm:h-64 w-full bg-background flex items-center justify-center overflow-hidden"
        >
          {coverPhoto ? (
            <img src={coverPhoto} alt="Cover" className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-background to-surface" />
          )}
          
          {canEdit && (
            <button 
              onClick={() => triggerUpload('cover')}
              className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-500 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-black group-hover:opacity-100"
            >
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Cambiar portada</span>
            </button>
          )}
        </div>

        {/* Profile Info Area */}
        <div className="relative px-6 pb-6 sm:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-8 -mt-16 sm:-mt-20">
            {/* Avatar */}
            <div className="group relative h-32 w-32 shrink-0 overflow-hidden rounded-xl border-4 border-surface bg-background">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              {canEdit && (
                <button 
                  onClick={() => triggerUpload('profile')}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                >
                  <Camera className="h-8 w-8 text-white" />
                </button>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-2 pb-2">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-3xl font-700 text-white">{name}</h2>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-500 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4" />
                  Aprobado
                </div>
              </div>
              <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
                {bio}
              </p>
            </div>

            {/* Action */}
            <div className="pb-2">
              {canEdit ? (
                <button 
                  onClick={openEdit}
                  className="flex items-center gap-2 rounded-md bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-500 text-white transition-colors"
                >
                  Editar Perfil
                </button>
              ) : isRequested ? (
                <div className="flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-sm font-500 text-amber-500 cursor-not-allowed">
                  Solicitud Pendiente
                </div>
              ) : (
                <button 
                  onClick={requestEdit}
                  className="flex items-center gap-2 rounded-md bg-primary/10 hover:bg-primary px-4 py-2 text-sm font-500 text-primary hover:text-white transition-colors"
                >
                  Solicitar Modificación
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Registrations Grid */}
      <div className="space-y-4">
        <h3 className="font-display text-xl font-600 uppercase tracking-tight text-white px-1">
          Mis Registros
        </h3>
        
        <div className="grid gap-4 md:grid-cols-3">
          
          {/* Jugador */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-6">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-display font-600 text-white">Jugador Profesional</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  {user?.is_player 
                    ? "Ya estás registrado como jugador en la plataforma." 
                    : "No te has registrado como jugador profesional en la plataforma."}
                </p>
              </div>
            </div>
            {user?.is_player ? (
              <button 
                onClick={() => setShowPlayerModal(true)}
                className="mt-6 flex items-center gap-2 text-sm font-600 text-primary hover:text-primary-dark transition-colors text-left"
              >
                Ver Mis Datos <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <Link 
                href="/registro/alta-de-jugador" 
                className="mt-6 flex items-center gap-2 text-sm font-600 text-primary hover:text-primary-dark transition-colors"
              >
                Iniciar Registro <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {/* Equipo */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-6">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-muted-foreground">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-display font-600 text-white">Equipo Profesional</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  No has registrado ningún equipo en GMX Gaming.
                </p>
              </div>
            </div>
            <Link 
              href="/registro/alta-de-equipo" 
              className="mt-6 flex items-center gap-2 text-sm font-600 text-muted-foreground hover:text-white transition-colors"
            >
              Registrar Equipo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Contrato */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-6">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-muted-foreground">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-display font-600 text-white">Contratos</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  No has registrado ningún contrato activo.
                </p>
              </div>
            </div>
            <Link 
              href="#" 
              className="mt-6 flex items-center gap-2 text-sm font-600 text-muted-foreground hover:text-white transition-colors"
            >
              Registrar Contrato <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
          <div className="relative flex flex-col w-full max-w-lg max-h-[90vh] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex shrink-0 items-center justify-between border-b border-border p-6 bg-surface z-10">
              <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Editar Perfil
              </h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-muted-foreground hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body con Scroll */}
            <div data-lenis-prevent data-modal-scrollbody className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-6">
              
              {/* Fotos */}
              <div className="space-y-4">
                <label className="text-xs font-600 uppercase tracking-widest text-primary block">
                  Imágenes
                </label>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Foto de Perfil Edit */}
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground font-500 block">Foto de Perfil</span>
                    <button 
                      onClick={() => triggerUpload('profile', true)}
                      className="group relative h-24 w-24 overflow-hidden rounded-xl border-2 border-dashed border-border bg-background hover:border-primary transition-colors flex items-center justify-center"
                    >
                      {editForm.profilePhoto ? (
                        <>
                          <img src={editForm.profilePhoto} alt="Avatar Edit" className="h-full w-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                          <Upload className="absolute w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                          <Upload className="w-5 h-5" />
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Portada Edit */}
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground font-500 block">Portada</span>
                    <button 
                      onClick={() => triggerUpload('cover', true)}
                      className="group relative h-24 w-full overflow-hidden rounded-xl border-2 border-dashed border-border bg-background hover:border-primary transition-colors flex items-center justify-center"
                    >
                      {editForm.coverPhoto ? (
                        <>
                          <img src={editForm.coverPhoto} alt="Cover Edit" className="h-full w-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                          <Upload className="absolute w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                          <Upload className="w-5 h-5" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Text Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-600 uppercase tracking-widest text-primary block">
                    Nombre
                  </label>
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-600 uppercase tracking-widest text-primary block">
                    Biografía
                  </label>
                  <textarea 
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer Fijo */}
            <div className="flex shrink-0 justify-end gap-3 border-t border-border p-6 bg-surface z-10">
              <button 
                onClick={() => setIsEditing(false)}
                className="rounded-md border border-border bg-transparent px-4 py-2 text-sm font-600 text-muted-foreground hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <GmxButton onClick={handleSave}>
                Guardar Cambios
              </GmxButton>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 z-[1200] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-surface p-4 shadow-xl">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-600 text-white">Cambios Guardados</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-[250px]">
                Tus imágenes han sido enviadas al administrador para su aprobación y serán visibles pronto.
              </p>
            </div>
            <button 
              onClick={() => setShowNotification(false)}
              className="ml-4 rounded-full p-1 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Player Data Modal */}
      {showPlayerModal && profileData && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPlayerModal(false)} />
          <div className="relative flex flex-col w-full max-w-lg max-h-[90vh] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex shrink-0 items-center justify-between border-b border-border p-6 bg-surface z-10">
              <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-primary" />
                Datos de Jugador
              </h3>
              <button 
                onClick={() => setShowPlayerModal(false)}
                className="text-muted-foreground hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body con Scroll */}
            <div data-lenis-prevent data-modal-scrollbody className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-6">
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-500 text-muted-foreground uppercase tracking-widest mb-1">Nombre Real</p>
                  <p className="text-sm text-white font-600">{profileData.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-500 text-muted-foreground uppercase tracking-widest mb-1">Nickname</p>
                  <p className="text-sm text-white font-600">{profileData.nickname || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-500 text-muted-foreground uppercase tracking-widest mb-1">Discord</p>
                  <p className="text-sm text-white font-600">{profileData.discord_handle || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-500 text-muted-foreground uppercase tracking-widest mb-1">Aeropuerto más cercano</p>
                  <p className="text-sm text-white font-600">{profileData.closest_airport || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                <p className="text-xs font-600 uppercase tracking-widest text-primary">Estado</p>
                <div className="flex items-center gap-2">
                  <div className={cn("px-3 py-1 rounded-full text-xs font-600 uppercase", 
                    profileData.player_status === 'active' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                    profileData.player_status === 'rejected' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                    "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  )}>
                    {profileData.player_status === 'active' ? 'Aprobado' :
                     profileData.player_status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Fijo */}
            <div className="flex shrink-0 justify-end gap-3 border-t border-border p-6 bg-surface z-10">
              <GmxButton onClick={() => setShowPlayerModal(false)}>
                Cerrar
              </GmxButton>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
