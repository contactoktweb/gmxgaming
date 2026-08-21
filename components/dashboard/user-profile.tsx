'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  ArrowRight, 
  User, 
  X, 
  Upload, 
  Save, 
  Edit3, 
  Shield, 
  ShieldCheck, 
  UserCheck, 
  ScrollText, 
  Clock, 
  Calendar,
  Eye,
  Gamepad2,
  Globe,
  Share2
} from 'lucide-react'
import { cn, formatRoleTitle, formatRolesList, formatLocation } from '@/lib/utils'
import { GmxButton } from '@/components/gmx-button'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

interface UserProfileProps {
  onNavigateTab?: (tab: 'perfil' | 'equipos' | 'jugadores' | 'contratos') => void
}

export function UserProfile({ onNavigateTab }: UserProfileProps) {
  const { user } = useAuth()
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.avatar || null)
  const [name, setName] = useState(user?.name || 'Usuario')
  const [bio, setBio] = useState('Cuéntanos un poco sobre ti...')

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingPlayer, setIsEditingPlayer] = useState(false)
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [playerFotoFile, setPlayerFotoFile] = useState<File | null>(null)
  const supabase = createClient()
  
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    profilePhoto: null as string | null,
    imagesChanged: false
  })

  const [playerEditForm, setPlayerEditForm] = useState({
    name: '',
    nickname: '',
    discord_handle: '',
    closest_airport: '',
    bio: '',
    profilePhoto: null as string | null,
    game: 'Mobile Legends',
    game_id: '',
    server: '',
    country_account: '',
    social_ig: '',
    social_tiktok: '',
    social_yt: '',
    social_twitch: '',
    social_kick: '',
    social_x: '',
    social_fb: '',
    imagesChanged: false
  })

  // Live Database States
  const [profileData, setProfileData] = useState<any>(null)
  const [userTeam, setUserTeam] = useState<any>(null)
  const [activeContract, setActiveContract] = useState<any>(null)
  const [latestValidation, setLatestValidation] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)

  // Computed states
  const canEdit = profileData?.can_edit_profile || user?.role === 'admin'
  const isRequested = profileData?.edit_requested === true

  // Player verification states
  const isPlayer = profileData?.is_player === true
  const playerStatus = profileData?.player_status || 'none'
  const isPlayerApproved = isPlayer && (playerStatus === 'active' || playerStatus === 'approved')
  const isPlayerPending = isPlayer && (playerStatus === 'pending' || playerStatus === 'none' || !playerStatus)
  const isPlayerRejected = isPlayer && playerStatus === 'rejected'

  const hasRejectedModification = latestValidation?.type === 'modificacion' && latestValidation?.status === 'rejected' && !isRequested
  const isPlayerModificationPending = latestValidation?.type === 'modificacion' && latestValidation?.status === 'pending' && isRequested
  const rejectionReasonText = latestValidation?.details?.rejection_reason
  
  useEffect(() => {
    if (!user) return

    setName(user.name)
    setProfilePhoto(user.avatar || null)

    async function loadAllUserData() {
      setLoadingData(true)
      try {
        // 1. Fetch DB Profile (with player game info)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, player_game_info(*)')
          .eq('id', user.id)
          .single()

        if (profile) {
          setProfileData(profile)
          if (profile.name) setName(profile.name)
          if (profile.avatar_url || profile.avatar) setProfilePhoto(profile.avatar_url || profile.avatar)
        }

        // 2. Fetch latest validation for user
        const { data: validations } = await supabase
          .from('validations')
          .select('*')
          .or(`submitted_by.eq.${user.email || 'none'},submitted_by.eq.${user.name || 'none'},details->>user_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(1)

        if (validations && validations.length > 0) {
          setLatestValidation(validations[0])
        }

        // 3. Fetch Teams (Managed teams or Contracted teams)
        // 3a. Managed team
        const { data: managedTeams } = await supabase
          .from('teams')
          .select('*')
          .eq('manager_id', user.id)
          .order('created_at', { ascending: false })

        // 3b. Contracts (Teams playing for)
        const { data: contractsData } = await supabase
          .from('contracts')
          .select(`
            *,
            teams (id, name, tag, logo_url, country, status)
          `)
          .eq('player_id', user.id)
          .order('created_at', { ascending: false })

        // Determine active team
        if (managedTeams && managedTeams.length > 0) {
          setUserTeam({
            ...managedTeams[0],
            isManager: true
          })
        } else if (contractsData && contractsData.length > 0) {
          const active = contractsData.find((c: any) => 
            c.status === 'active' || c.status === 'activo' || c.status === 'pending_manager' || c.status === 'pendiente'
          ) || contractsData[0]

          if (active && active.teams) {
            setUserTeam({
              ...active.teams,
              isManager: false,
              contractStatus: active.status,
              contractRole: Array.isArray(active.roles) ? active.roles.join(', ') : active.roles
            })
          }
        }

        // Determine active contract
        if (contractsData && contractsData.length > 0) {
          const active = contractsData.find((c: any) => 
            c.status === 'active' || c.status === 'activo' || c.status === 'pending_manager' || c.status === 'pendiente'
          ) || contractsData[0]

          setActiveContract(active)
        }

      } catch (err) {
        console.error('Error fetching user dashboard data:', err)
      } finally {
        setLoadingData(false)
      }
    }

    loadAllUserData()
  }, [user])

  useEffect(() => {
    if (isEditing || isEditingPlayer || showPlayerModal) {
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
  }, [isEditing, isEditingPlayer, showPlayerModal])

  const openEdit = () => {
    setEditForm({
      name: profileData?.name || name || '',
      bio: profileData?.bio || bio || '',
      profilePhoto: profileData?.avatar_url || profilePhoto || null,
      imagesChanged: false
    })
    setFotoFile(null)
    setIsEditing(true)
  }

  const openEditPlayer = () => {
    const pendingDetails = (isRequested || hasRejectedModification) ? latestValidation?.details : null
    const gameInfo = profileData?.player_game_info?.[0] || {}

    setPlayerEditForm({
      name: pendingDetails?.name || profileData?.name || name || '',
      nickname: pendingDetails?.nickname || pendingDetails?.game_nickname || profileData?.nickname || profileData?.game_nickname || '',
      discord_handle: pendingDetails?.discord_handle || profileData?.discord_handle || '',
      closest_airport: pendingDetails?.closest_airport || profileData?.closest_airport || '',
      bio: pendingDetails?.bio || profileData?.bio || bio || '',
      profilePhoto: pendingDetails?.avatar_url || profileData?.avatar_url || profilePhoto || null,
      game: pendingDetails?.game || gameInfo.game || 'Mobile Legends',
      game_id: pendingDetails?.game_id || gameInfo.game_id || '',
      server: pendingDetails?.server || gameInfo.server || '',
      country_account: pendingDetails?.country_account || gameInfo.country_account || '',
      social_ig: pendingDetails?.social_ig || profileData?.social_ig || '',
      social_tiktok: pendingDetails?.social_tiktok || profileData?.social_tiktok || '',
      social_yt: pendingDetails?.social_yt || profileData?.social_yt || '',
      social_twitch: pendingDetails?.social_twitch || profileData?.social_twitch || '',
      social_kick: pendingDetails?.social_kick || profileData?.social_kick || '',
      social_x: pendingDetails?.social_x || profileData?.social_x || '',
      social_fb: pendingDetails?.social_fb || profileData?.social_fb || '',
      imagesChanged: false
    })
    setPlayerFotoFile(null)
    setIsEditingPlayer(true)
  }

  // Detect if personal profile fields have changed
  const currentBaseName = (profileData?.name || name || '').trim()
  const currentBaseBio = (profileData?.bio || bio || '').trim()
  const currentBasePhoto = profileData?.avatar_url || profilePhoto || null

  const hasChanges = 
    editForm.name.trim() !== currentBaseName ||
    editForm.bio.trim() !== currentBaseBio ||
    editForm.profilePhoto !== currentBasePhoto ||
    editForm.imagesChanged

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFotoFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setEditForm(prev => ({
        ...prev,
        profilePhoto: result,
        imagesChanged: true
      }))
    }
    reader.readAsDataURL(file)
  }

  // Guardar datos del Perfil Personal directamente (sin requerir aprobación de admin)
  const handleSave = async () => {
    if (!hasChanges) {
      toast.info('No hay cambios', {
        description: 'Realiza alguna modificación antes de guardar.'
      })
      return
    }

    if (!editForm.name.trim()) {
      toast.error('El nombre no puede estar vacío')
      return
    }

    setIsSubmitting(true)

    try {
      if (user) {
        let finalAvatarUrl = editForm.profilePhoto || profilePhoto

        if (fotoFile) {
          toast.loading('Subiendo imagen de perfil...', { id: 'user-avatar-upload' })
          const fileExt = fotoFile.name.split('.').pop()
          const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`
          const { error: uploadError, data } = await supabase.storage.from('avatars').upload(fileName, fotoFile)
          toast.dismiss('user-avatar-upload')

          if (!uploadError && data) {
            const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
            finalAvatarUrl = publicUrlData.publicUrl
          }
        }

        const { error } = await supabase.from('profiles').update({
          name: editForm.name.trim(),
          bio: editForm.bio.trim(),
          avatar_url: finalAvatarUrl
        }).eq('id', user.id)

        if (error) throw error

        setName(editForm.name.trim())
        setBio(editForm.bio.trim())
        if (finalAvatarUrl) setProfilePhoto(finalAvatarUrl)
        setProfileData((prev: any) => ({
          ...prev,
          name: editForm.name.trim(),
          bio: editForm.bio.trim(),
          avatar_url: finalAvatarUrl
        }))

        toast.success('Perfil Actualizado', {
          description: 'Los datos de tu perfil personal han sido guardados exitosamente.'
        })
      }

      setIsEditing(false)
      setFotoFile(null)
    } catch (err: any) {
      console.error('Error updating personal profile:', err)
      toast.error('Error al guardar', {
        description: err.message || 'No se pudieron procesar los cambios. Intenta nuevamente.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePlayerAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPlayerFotoFile(file)

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setPlayerEditForm(prev => ({
        ...prev,
        profilePhoto: result,
        imagesChanged: true
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleSavePlayer = async () => {
    if (!user || !profileData) return
    setIsSubmitting(true)

    try {
      const gameInfo = profileData.player_game_info?.[0] || {}
      let avatarUrl = playerEditForm.profilePhoto || profileData.avatar_url || profilePhoto

      // Si subió un archivo nuevo, subirlo al storage bucket de Supabase
      if (playerFotoFile) {
        try {
          const fileExt = playerFotoFile.name.split('.').pop()
          const fileName = `${Date.now()}_player_${user.id}.${fileExt}`
          const { error: uploadError, data } = await supabase.storage.from('avatars').upload(fileName, playerFotoFile)
          if (!uploadError && data) {
            const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
            avatarUrl = publicUrlData.publicUrl
          }
        } catch (uploadErr) {
          console.warn('Could not upload avatar file, using existing URL:', uploadErr)
        }
      }

      const payloadDetails = {
        user_id: user.id,
        name: playerEditForm.name.trim(),
        nickname: playerEditForm.nickname.trim(),
        game_nickname: playerEditForm.nickname.trim(),
        discord_handle: playerEditForm.discord_handle.trim(),
        closest_airport: playerEditForm.closest_airport.trim(),
        bio: playerEditForm.bio.trim(),
        avatar_url: avatarUrl,
        game: playerEditForm.game,
        game_id: playerEditForm.game_id.trim(),
        server: playerEditForm.server.trim(),
        country_account: playerEditForm.country_account.trim(),
        social_ig: playerEditForm.social_ig.trim(),
        social_tiktok: playerEditForm.social_tiktok.trim(),
        social_yt: playerEditForm.social_yt.trim(),
        social_twitch: playerEditForm.social_twitch.trim(),
        social_kick: playerEditForm.social_kick.trim(),
        social_x: playerEditForm.social_x.trim(),
        social_fb: playerEditForm.social_fb.trim(),

        // Valores originales para comparación en el panel de administración
        original_name: profileData.name || '',
        original_nickname: profileData.nickname || profileData.game_nickname || '',
        original_game_nickname: profileData.game_nickname || profileData.nickname || '',
        original_discord_handle: profileData.discord_handle || '',
        original_closest_airport: profileData.closest_airport || '',
        original_bio: profileData.bio || '',
        original_avatar: profileData.avatar_url || profilePhoto || '',
        original_game: gameInfo.game || 'Mobile Legends',
        original_game_id: gameInfo.game_id || '',
        original_server: gameInfo.server || '',
        original_country_account: gameInfo.country_account || '',
        original_social_ig: profileData.social_ig || '',
        original_social_tiktok: profileData.social_tiktok || '',
        original_social_yt: profileData.social_yt || '',
        original_social_twitch: profileData.social_twitch || '',
        original_social_kick: profileData.social_kick || '',
        original_social_x: profileData.social_x || '',
        original_social_fb: profileData.social_fb || ''
      }

      let valError = null

      if (latestValidation?.id && isRequested) {
        // Actualizar solicitud pendiente existente
        const { error } = await supabase.from('validations').update({
          target_name: `${profileData.nickname || profileData.name || 'Jugador'} ➔ ${playerEditForm.nickname || playerEditForm.name} (Modificación de Jugador)`,
          status: 'pending',
          details: payloadDetails
        }).eq('id', latestValidation.id)
        valError = error
      } else {
        // Eliminar solicitudes anteriores procesadas
        await supabase
          .from('validations')
          .delete()
          .eq('type', 'modificacion')
          .in('status', ['approved', 'rejected'])
          .filter('details->>user_id', 'eq', user.id)

        // Insertar nueva solicitud
        const { error } = await supabase.from('validations').insert({
          type: 'modificacion',
          target_name: `${profileData.nickname || profileData.name || 'Jugador'} ➔ ${playerEditForm.nickname || playerEditForm.name} (Modificación de Jugador)`,
          submitted_by: user.email || user.name || user.id,
          status: 'pending',
          details: payloadDetails
        })
        valError = error
      }

      const { error: profError } = await supabase.from('profiles').update({
        edit_requested: true
      }).eq('id', user.id)

      if (valError || profError) throw (valError || profError)

      setProfileData((prev: any) => ({ ...prev, edit_requested: true }))
      setLatestValidation({
        id: latestValidation?.id,
        type: 'modificacion',
        status: 'pending',
        details: payloadDetails
      })

      toast.success('Solicitud de Modificación Enviada', {
        description: 'Tus cambios han sido enviados al administrador para su revisión y aprobación.'
      })

      setIsEditingPlayer(false)
    } catch (err: any) {
      console.error('Error submitting player modification:', err)
      toast.error('Error al enviar la solicitud', {
        description: err.message || 'Inténtalo de nuevo más tarde.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Profile Header Card (Avatar + Info + Actions - Sin Banner) */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            {/* Avatar */}
            <div className="group relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-border bg-background shadow-md">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              
              <button 
                onClick={openEdit}
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100 cursor-pointer"
                title="Cambiar foto de perfil"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-2xl sm:text-3xl font-700 text-white tracking-tight">{name}</h2>
                
                {/* Personal Profile Badge */}
                {user?.role === 'admin' ? (
                  <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-600 text-primary border border-primary/20 uppercase tracking-wider">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Administrador
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-600 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                    <UserCheck className="h-3.5 w-3.5" />
                    Perfil Activo
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
                {bio}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="shrink-0 w-full sm:w-auto">
            <button 
              onClick={openEdit}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-600 uppercase tracking-wider transition-all clip-corner bg-white/5 hover:bg-primary border border-white/10 text-white hover:border-primary cursor-pointer"
            >
              <Edit3 className="h-4 w-4" />
              Editar Perfil
            </button>
          </div>
        </div>
      </div>

      {/* Rejection Alert Banner with Mandatory Administrator Reason */}
      {((hasRejectedModification || isPlayerRejected) && rejectionReasonText) && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 shrink-0 mt-0.5 border border-red-500/30">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-700 uppercase tracking-wider text-red-400">
                {hasRejectedModification 
                  ? "Tu solicitud de modificación de perfil fue rechazada" 
                  : "Tu registro como Jugador Profesional fue rechazado"}
              </h4>
              <p className="text-sm text-white/90 leading-relaxed">
                <span className="font-700 text-red-300">Motivo indicado por la administración: </span>
                {rejectionReasonText}
              </p>
            </div>
          </div>
          {hasRejectedModification ? (
            <button 
              onClick={openEdit}
              className="shrink-0 px-4 py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-700 uppercase tracking-wider transition-colors"
            >
              Editar y Reenviar
            </button>
          ) : (
            <Link 
              href="/registro/alta-de-jugador"
              className="shrink-0 px-4 py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-700 uppercase tracking-wider transition-colors"
            >
              Reenviar Registro
            </Link>
          )}
        </div>
      )}

      {/* Registrations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display text-xl font-600 uppercase tracking-tight text-white">
            Mis Registros
          </h3>
          <span className="text-xs text-muted-foreground">Estado en tiempo real</span>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          
          {/* 1. JUGADOR PROFESIONAL */}
          <div className={cn(
            "flex flex-col justify-between rounded-xl border p-6 transition-all duration-300",
            isPlayerApproved ? "border-emerald-500/30 bg-emerald-500/[0.03] hover:border-emerald-500/50" :
            isPlayerPending ? "border-amber-500/30 bg-amber-500/[0.03] hover:border-amber-500/50" :
            isPlayerRejected ? "border-red-500/30 bg-red-500/[0.03]" :
            "border-border bg-surface hover:border-white/20"
          )}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl",
                  isPlayerApproved ? "bg-emerald-500/10 text-emerald-400" :
                  isPlayerPending ? "bg-amber-500/10 text-amber-400" :
                  isPlayerRejected ? "bg-red-500/10 text-red-400" :
                  "bg-white/5 text-muted-foreground"
                )}>
                  {isPlayerApproved ? <UserCheck className="h-6 w-6" /> :
                   isPlayerPending ? <ShieldAlert className="h-6 w-6" /> :
                   isPlayerRejected ? <AlertCircle className="h-6 w-6" /> :
                   <User className="h-6 w-6" />}
                </div>

                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-700 uppercase tracking-wider border",
                  isPlayerApproved ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  isPlayerPending ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  isPlayerRejected ? "bg-red-500/10 text-red-400 border-red-500/20" :
                  "bg-white/5 text-muted-foreground border-border"
                )}>
                  {isPlayerApproved ? "Aprobado" :
                   isPlayerPending ? "En Revisión" :
                   isPlayerRejected ? "Rechazado" :
                   "No Registrado"}
                </span>
              </div>

              <div>
                <h4 className="font-display font-700 text-lg text-white">Jugador Profesional</h4>
                {isPlayerApproved && (
                  <p className="text-xs font-600 text-emerald-400 uppercase tracking-wider mt-0.5">
                    IGN: {profileData?.nickname || profileData?.game_nickname || profileData?.name}
                  </p>
                )}
                {isPlayerPending && (
                  <p className="text-xs font-600 text-amber-400 uppercase tracking-wider mt-0.5">
                    Postulado: {profileData?.nickname || profileData?.name}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {isPlayerApproved 
                    ? "Tu perfil como jugador profesional está verificado y activo en GMX Gaming." 
                    : isPlayerPending 
                    ? "Tu solicitud está en proceso de revisión por los administradores."
                    : isPlayerRejected
                    ? "Tu solicitud fue rechazada. Puedes volver a enviar tus datos corregidos."
                    : "No te has registrado como jugador profesional en la plataforma."}
                </p>

                {/* Banner de Estado de Modificación Pendiente o Rechazada */}
                {isPlayer && isPlayerModificationPending && (
                  <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5 text-xs text-amber-300">
                    <Clock className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-700 text-amber-400 block">Modificación en Revisión</span>
                      <span className="text-[11px] text-amber-300/90 leading-snug">
                        Enviaste cambios a tus datos de jugador. Están pendientes de aprobación por el administrador.
                      </span>
                    </div>
                  </div>
                )}

                {isPlayer && hasRejectedModification && (
                  <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex items-start gap-2.5 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                    <div>
                      <span className="font-700 text-red-400 block">Modificación Rechazada</span>
                      <span className="text-[11px] text-red-300/90 leading-snug">
                        {rejectionReasonText ? `Motivo: ${rejectionReasonText}` : "Tu solicitud de modificación fue rechazada por el administrador. Puedes corregir los datos y reenviarla."}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6">
              {isPlayerApproved || isPlayerPending ? (
                <div className="flex flex-wrap items-center gap-2.5">
                  <button 
                    onClick={openEditPlayer}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-primary-dark text-white px-3.5 py-2 text-xs font-700 uppercase tracking-wider transition-all shadow-md shadow-primary/20 cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    {isPlayerModificationPending ? "Editar Solicitud" : "Modificar Perfil"}
                  </button>
                  <button 
                    onClick={() => setShowPlayerModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white px-3 py-2 text-xs font-600 uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    Ver Ficha
                  </button>
                </div>
              ) : isPlayerRejected ? (
                <Link 
                  href="/registro/alta-de-jugador" 
                  className="flex items-center gap-2 text-sm font-600 text-red-400 hover:text-red-300 transition-colors"
                >
                  Reenviar Solicitud <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link 
                  href="/registro/alta-de-jugador" 
                  className="flex items-center gap-2 text-sm font-600 text-primary hover:text-primary-dark transition-colors"
                >
                  Iniciar Registro <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          {/* 2. EQUIPO PROFESIONAL */}
          <div className={cn(
            "flex flex-col justify-between rounded-xl border p-6 transition-all duration-300",
            userTeam ? "border-primary/30 bg-primary/[0.03] hover:border-primary/50" : "border-border bg-surface hover:border-white/20"
          )}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden",
                  userTeam ? "bg-primary/10 text-primary border border-primary/20" : "bg-white/5 text-muted-foreground"
                )}>
                  {userTeam?.logo_url ? (
                    <img src={userTeam.logo_url} alt={userTeam.name} className="h-full w-full object-cover" />
                  ) : userTeam ? (
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  ) : (
                    <Shield className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {userTeam && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-700 uppercase tracking-widest bg-primary/20 text-primary border border-primary/30">
                      {userTeam.isManager ? "Manager" : "Jugador"}
                    </span>
                  )}
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-700 uppercase tracking-wider border",
                    userTeam?.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    userTeam ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    "bg-white/5 text-muted-foreground border-border"
                  )}>
                    {userTeam ? (userTeam.status === 'active' ? "Activo" : "Pendiente") : "Sin Equipo"}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-display font-700 text-lg text-white">
                  {userTeam ? userTeam.name : "Equipo Profesional"}
                </h4>
                {userTeam && (
                  <p className="text-xs font-600 text-muted-foreground uppercase tracking-wider mt-0.5">
                    {userTeam.tag ? `#${userTeam.tag.toUpperCase()} • ` : ''}{userTeam.country || 'eSports'}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {userTeam 
                    ? `Actualmente formas parte de ${userTeam.name} como ${userTeam.isManager ? 'Manager del equipo' : 'Jugador'}.` 
                    : "No has registrado ni perteneces a ningún equipo profesional en GMX Gaming."}
                </p>
              </div>
            </div>

            <div className="pt-6">
              {userTeam ? (
                <button 
                  onClick={() => onNavigateTab ? onNavigateTab(userTeam.isManager ? 'jugadores' : 'equipos') : null}
                  className="flex items-center gap-2 text-sm font-600 text-primary hover:text-primary-dark transition-colors text-left"
                >
                  {userTeam.isManager ? "Gestionar Jugadores & Contratos" : "Ver Mi Equipo"} <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <Link 
                  href="/registro/alta-de-equipo" 
                  className="flex items-center gap-2 text-sm font-600 text-muted-foreground hover:text-white transition-colors"
                >
                  Registrar Equipo <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          {/* 3. CONTRATOS */}
          <div className={cn(
            "flex flex-col justify-between rounded-xl border p-6 transition-all duration-300",
            activeContract ? "border-purple-500/30 bg-purple-500/[0.03] hover:border-purple-500/50" : "border-border bg-surface hover:border-white/20"
          )}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl",
                  activeContract ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-white/5 text-muted-foreground"
                )}>
                  <ScrollText className="h-6 w-6" />
                </div>

                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-700 uppercase tracking-wider border",
                  (activeContract?.status === 'active' || activeContract?.status === 'activo') ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  activeContract ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-white/5 text-muted-foreground border-border"
                )}>
                  {activeContract ? ((activeContract.status === 'active' || activeContract.status === 'activo') ? "Activo" : "Pendiente") : "Sin Contratos"}
                </span>
              </div>

              <div>
                <h4 className="font-display font-700 text-lg text-white">
                  {activeContract?.teams?.name ? `Contrato: ${activeContract.teams.name}` : "Contratos"}
                </h4>
                {activeContract && (
                  <p className="text-xs font-600 text-purple-400 uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {activeContract.end_date ? `Vence: ${new Date(activeContract.end_date).toLocaleDateString()}` : 'Contrato Vigente'}
                  </p>
                )}
                {activeContract ? (
                  <div className="mt-2 space-y-1.5">
                    <span className="text-xs text-muted-foreground block font-500">Roles Asignados:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(activeContract.roles) ? (
                        activeContract.roles.map((r: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-600"
                          >
                            {formatRoleTitle(r)}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-600">
                          {formatRoleTitle(activeContract.roles || 'Jugador')}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    No tienes ningún contrato activo registrado actualmente.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-6">
              {activeContract ? (
                <button 
                  onClick={() => onNavigateTab ? onNavigateTab('contratos') : null}
                  className="flex items-center gap-2 text-sm font-600 text-purple-400 hover:text-purple-300 transition-colors text-left"
                >
                  Ver Mis Contratos <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <Link 
                  href="/registro/alta-de-contrato" 
                  className="flex items-center gap-2 text-sm font-600 text-muted-foreground hover:text-white transition-colors"
                >
                  Registrar Contrato <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
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
              <div>
                <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Editar Perfil Personal
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Actualiza el nombre, foto de perfil y biografía de tu cuenta.
                </p>
              </div>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-muted-foreground hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body con Scroll */}
            <div data-lenis-prevent data-modal-scrollbody className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-6">
              {/* Foto de Perfil */}
              <div className="space-y-3">
                <label className="text-xs font-600 uppercase tracking-widest text-primary block">
                  Foto de Perfil
                </label>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />

                <div className="flex items-center gap-5">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-border bg-background shadow-inner">
                    {editForm.profilePhoto ? (
                      <img src={editForm.profilePhoto} alt="Avatar Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-surface">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-xs font-600 uppercase tracking-wider text-white transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-primary" />
                      Subir Imagen
                    </button>
                    <p className="text-[11px] text-muted-foreground">
                      Formatos recomendados: JPG, PNG o WebP.
                    </p>
                  </div>
                </div>
              </div>

              {/* Text Fields */}
              <div className="space-y-4 pt-2 border-t border-border/50">
                <div className="space-y-2">
                  <label className="text-xs font-600 uppercase tracking-widest text-primary block">
                    Nombre
                  </label>
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Tu nombre completo"
                    className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-600 uppercase tracking-widest text-primary block">
                    Descripción / Biografía
                  </label>
                  <textarea 
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    placeholder="Cuéntanos sobre tu trayectoria o rol en eSports..."
                    className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer Fijo */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border p-6 bg-surface z-10">
              <span className="text-xs text-muted-foreground">
                {!hasChanges ? "No has realizado cambios" : "Cambios pendientes por guardar"}
              </span>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="rounded-md border border-border bg-transparent px-4 py-2 text-sm font-600 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSubmitting}
                  className={cn(
                    "group relative inline-flex items-center justify-center gap-2 overflow-hidden px-6 py-2.5 font-display text-[13px] font-600 uppercase tracking-[0.14em] text-white transition-all duration-300 clip-corner",
                    hasChanges && !isSubmitting
                      ? "bg-primary hover:bg-primary-dark cursor-pointer shadow-lg shadow-primary/20"
                      : "bg-white/10 text-white/40 cursor-not-allowed opacity-60"
                  )}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                  </span>
                </button>
              </div>
            </div>
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
                  <p className="text-xs font-500 text-muted-foreground uppercase tracking-widest mb-1">Nickname (IGN)</p>
                  <p className="text-sm text-white font-600">{profileData.nickname || profileData.game_nickname || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-500 text-muted-foreground uppercase tracking-widest mb-1">Discord</p>
                  <p className="text-sm text-white font-600">{profileData.discord_handle || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-500 text-muted-foreground uppercase tracking-widest mb-1">Ubicación / País</p>
                  <p className="text-sm text-white font-600">{formatLocation(profileData.closest_airport)}</p>
                </div>

                {profileData.player_game_info && profileData.player_game_info.length > 0 && (
                  <div className="border-t border-border pt-4 space-y-3">
                    <p className="text-xs font-600 uppercase tracking-widest text-primary">Datos del Juego ({profileData.player_game_info[0].game})</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-lg bg-background p-3 border border-border">
                        <span className="text-muted-foreground block mb-1">Game ID</span>
                        <span className="text-white font-600">{profileData.player_game_info[0].game_id || 'N/A'}</span>
                      </div>
                      <div className="rounded-lg bg-background p-3 border border-border">
                        <span className="text-muted-foreground block mb-1">Servidor</span>
                        <span className="text-white font-600">{profileData.player_game_info[0].server || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                <p className="text-xs font-600 uppercase tracking-widest text-primary">Estado de Verificación</p>
                <div className="flex items-center gap-2">
                  <div className={cn("px-3 py-1 rounded-full text-xs font-600 uppercase", 
                    (profileData.player_status === 'active' || profileData.player_status === 'approved') ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                    profileData.player_status === 'rejected' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                    "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  )}>
                    {(profileData.player_status === 'active' || profileData.player_status === 'approved') ? '✓ Aprobado' :
                     profileData.player_status === 'rejected' ? '✕ Rechazado' : '⏳ Pendiente de Aprobación'}
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

      {/* Edit Player Profile Modal (Requiere Aprobación de Administrador) */}
      {isEditingPlayer && profileData && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditingPlayer(false)} />
          <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex shrink-0 items-center justify-between border-b border-border p-6 bg-surface z-10">
              <div>
                <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                  {isPlayerModificationPending ? "Modificar Solicitud de Jugador" : "Modificar Perfil de Jugador"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Todos los cambios deben ser aprobados por un administrador antes de publicarse.
                </p>
              </div>
              <button 
                onClick={() => setIsEditingPlayer(false)}
                className="text-muted-foreground hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body con Scroll */}
            <div data-lenis-prevent data-modal-scrollbody className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-6">
              
              {/* Info Banner de Aprobación */}
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 flex items-start gap-3 text-xs text-primary-light">
                <ShieldAlert className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Aprobación Obligatoria:</strong> Al guardar, se enviará una solicitud al panel de administración. Tus datos públicos actuales se mantendrán intactos hasta que el administrador valide y apruebe tu actualización.
                </span>
              </div>

              {/* SECCIÓN 1: FOTO & DATOS PERSONALES */}
              <div className="space-y-4">
                <h4 className="text-xs font-700 uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border/50 pb-2">
                  <User className="w-4 h-4" />
                  1. Identidad eSports & Fotografía
                </h4>

                {/* Subir Foto de Perfil */}
                <div className="flex items-center gap-5">
                  <input 
                    type="file" 
                    ref={playerFileInputRef} 
                    onChange={handlePlayerAvatarFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />

                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-border bg-background shadow-inner">
                    {playerEditForm.profilePhoto ? (
                      <img src={playerEditForm.profilePhoto} alt="Player Avatar Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-surface">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => playerFileInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-xs font-600 uppercase tracking-wider text-white transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-primary" />
                      Cambiar Foto de Jugador
                    </button>
                    <p className="text-[11px] text-muted-foreground">
                      Formatos recomendados: JPG, PNG o WebP.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-white block">
                      Nombre Real <span className="text-red-400">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={playerEditForm.name}
                      onChange={(e) => setPlayerEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Tu nombre completo"
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-white block">
                      Nickname / IGN <span className="text-red-400">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={playerEditForm.nickname}
                      onChange={(e) => setPlayerEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                      placeholder="Tu apodo o tag competitivo"
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-white block">
                      Usuario de Discord
                    </label>
                    <input 
                      type="text" 
                      value={playerEditForm.discord_handle}
                      onChange={(e) => setPlayerEditForm(prev => ({ ...prev, discord_handle: e.target.value }))}
                      placeholder="usuario#0000 o @usuario"
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-white block">
                      País / Aeropuerto más cercano
                    </label>
                    <input 
                      type="text" 
                      value={playerEditForm.closest_airport}
                      onChange={(e) => setPlayerEditForm(prev => ({ ...prev, closest_airport: e.target.value }))}
                      placeholder="Ej: México (MEX), Colombia (BOG)"
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-600 uppercase tracking-wider text-white block">
                    Biografía / Trayectoria eSports
                  </label>
                  <textarea 
                    value={playerEditForm.bio}
                    onChange={(e) => setPlayerEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    placeholder="Cuéntanos tus logros, experiencia en torneos, rol preferido, etc..."
                    className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"
                  />
                </div>
              </div>

              {/* SECCIÓN 2: DATOS DEL JUEGO COMPETITIVO */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-700 uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border/50 pb-2">
                  <Gamepad2 className="w-4 h-4" />
                  2. Datos del Juego Competitivo
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-white block">
                      Juego Principal
                    </label>
                    <select
                      value={playerEditForm.game}
                      onChange={(e) => setPlayerEditForm(prev => ({ ...prev, game: e.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    >
                      <option value="Mobile Legends">Mobile Legends: Bang Bang</option>
                      <option value="Honor of Kings">Honor of Kings</option>
                      <option value="League of Legends">League of Legends</option>
                      <option value="Dota 2">Dota 2</option>
                      <option value="Valorant">Valorant</option>
                      <option value="Free Fire">Free Fire</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-white block">
                      ID de Jugador (Game ID)
                    </label>
                    <input 
                      type="text" 
                      value={playerEditForm.game_id}
                      onChange={(e) => setPlayerEditForm(prev => ({ ...prev, game_id: e.target.value }))}
                      placeholder="Ej: 123456789"
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-white block">
                      Servidor / Zona
                    </label>
                    <input 
                      type="text" 
                      value={playerEditForm.server}
                      onChange={(e) => setPlayerEditForm(prev => ({ ...prev, server: e.target.value }))}
                      placeholder="Ej: 1234"
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-white block">
                      País de la Cuenta
                    </label>
                    <input 
                      type="text" 
                      value={playerEditForm.country_account}
                      onChange={(e) => setPlayerEditForm(prev => ({ ...prev, country_account: e.target.value }))}
                      placeholder="Ej: México, Colombia, Argentina"
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: REDES SOCIALES */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-700 uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border/50 pb-2">
                  <Share2 className="w-4 h-4" />
                  3. Redes Sociales eSports (Opcional)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-muted-foreground block">
                      Instagram
                    </label>
                    <input 
                      type="text" 
                      value={playerEditForm.social_ig}
                      onChange={(e) => setPlayerEditForm(prev => ({ ...prev, social_ig: e.target.value }))}
                      placeholder="@tu_usuario"
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-muted-foreground block">
                      TikTok
                    </label>
                    <input 
                      type="text" 
                      value={playerEditForm.social_tiktok}
                      onChange={(e) => setPlayerEditForm(prev => ({ ...prev, social_tiktok: e.target.value }))}
                      placeholder="@tu_usuario"
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-muted-foreground block">
                      YouTube
                    </label>
                    <input 
                      type="text" 
                      value={playerEditForm.social_yt}
                      onChange={(e) => setPlayerEditForm(prev => ({ ...prev, social_yt: e.target.value }))}
                      placeholder="Canal o URL"
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-muted-foreground block">
                      Twitch
                    </label>
                    <input 
                      type="text" 
                      value={playerEditForm.social_twitch}
                      onChange={(e) => setPlayerEditForm(prev => ({ ...prev, social_twitch: e.target.value }))}
                      placeholder="twitch.tv/tu_canal"
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-muted-foreground block">
                      Kick
                    </label>
                    <input 
                      type="text" 
                      value={playerEditForm.social_kick}
                      onChange={(e) => setPlayerEditForm(prev => ({ ...prev, social_kick: e.target.value }))}
                      placeholder="kick.com/tu_canal"
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-muted-foreground block">
                      X (Twitter)
                    </label>
                    <input 
                      type="text" 
                      value={playerEditForm.social_x}
                      onChange={(e) => setPlayerEditForm(prev => ({ ...prev, social_x: e.target.value }))}
                      placeholder="@tu_usuario"
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Fijo */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border p-6 bg-surface z-10">
              <span className="text-xs text-muted-foreground">
                Se enviará para revisión del Staff
              </span>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsEditingPlayer(false)}
                  className="rounded-md border border-border bg-transparent px-4 py-2 text-sm font-600 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePlayer}
                  disabled={isSubmitting || !playerEditForm.name.trim() || !playerEditForm.nickname.trim()}
                  className={cn(
                    "group relative inline-flex items-center justify-center gap-2 overflow-hidden px-6 py-2.5 font-display text-[13px] font-600 uppercase tracking-[0.14em] text-white transition-all duration-300 clip-corner",
                    !isSubmitting && playerEditForm.name.trim() && playerEditForm.nickname.trim()
                      ? "bg-primary hover:bg-primary-dark cursor-pointer shadow-lg shadow-primary/20"
                      : "bg-white/10 text-white/40 cursor-not-allowed opacity-60"
                  )}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {isSubmitting ? "Enviando..." : isPlayerModificationPending ? "Actualizar Solicitud" : "Solicitar Modificación"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
