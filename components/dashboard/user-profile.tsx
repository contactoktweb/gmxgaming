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
  Share2,
  KeyRound,
  Lock,
  EyeOff,
  Mail,
  Check,
  Loader2
} from 'lucide-react'
import { cn, formatRoleTitle, formatRolesList, formatNickname, formatPersonName, extractCountry, extractAvatarFromDetails } from '@/lib/utils'
import { compressImage, IMAGE_PRESETS, SUPABASE_STORAGE_CACHE_OPTIONS } from '@/lib/image-compression'
import { GmxButton } from '@/components/gmx-button'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/language-context'

interface UserProfileProps {
  onNavigateTab?: (tab: 'perfil' | 'equipos' | 'jugadores' | 'contratos') => void
}

export function UserProfile({ onNavigateTab }: UserProfileProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const initialUserAvatar = (user?.avatar && !user.avatar.includes('placehold.co')) ? user.avatar : null
  const [profilePhoto, setProfilePhoto] = useState<string | null>(initialUserAvatar)
  const [name, setName] = useState(user?.name || 'Usuario')
  const [bio, setBio] = useState('')

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingPlayer, setIsEditingPlayer] = useState(false)
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const playerFileInputRef = useRef<HTMLInputElement>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [playerFotoFile, setPlayerFotoFile] = useState<File | null>(null)
  const supabase = createClient()
  
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    profilePhoto: null as string | null,
    imagesChanged: false,
    discord_handle: '',
    country: '',
    phone: '',
    social_ig: '',
    social_tiktok: '',
    social_yt: '',
    social_twitch: '',
    social_kick: '',
    social_x: '',
    social_fb: '',
  })

  const [playerEditForm, setPlayerEditForm] = useState({
    name: '',
    nickname: '',
    discord_handle: '',
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
  const [userContracts, setUserContracts] = useState<any[]>([])
  const [latestValidation, setLatestValidation] = useState<any>(null)
  const [userValidations, setUserValidations] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Computed states
  const canEdit = profileData?.can_edit_profile || user?.role === 'admin'
  const isRequested = profileData?.edit_requested === true

  // Validaciones categorizadas por tipo
  const playerVal = userValidations.find((v: any) => v.type === 'jugador')
  const teamVal = userValidations.find((v: any) => v.type === 'equipo')
  const contractVal = userValidations.find((v: any) => v.type === 'contrato' || v.type === 'baja_contrato')
  const modVal = userValidations.find((v: any) => v.type === 'modificacion')

  // 1. ESTADO DE JUGADOR PROFESIONAL
  const isPlayer = profileData?.is_player === true || user?.is_player === true
  const playerStatus = (profileData?.player_status || user?.player_status || 'none').toLowerCase()
  const isPlayerApproved = (isPlayer && (playerStatus === 'active' || playerStatus === 'approved')) || (playerVal?.status === 'active' || playerVal?.status === 'approved')
  const isPlayerPending = !isPlayerApproved && (
    playerStatus === 'pending' || 
    playerVal?.status === 'pending' || 
    (isPlayer && playerStatus !== 'rejected')
  )
  const isPlayerRejected = !isPlayerApproved && !isPlayerPending && (
    playerStatus === 'rejected' || 
    playerVal?.status === 'rejected'
  )
  const playerRejectionReason = playerVal?.details?.rejection_reason || playerVal?.rejection_reason || 'Tu registro como jugador profesional no cumplió con los requerimientos necesarios.'

  // 2. ESTADO DE EQUIPO PROFESIONAL
  const isTeamApproved = Boolean(userTeam && (userTeam.status === 'active' || userTeam.status === 'activo'))
  const isTeamPending = !isTeamApproved && Boolean(
    (userTeam && (userTeam.status === 'pending' || userTeam.status === 'pendiente')) || 
    teamVal?.status === 'pending'
  )
  const isTeamRejected = !isTeamApproved && !isTeamPending && Boolean(
    (userTeam && userTeam.status === 'rejected') || 
    teamVal?.status === 'rejected'
  )
  const teamRejectionReason = teamVal?.details?.rejection_reason || teamVal?.rejection_reason || 'El registro del equipo fue rechazado por la administración.'

  // 3. ESTADO DE CONTRATOS
  const isContractApproved = Boolean(activeContract && (activeContract.status === 'active' || activeContract.status === 'activo'))
  const isContractPending = !isContractApproved && Boolean(
    (activeContract && (activeContract.status === 'pending' || activeContract.status === 'pendiente' || activeContract.status === 'pending_manager' || activeContract.status === 'pending_player_release' || activeContract.status === 'pending_manager_release')) || 
    contractVal?.status === 'pending'
  )
  const isContractRejected = !isContractApproved && !isContractPending && Boolean(
    contractVal?.status === 'rejected' ||
    userContracts.some((c: any) => c.status === 'rejected')
  )
  const contractRejectionReason = contractVal?.details?.rejection_reason || contractVal?.rejection_reason || 'La solicitud de contrato fue rechazada por la administración.'

  // 4. MODIFICACIÓN DE PERFIL
  const hasRejectedModification = modVal?.status === 'rejected' && !isRequested && modVal?.status !== 'pending'
  const isPlayerModificationPending = modVal?.status === 'pending' || (isRequested && modVal?.status !== 'approved' && modVal?.status !== 'rejected')
  const modRejectionReason = modVal?.rejection_reason || modVal?.details?.rejection_reason
  const rejectionReasonText = modRejectionReason || playerRejectionReason
  
  useEffect(() => {
    if (!user) return
    const currentUser = user

    setName(currentUser.name)
    const initialCurrentAvatar = (currentUser.avatar && !currentUser.avatar.includes('placehold.co')) ? currentUser.avatar : null
    setProfilePhoto(initialCurrentAvatar)

    async function loadAllUserData() {
      setLoadingData(true)
      try {
        // 1. Fetch DB Profile (with player game info)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, player_game_info(*)')
          .eq('id', currentUser.id)
          .single()

        if (profile) {
          setProfileData(profile)
          if (profile.name) setName(profile.name)
          const validProfAvatar = (profile.avatar_url && !profile.avatar_url.includes('placehold.co'))
            ? profile.avatar_url
            : (profile.avatar && !profile.avatar.includes('placehold.co'))
            ? profile.avatar
            : null
          if (validProfAvatar) setProfilePhoto(validProfAvatar)
        }

        // 2. Fetch all recent validations for user
        const { data: validations } = await supabase
          .from('validations')
          .select('*')
          .or(`submitted_by.eq.${currentUser.id},submitted_by.eq.${currentUser.email || 'none'},submitted_by.eq.${currentUser.name || 'none'},details->>user_id.eq.${currentUser.id},details->>player_id.eq.${currentUser.id},details->>manager_id.eq.${currentUser.id}`)
          .order('created_at', { ascending: false })
          .limit(30)

        if (validations) {
          setUserValidations(validations)
          if (validations.length > 0) {
            setLatestValidation(validations[0])
          } else {
            setLatestValidation(null)
          }

          const pVal = validations.find((v: any) => v.type === 'jugador')
          const modValRecent = validations.find((v: any) => v.type === 'modificacion')
          const pValAvatar = pVal ? extractAvatarFromDetails(pVal.details) : null

          if (pVal) {
            // Si la validación de jugador está aprobada y el perfil local o en BD no está sincronizado
            if ((pVal.status === 'active' || pVal.status === 'approved') && (!profile?.is_player || profile?.player_status !== 'active')) {
              setProfileData((prev: any) => prev ? ({ ...prev, is_player: true, player_status: 'active' }) : prev)
              supabase.from('profiles').update({ is_player: true, player_status: 'active' }).eq('id', currentUser.id)
            }

            // Si el perfil no tiene avatar válido pero la validación sí tenía foto subida
            if (pValAvatar && (!profile?.avatar_url || profile.avatar_url.includes('placehold.co') || !profilePhoto || profilePhoto.includes('placehold.co'))) {
              setProfilePhoto(pValAvatar)
              supabase.from('profiles').update({ avatar_url: pValAvatar, avatar: pValAvatar }).eq('id', currentUser.id)
            }
          }

          // Si hay una modificación que fue rechazada o está pendiente, DEBE mostrarse la imagen antigua
          if (modValRecent) {
            const proposedAvatar = modValRecent.details?.avatar_url
            const originalOldAvatar = modValRecent.details?.original_avatar || pValAvatar

            if ((modValRecent.status === 'rejected' || modValRecent.status === 'pending') && originalOldAvatar && proposedAvatar) {
              // Si el perfil en BD o en estado local tiene la imagen que se mandó a modificar
              if (profile?.avatar_url === proposedAvatar || profilePhoto === proposedAvatar || !profile?.avatar_url) {
                setProfilePhoto(originalOldAvatar)
                setProfileData((prev: any) => prev ? ({ ...prev, avatar_url: originalOldAvatar, avatar: originalOldAvatar }) : prev)
                supabase.from('profiles').update({ avatar_url: originalOldAvatar, avatar: originalOldAvatar }).eq('id', currentUser.id)
              }
            }
          }
        }

        // 3. Fetch Teams (Managed teams or Contracted teams)
        // 3a. Managed team
        const { data: managedTeams } = await supabase
          .from('teams')
          .select('*')
          .eq('manager_id', currentUser.id)
          .order('created_at', { ascending: false })

        // 3b. Contracts (Teams playing for)
        const { data: contractsData } = await supabase
          .from('contracts')
          .select(`
            *,
            teams (id, name, tag, logo_url, country, status)
          `)
          .eq('player_id', currentUser.id)
          .order('created_at', { ascending: false })

        if (contractsData) {
          setUserContracts(contractsData)
        }

        // Determine active team
        if (managedTeams && managedTeams.length > 0) {
          setUserTeam({
            ...managedTeams[0],
            isManager: true
          })
        } else if (contractsData && contractsData.length > 0) {
          const active = contractsData.find((c: any) => 
            c.status === 'active' || c.status === 'activo' || c.status === 'pending_manager' || c.status === 'pendiente' || c.status === 'pending_player_release' || c.status === 'pending_manager_release'
          )

          if (active && active.teams) {
            setUserTeam({
              ...active.teams,
              isManager: false,
              contractStatus: active.status,
              contractRole: Array.isArray(active.roles) ? active.roles.join(', ') : active.roles
            })
          } else {
            setUserTeam(null)
          }
        } else {
          setUserTeam(null)
        }

        // Determine active contract
        if (contractsData && contractsData.length > 0) {
          const active = contractsData.find((c: any) => 
            c.status === 'active' || c.status === 'activo' || c.status === 'pending_manager' || c.status === 'pendiente' || c.status === 'pending_player_release' || c.status === 'pending_manager_release'
          )

          setActiveContract(active || null)
        } else {
          setActiveContract(null)
        }

      } catch (err) {
        console.error('Error fetching user dashboard data:', err)
      } finally {
        setLoadingData(false)
      }
    }

    loadAllUserData()

    // Suscripción en tiempo real para actualizar datos de perfil al instante tras aprobación
    const channel = supabase
      .channel(`user-profile-sync-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        () => {
          loadAllUserData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'validations'
        },
        () => {
          loadAllUserData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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
      imagesChanged: false,
      discord_handle: profileData?.discord_handle || '',
      country: profileData?.country || extractCountry(profileData?.closest_airport) || '',
      phone: profileData?.phone || '',
      social_ig: profileData?.social_ig || '',
      social_tiktok: profileData?.social_tiktok || '',
      social_yt: profileData?.social_yt || '',
      social_twitch: profileData?.social_twitch || '',
      social_kick: profileData?.social_kick || '',
      social_x: profileData?.social_x || '',
      social_fb: profileData?.social_fb || '',
    })
    setFotoFile(null)
    setIsEditing(true)
  }

  const openEditPlayer = () => {
    const pendingDetails = (isRequested || hasRejectedModification) ? (modVal?.details || latestValidation?.details) : null
    const gameInfo = profileData?.player_game_info?.[0] || {}

    setPlayerEditForm({
      name: pendingDetails?.name || profileData?.name || name || '',
      nickname: pendingDetails?.nickname || pendingDetails?.game_nickname || profileData?.nickname || profileData?.game_nickname || '',
      discord_handle: pendingDetails?.discord_handle || profileData?.discord_handle || '',
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
    editForm.imagesChanged ||
    editForm.discord_handle !== (profileData?.discord_handle || '') ||
    editForm.country !== (profileData?.country || '') ||
    editForm.phone !== (profileData?.phone || '') ||
    editForm.social_ig !== (profileData?.social_ig || '') ||
    editForm.social_tiktok !== (profileData?.social_tiktok || '') ||
    editForm.social_yt !== (profileData?.social_yt || '') ||
    editForm.social_twitch !== (profileData?.social_twitch || '') ||
    editForm.social_kick !== (profileData?.social_kick || '') ||
    editForm.social_x !== (profileData?.social_x || '') ||
    editForm.social_fb !== (profileData?.social_fb || '')

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
          const compressed = await compressImage(fotoFile, IMAGE_PRESETS.AVATAR)
          const fileExt = compressed.name.split('.').pop() || 'webp'
          const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`
          const { error: uploadError, data } = await supabase.storage.from('avatars').upload(fileName, compressed, SUPABASE_STORAGE_CACHE_OPTIONS)
          toast.dismiss('user-avatar-upload')

          if (!uploadError && data) {
            const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
            finalAvatarUrl = publicUrlData.publicUrl
          }
        }

        const formattedName = formatPersonName(editForm.name).trim()

        // Para jugadores profesionales verificados, el avatar oficial solo se modifica mediante solicitud de modificación con validación
        const avatarToPersist = (isPlayerApproved && profileData?.avatar_url) ? profileData.avatar_url : finalAvatarUrl

        const { error } = await supabase.from('profiles').update({
          name: formattedName,
          avatar_url: avatarToPersist,
          discord_handle: editForm.discord_handle.trim() || null,
          closest_airport: editForm.country.trim() || null,
          social_ig: editForm.social_ig.trim() || null,
          social_tiktok: editForm.social_tiktok.trim() || null,
          social_yt: editForm.social_yt.trim() || null,
          social_twitch: editForm.social_twitch.trim() || null,
          social_kick: editForm.social_kick.trim() || null,
          social_x: editForm.social_x.trim() || null,
          social_fb: editForm.social_fb.trim() || null,
        }).eq('id', user.id)

        if (error) throw error

        setName(formattedName)
        setBio(editForm.bio.trim())
        if (finalAvatarUrl) setProfilePhoto(finalAvatarUrl)
        setProfileData((prev: any) => ({
          ...prev,
          name: formattedName,
          bio: editForm.bio.trim(),
          avatar_url: finalAvatarUrl,
          discord_handle: editForm.discord_handle.trim() || null,
          country: editForm.country.trim() || null,
          phone: editForm.phone.trim() || null,
          social_ig: editForm.social_ig.trim() || null,
          social_tiktok: editForm.social_tiktok.trim() || null,
          social_yt: editForm.social_yt.trim() || null,
          social_twitch: editForm.social_twitch.trim() || null,
          social_kick: editForm.social_kick.trim() || null,
          social_x: editForm.social_x.trim() || null,
          social_fb: editForm.social_fb.trim() || null,
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
          const compressed = await compressImage(playerFotoFile, IMAGE_PRESETS.AVATAR)
          const fileExt = compressed.name.split('.').pop() || 'webp'
          const fileName = `${Date.now()}_player_${user.id}.${fileExt}`
          const { error: uploadError, data } = await supabase.storage.from('avatars').upload(fileName, compressed, SUPABASE_STORAGE_CACHE_OPTIONS)
          if (!uploadError && data) {
            const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
            avatarUrl = publicUrlData.publicUrl
          }
        } catch (uploadErr) {
          console.warn('Could not upload avatar file, using existing URL:', uploadErr)
        }
      }

      const formattedPlayerName = formatPersonName(playerEditForm.name).trim()
      const formattedPlayerNick = formatNickname(playerEditForm.nickname).trim()

      const payloadDetails = {
        user_id: user.id,
        name: formattedPlayerName,
        nickname: formattedPlayerNick,
        game_nickname: formattedPlayerNick,
        discord_handle: playerEditForm.discord_handle.trim(),
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
        original_name: latestValidation?.details?.original_name || profileData?.name || name || user?.name || '',
        original_nickname: latestValidation?.details?.original_nickname || profileData?.nickname || profileData?.game_nickname || '',
        original_game_nickname: latestValidation?.details?.original_game_nickname || profileData?.game_nickname || profileData?.nickname || '',
        original_discord_handle: latestValidation?.details?.original_discord_handle || profileData?.discord_handle || '',
        original_bio: latestValidation?.details?.original_bio || profileData?.bio || bio || '',
        original_avatar: (latestValidation?.details?.original_avatar && latestValidation.details.original_avatar !== avatarUrl)
          ? latestValidation.details.original_avatar
          : (extractAvatarFromDetails(playerVal?.details) || profileData?.avatar_url || profilePhoto || ''),
        original_game: latestValidation?.details?.original_game || gameInfo.game || 'Mobile Legends',
        original_game_id: latestValidation?.details?.original_game_id || gameInfo.game_id || '',
        original_server: latestValidation?.details?.original_server || gameInfo.server || '',
        original_country_account: latestValidation?.details?.original_country_account || gameInfo.country_account || '',
        original_social_ig: latestValidation?.details?.original_social_ig || profileData?.social_ig || '',
        original_social_tiktok: latestValidation?.details?.original_social_tiktok || profileData?.social_tiktok || '',
        original_social_yt: latestValidation?.details?.original_social_yt || profileData?.social_yt || '',
        original_social_twitch: latestValidation?.details?.original_social_twitch || profileData?.social_twitch || '',
        original_social_kick: latestValidation?.details?.original_social_kick || profileData?.social_kick || '',
        original_social_x: latestValidation?.details?.original_social_x || profileData?.social_x || '',
        original_social_fb: latestValidation?.details?.original_social_fb || profileData?.social_fb || ''
      }

      let valError = null

      // 1. Identificar validación de modificación previa (pendiente o rechazada)
      let targetModId = modVal?.id
      if (!targetModId) {
        const { data: existingMods } = await supabase
          .from('validations')
          .select('id')
          .eq('type', 'modificacion')
          .or(`details->>user_id.eq.${user.id},submitted_by.eq.${user.id},submitted_by.eq.${user.email || 'none'}`)
          .order('created_at', { ascending: false })
          .limit(1)

        if (existingMods && existingMods.length > 0) {
          targetModId = existingMods[0].id
        }
      }

      const targetTitle = `${profileData.nickname || profileData.name || 'Jugador'} ➔ ${playerEditForm.nickname || playerEditForm.name} (Modificación de Jugador)`
      const submitter = user.email || user.name || profileData.nickname || user.id

      let savedVal: any = null

      if (targetModId) {
        // Actualizar solicitud existente (reseteando rechazo a pendiente)
        const { data: updatedVal, error } = await supabase
          .from('validations')
          .update({
            target_name: targetTitle,
            submitted_by: submitter,
            status: 'pending',
            rejection_reason: null,
            details: {
              ...payloadDetails,
              status: 'pending',
              rejection_reason: null
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', targetModId)
          .select()
          .maybeSingle()

        valError = error
        savedVal = updatedVal || {
          id: targetModId,
          type: 'modificacion',
          target_name: targetTitle,
          submitted_by: submitter,
          status: 'pending',
          rejection_reason: null,
          details: payloadDetails
        }
      } else {
        // Insertar nueva solicitud si no existía ninguna
        const { data: insertedVal, error } = await supabase
          .from('validations')
          .insert({
            type: 'modificacion',
            target_name: targetTitle,
            submitted_by: submitter,
            status: 'pending',
            details: payloadDetails
          })
          .select()
          .maybeSingle()

        valError = error
        savedVal = insertedVal || {
          type: 'modificacion',
          target_name: targetTitle,
          submitted_by: submitter,
          status: 'pending',
          details: payloadDetails
        }
      }

      const { error: profError } = await supabase.from('profiles').update({
        edit_requested: true
      }).eq('id', user.id)

      if (valError || profError) throw (valError || profError)

      // Actualizar estado reactivo local inmediatamente
      setProfileData((prev: any) => ({ ...prev, edit_requested: true }))
      setLatestValidation(savedVal)
      setUserValidations((prev: any[]) => {
        const withoutOldMod = (prev || []).filter(v => v.id !== savedVal.id && v.type !== 'modificacion')
        return [savedVal, ...withoutOldMod]
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

  // Password Management State
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordMode, setPasswordMode] = useState<'change' | 'email'>('change')

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (!user?.email) {
      setPasswordError('No se encontró una sesión activa con correo electrónico.')
      return
    }

    if (!currentPassword) {
      setPasswordError('Debes ingresar tu contraseña actual.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las nuevas contraseñas no coinciden.')
      return
    }

    setIsChangingPassword(true)
    try {
      // 1. Validar la contraseña actual intentando autenticar
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })

      if (signInErr) {
        throw new Error('La contraseña actual ingresada es incorrecta.')
      }

      // 2. Actualizar a la nueva contraseña en Supabase Auth
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateErr) throw updateErr

      setPasswordSuccess('¡Tu contraseña ha sido actualizada exitosamente!')
      toast.success('Contraseña actualizada correctamente.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setShowPasswordModal(false)
        setPasswordSuccess('')
      }, 2500)
    } catch (err: any) {
      console.error('Error al cambiar contraseña:', err)
      setPasswordError(err?.message || 'Error al actualizar la contraseña.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSendRecoveryEmail = async () => {
    if (!user?.email) {
      toast.error('No se encontró correo asociado a tu cuenta.')
      return
    }

    setIsSendingResetEmail(true)
    setPasswordError('')
    setPasswordSuccess('')
    try {
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${siteUrl}/auth/confirm?next=/login/olvide-password`
      })

      if (error) throw error

      toast.success(`Enlace de restablecimiento enviado a ${user.email}`)
      setPasswordSuccess(`Hemos enviado un enlace de recuperación a ${user.email}. Revisa tu bandeja de entrada o spam.`)
    } catch (err: any) {
      console.error('Error al enviar enlace de recuperación:', err)
      toast.error('Error al enviar enlace: ' + (err?.message || ''))
    } finally {
      setIsSendingResetEmail(false)
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
              {profilePhoto && !profilePhoto.includes('placehold.co') ? (
                <img src={profilePhoto} alt="Avatar" className="h-full w-full object-cover" />
              ) : user?.avatar && !user.avatar.includes('placehold.co') ? (
                <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              
              <button 
                onClick={isPlayerApproved || isPlayer ? openEditPlayer : openEdit}
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100 cursor-pointer"
                title={t.userProfile.changeProfilePhoto}
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="font-display text-2xl sm:text-3xl font-700 text-white tracking-tight">
                    {profileData?.nickname ? (
                      <>
                        <span className="text-white">{profileData.nickname}</span>
                        {name && (
                          <span className="text-sm sm:text-base font-500 text-muted-foreground font-sans ml-1.5 font-normal">
                            ({name})
                          </span>
                        )}
                      </>
                    ) : (
                      name
                    )}
                  </h2>
                </div>
                
                {/* Profile Badge */}
                {user?.role === 'admin' ? (
                  <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-600 text-primary border border-primary/20 uppercase tracking-wider">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t.userProfile.admin}
                  </div>
                ) : isPlayerApproved ? (
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-600 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                    <UserCheck className="h-3.5 w-3.5" />
                    {t.userProfile.verifiedPlayer}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-600 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                    <UserCheck className="h-3.5 w-3.5" />
                    {t.userProfile.activeProfile}
                  </div>
                )}
              </div>
              {profileData?.discord_handle && (
                <p className="text-xs font-500 text-muted-foreground flex items-center gap-1.5">
                  <span className="text-primary font-600">Discord:</span> {profileData.discord_handle}
                </p>
              )}
              <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
                {bio}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="shrink-0 w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
            <button 
              onClick={() => {
                setShowPasswordModal(true)
                setPasswordMode('change')
                setPasswordError('')
                setPasswordSuccess('')
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-md px-4 py-3 text-xs sm:text-sm font-600 uppercase tracking-wider transition-all clip-corner bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-white cursor-pointer"
            >
              <KeyRound className="h-4 w-4 text-primary" />
              {t.userProfile.password}
            </button>
            <button 
              onClick={isPlayerApproved || isPlayer ? openEditPlayer : openEdit}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-600 uppercase tracking-wider transition-all clip-corner bg-white/5 hover:bg-primary border border-white/10 text-white hover:border-primary cursor-pointer"
            >
              <Edit3 className="h-4 w-4" />
              {t.userProfile.editProfile}
            </button>
          </div>
        </div>
      </div>

      {/* Rejection Alert Banner with Mandatory Administrator Reason */}
      {(hasRejectedModification || isPlayerRejected || isTeamRejected || isContractRejected) && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 shrink-0 mt-0.5 border border-red-500/30">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-700 uppercase tracking-wider text-red-400">
                {hasRejectedModification 
                  ? t.userProfile.modificationRejectionTitle
                  : isPlayerRejected
                  ? t.userProfile.rejectionNoticeTitle
                  : isTeamRejected
                  ? t.userProfile.teamRejectedTitle
                  : t.userProfile.contractRejectedTitle}
              </h4>
              <p className="text-sm text-white/90 leading-relaxed">
                <span className="font-700 text-red-300">{t.userProfile.adminReasonLabel} </span>
                {hasRejectedModification 
                  ? modRejectionReason 
                  : isPlayerRejected 
                  ? playerRejectionReason 
                  : isTeamRejected 
                  ? teamRejectionReason 
                  : contractRejectionReason}
              </p>
            </div>
          </div>
          {hasRejectedModification ? (
            <button 
              onClick={isPlayerApproved || isPlayer ? openEditPlayer : openEdit}
              className="shrink-0 px-4 py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-700 uppercase tracking-wider transition-colors cursor-pointer"
            >
              {t.userProfile.editAndResubmit}
            </button>
          ) : isPlayerRejected ? (
            <Link 
              href="/registro/alta-de-jugador" 
              className="shrink-0 px-4 py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-700 uppercase tracking-wider transition-colors"
            >
              {t.userProfile.resubmitRegistration}
            </Link>
          ) : isTeamRejected ? (
            <Link 
              href="/registro/alta-de-equipo" 
              className="shrink-0 px-4 py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-700 uppercase tracking-wider transition-colors"
            >
              {t.userProfile.resubmitRegistration}
            </Link>
          ) : (
            <Link 
              href="/registro/alta-de-contrato" 
              className="shrink-0 px-4 py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-700 uppercase tracking-wider transition-colors"
            >
              {t.userProfile.resubmitRegistration}
            </Link>
          )}
        </div>
      )}

      {/* Registrations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display text-xl font-600 uppercase tracking-tight text-white">
            {t.userProfile.myRegistrations}
          </h3>
          <span className="text-xs text-muted-foreground">{t.userProfile.realtimeStatus}</span>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          
          {/* 1. JUGADOR PROFESIONAL */}
          <div className={cn(
            "flex flex-col justify-between rounded-xl border p-6 transition-all duration-300",
            isPlayerApproved ? "border-emerald-500/30 bg-emerald-500/[0.03] hover:border-emerald-500/50" :
            isPlayerPending ? "border-amber-500/30 bg-amber-500/[0.03] hover:border-amber-500/50" :
            isPlayerRejected ? "border-red-500/30 bg-red-500/[0.03] hover:border-red-500/50" :
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
                  {isPlayerApproved ? t.userProfile.approved :
                   isPlayerPending ? t.userProfile.underReview :
                   isPlayerRejected ? t.userProfile.rejected :
                   t.userProfile.notRegistered}
                </span>
              </div>

              <div>
                <h4 className="font-display font-700 text-lg text-white">{t.userProfile.proPlayer}</h4>
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
                {isPlayerRejected && (
                  <p className="text-xs font-600 text-red-400 uppercase tracking-wider mt-0.5">
                    {profileData?.nickname ? `Postulación: ${profileData.nickname}` : 'Postulación Rechazada'}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {isPlayerApproved 
                    ? t.userProfile.playerApprovedDesc
                    : isPlayerPending 
                    ? t.userProfile.playerPendingDesc
                    : isPlayerRejected
                    ? t.userProfile.playerRejectedDescText
                    : t.userProfile.playerNotRegisteredDesc}
                </p>

                {/* Motivo de rechazo de Alta de Jugador */}
                {isPlayerRejected && (
                  <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex items-start gap-2.5 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                    <div>
                      <span className="font-700 text-red-400 block uppercase tracking-wider text-[11px]">
                        {t.userProfile.adminReasonLabel}
                      </span>
                      <span className="text-xs text-red-200/90 leading-snug font-500 mt-0.5 block">
                        {playerRejectionReason}
                      </span>
                    </div>
                  </div>
                )}

                {/* Banner de Estado de Modificación Pendiente o Rechazada */}
                {isPlayer && isPlayerModificationPending && (
                  <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5 text-xs text-amber-300">
                    <Clock className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-700 text-amber-400 block">{t.userProfile.playerModPendingTitle}</span>
                      <span className="text-[11px] text-amber-300/90 leading-snug">
                        {t.userProfile.playerModPendingDesc}
                      </span>
                    </div>
                  </div>
                )}

                {isPlayer && hasRejectedModification && (
                  <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex items-start gap-2.5 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                    <div>
                      <span className="font-700 text-red-400 block">{t.userProfile.playerModRejectedTitle}</span>
                      <span className="text-[11px] text-red-300/90 leading-snug">
                        {rejectionReasonText ? `${t.userProfile.adminReasonLabel} ${rejectionReasonText}` : t.userProfile.playerModRejectedDesc}
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
                    {isPlayerModificationPending ? t.userProfile.editRequest : t.userProfile.modifyProfile}
                  </button>
                  <button 
                    onClick={() => setShowPlayerModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white px-3 py-2 text-xs font-600 uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    {t.userProfile.viewCard}
                  </button>
                </div>
              ) : isPlayerRejected ? (
                <Link 
                  href="/registro/alta-de-jugador" 
                  className="flex items-center gap-2 text-sm font-600 text-red-400 hover:text-red-300 transition-colors"
                >
                  {t.userProfile.resubmitRequest || 'Reintentar Registro'} <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link 
                  href="/registro/alta-de-jugador" 
                  className="flex items-center gap-2 text-sm font-600 text-primary hover:text-primary-dark transition-colors"
                >
                  {t.userProfile.startRegistration} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          {/* 2. EQUIPO PROFESIONAL */}
          <div className={cn(
            "flex flex-col justify-between rounded-xl border p-6 transition-all duration-300",
            isTeamApproved ? "border-primary/30 bg-primary/[0.03] hover:border-primary/50" :
            isTeamPending ? "border-amber-500/30 bg-amber-500/[0.03] hover:border-amber-500/50" :
            isTeamRejected ? "border-red-500/30 bg-red-500/[0.03] hover:border-red-500/50" :
            "border-border bg-surface hover:border-white/20"
          )}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden",
                  isTeamApproved ? "bg-primary/10 text-primary border border-primary/20" :
                  isTeamPending ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                  isTeamRejected ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                  "bg-white/5 text-muted-foreground"
                )}>
                  {userTeam?.logo_url ? (
                    <img src={userTeam.logo_url} alt={userTeam.name} className="h-full w-full object-cover" />
                  ) : isTeamApproved ? (
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  ) : isTeamPending ? (
                    <Clock className="h-6 w-6 text-amber-400" />
                  ) : isTeamRejected ? (
                    <AlertCircle className="h-6 w-6 text-red-400" />
                  ) : (
                    <Shield className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {userTeam && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-700 uppercase tracking-widest bg-primary/20 text-primary border border-primary/30">
                      {userTeam.isManager ? "Manager" : t.userProfile.teamPlayerRole}
                    </span>
                  )}
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-700 uppercase tracking-wider border",
                    isTeamApproved ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    isTeamPending ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    isTeamRejected ? "bg-red-500/10 text-red-400 border-red-500/20" :
                    "bg-white/5 text-muted-foreground border-border"
                  )}>
                    {isTeamApproved ? t.userProfile.active :
                     isTeamPending ? t.userProfile.pending :
                     isTeamRejected ? t.userProfile.rejected :
                     t.userProfile.noTeam}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-display font-700 text-lg text-white">
                  {userTeam ? userTeam.name : (teamVal?.target_name || t.userProfile.proTeam)}
                </h4>
                {userTeam && isTeamApproved && (
                  <p className="text-xs font-600 text-muted-foreground uppercase tracking-wider mt-0.5">
                    {userTeam.tag ? `#${userTeam.tag.toUpperCase()} • ` : ''}{userTeam.country || 'eSports'}
                  </p>
                )}
                {isTeamPending && (
                  <p className="text-xs font-600 text-amber-400 uppercase tracking-wider mt-0.5">
                    Postulado: {teamVal?.target_name || userTeam?.name}
                  </p>
                )}
                {isTeamRejected && (
                  <p className="text-xs font-600 text-red-400 uppercase tracking-wider mt-0.5">
                    Postulación rechazada: {teamVal?.target_name || userTeam?.name}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {isTeamApproved 
                    ? t.userProfile.teamMemberDesc.replace('{team}', userTeam.name).replace('{role}', userTeam.isManager ? t.userProfile.teamManagerRole : t.userProfile.teamPlayerRole)
                    : isTeamPending
                    ? 'Tu registro de equipo se encuentra en proceso de revisión por los administradores.'
                    : isTeamRejected
                    ? 'El registro de tu equipo fue rechazado. Revisa las observaciones e intenta registrarlo de nuevo.'
                    : t.userProfile.noTeamDesc}
                </p>

                {/* Motivo de rechazo de Alta de Equipo */}
                {isTeamRejected && (
                  <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex items-start gap-2.5 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                    <div>
                      <span className="font-700 text-red-400 block uppercase tracking-wider text-[11px]">
                        {t.userProfile.adminReasonLabel}
                      </span>
                      <span className="text-xs text-red-200/90 leading-snug font-500 mt-0.5 block">
                        {teamRejectionReason}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6">
              {isTeamApproved ? (
                <button 
                  onClick={() => onNavigateTab ? onNavigateTab(userTeam.isManager ? 'jugadores' : 'equipos') : null}
                  className="flex items-center gap-2 text-sm font-600 text-primary hover:text-primary-dark transition-colors text-left cursor-pointer"
                >
                  {userTeam.isManager ? t.userProfile.managePlayersContracts : t.userProfile.viewMyTeam} <ArrowRight className="h-4 w-4" />
                </button>
              ) : isTeamRejected ? (
                <Link 
                  href="/registro/alta-de-equipo" 
                  className="flex items-center gap-2 text-sm font-600 text-red-400 hover:text-red-300 transition-colors"
                >
                  {t.userProfile.resubmitRequest || 'Reintentar Registro'} <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link 
                  href="/registro/alta-de-equipo" 
                  className="flex items-center gap-2 text-sm font-600 text-muted-foreground hover:text-white transition-colors"
                >
                  {t.userProfile.registerTeam} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          {/* 3. CONTRATOS */}
          <div className={cn(
            "flex flex-col justify-between rounded-xl border p-6 transition-all duration-300",
            isContractApproved ? "border-purple-500/30 bg-purple-500/[0.03] hover:border-purple-500/50" :
            isContractPending ? "border-amber-500/30 bg-amber-500/[0.03] hover:border-amber-500/50" :
            isContractRejected ? "border-red-500/30 bg-red-500/[0.03] hover:border-red-500/50" :
            "border-border bg-surface hover:border-white/20"
          )}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl",
                  isContractApproved ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                  isContractPending ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                  isContractRejected ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                  "bg-white/5 text-muted-foreground"
                )}>
                  {isContractRejected ? <AlertCircle className="h-6 w-6 text-red-400" /> : <ScrollText className="h-6 w-6" />}
                </div>

                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-700 uppercase tracking-wider border",
                  isContractApproved ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  activeContract?.status === 'pending_player_release' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                  activeContract?.status === 'pending_manager_release' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  isContractPending ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  isContractRejected ? "bg-red-500/10 text-red-400 border-red-500/20" :
                  "bg-white/5 text-muted-foreground border-border"
                )}>
                  {isContractApproved ? t.userProfile.active :
                   activeContract?.status === 'pending_player_release' ? t.userProfile.releaseRequested :
                   activeContract?.status === 'pending_manager_release' ? t.userProfile.releaseInProgress :
                   isContractPending ? t.userProfile.pending :
                   isContractRejected ? t.userProfile.rejected :
                   t.userProfile.noContracts}
                </span>
              </div>

              <div>
                <h4 className="font-display font-700 text-lg text-white">
                  {activeContract?.teams?.name 
                    ? `${t.userProfile.contract}: ${activeContract.teams.name}` 
                    : (contractVal?.target_name ? `Contrato: ${contractVal.target_name}` : t.userProfile.contracts)}
                </h4>
                {activeContract && isContractApproved && (
                  <p className="text-xs font-600 text-purple-400 uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {activeContract.end_date ? t.userProfile.expiresOn.replace('{date}', new Date(activeContract.end_date).toLocaleDateString()) : t.userProfile.contractActive}
                  </p>
                )}
                {isContractPending && (
                  <p className="text-xs font-600 text-amber-400 uppercase tracking-wider mt-0.5">
                    En revisión con el equipo / administración
                  </p>
                )}
                {isContractRejected && (
                  <p className="text-xs font-600 text-red-400 uppercase tracking-wider mt-0.5">
                    Solicitud de contrato rechazada
                  </p>
                )}
                {isContractApproved ? (
                  <div className="mt-2 space-y-1.5">
                    <span className="text-xs text-muted-foreground block font-500">{t.userProfile.assignedRoles}</span>
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
                    {isContractRejected
                      ? 'La vinculación del contrato fue rechazada por la administración o directiva.'
                      : isContractPending
                      ? 'El contrato está pendiente de confirmación por el manager o la administración de GMX Gaming.'
                      : t.userProfile.noActiveContractDesc}
                  </p>
                )}

                {/* Motivo de rechazo del Contrato */}
                {isContractRejected && (
                  <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex items-start gap-2.5 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                    <div>
                      <span className="font-700 text-red-400 block uppercase tracking-wider text-[11px]">
                        {t.userProfile.adminReasonLabel}
                      </span>
                      <span className="text-xs text-red-200/90 leading-snug font-500 mt-0.5 block">
                        {contractRejectionReason}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6">
              {isContractApproved ? (
                <button 
                  onClick={() => onNavigateTab ? onNavigateTab('contratos') : null}
                  className="flex items-center gap-2 text-sm font-600 text-purple-400 hover:text-purple-300 transition-colors text-left cursor-pointer"
                >
                  {t.userProfile.viewMyContracts} <ArrowRight className="h-4 w-4" />
                </button>
              ) : isContractRejected ? (
                <Link 
                  href="/registro/alta-de-contrato" 
                  className="flex items-center gap-2 text-sm font-600 text-red-400 hover:text-red-300 transition-colors"
                >
                  {t.userProfile.registerContract} <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link 
                  href="/registro/alta-de-contrato" 
                  className="flex items-center gap-2 text-sm font-600 text-muted-foreground hover:text-white transition-colors"
                >
                  {t.userProfile.registerContract} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Seguridad de la Cuenta */}
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0 mt-1 sm:mt-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white">
                {t.userProfile.securityAndPass}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
                {t.userProfile.securityDesc}
              </p>
              <p className="text-xs text-primary mt-2 font-mono flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{t.userProfile.registeredEmail} <strong>{user?.email || t.userProfile.notAvailable}</strong></span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                setShowPasswordModal(true)
                setPasswordMode('change')
                setPasswordError('')
                setPasswordSuccess('')
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary/90 px-4 py-2.5 text-xs font-700 uppercase tracking-wider text-white transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              {t.userProfile.changePassword}
            </button>
            <button
              onClick={() => {
                setShowPasswordModal(true)
                setPasswordMode('email')
                setPasswordError('')
                setPasswordSuccess('')
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-lg border border-border bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-700 uppercase tracking-wider text-muted-foreground hover:text-white transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              {t.userProfile.recoverByEmail}
            </button>
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
                  {t.userProfile.editPersonalProfile}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.userProfile.editPersonalProfileDesc}
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
                  {t.userProfile.profilePhoto}
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
                      {t.userProfile.uploadImage}
                    </button>
                    <p className="text-[11px] text-muted-foreground">
                      {t.userProfile.recommendedFormats}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nombre y Bio */}
              <div className="space-y-4 pt-2 border-t border-border/50">
                <div className="space-y-2">
                  <label className="text-xs font-600 uppercase tracking-widest text-primary block">
                    {t.userProfile.fullName}
                  </label>
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: formatPersonName(e.target.value) }))}
                    placeholder={t.userProfile.fullNamePlaceholder}
                    className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors uppercase"
                  />
                  <p className="text-[11px] text-muted-foreground">{t.userProfile.fullNameHelp}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-600 uppercase tracking-widest text-primary block">
                    {t.userProfile.bioLabel}
                  </label>
                  <textarea 
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    placeholder={t.userProfile.bioPlaceholderInput}
                    className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Contacto */}
              <div className="space-y-4 pt-2 border-t border-border/50">
                <p className="text-xs font-600 uppercase tracking-widest text-primary">{t.userProfile.contact}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-500 text-muted-foreground uppercase tracking-widest block">Discord</label>
                    <input
                      type="text"
                      value={editForm.discord_handle}
                      onChange={(e) => setEditForm(prev => ({ ...prev, discord_handle: e.target.value }))}
                      placeholder={t.userProfile.discordPlaceholder}
                      className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-500 text-muted-foreground uppercase tracking-widest block">{t.userProfile.phoneLabel}</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+52 000 000 0000"
                      className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-500 text-muted-foreground uppercase tracking-widest block">{t.userProfile.countryLabel}</label>
                    <input
                      type="text"
                      value={editForm.country}
                      onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                      placeholder={t.userProfile.countryPlaceholder}
                      className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Redes Sociales */}
              <div className="space-y-4 pt-2 border-t border-border/50">
                <p className="text-xs font-600 uppercase tracking-widest text-primary">{t.userProfile.socialNetworks}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    { key: 'social_ig', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                    { key: 'social_tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
                    { key: 'social_yt', label: 'YouTube', placeholder: 'https://youtube.com/...' },
                    { key: 'social_twitch', label: 'Twitch', placeholder: 'https://twitch.tv/...' },
                    { key: 'social_kick', label: 'Kick', placeholder: 'https://kick.com/...' },
                    { key: 'social_x', label: 'X (Twitter)', placeholder: 'https://x.com/...' },
                    { key: 'social_fb', label: 'Facebook', placeholder: 'https://facebook.com/...' },
                  ] as const).map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-xs font-500 text-muted-foreground block">{label}</label>
                      <input
                        type="url"
                        value={editForm[key]}
                        onChange={(e) => setEditForm(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-xs text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Fijo */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border p-6 bg-surface z-10">
              <span className="text-xs text-muted-foreground">
                {!hasChanges ? t.userProfile.noChanges : t.userProfile.pendingChanges}
              </span>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="rounded-md border border-border bg-transparent px-4 py-2 text-sm font-600 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                >
                  {t.userProfile.cancel}
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
                    {isSubmitting ? t.userProfile.savingChanges : t.userProfile.saveChanges}
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
                {t.userProfile.playerDataTitle}
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
                  <p className="text-xs font-500 text-muted-foreground uppercase tracking-widest mb-1">{t.userProfile.realName}</p>
                  <p className="text-sm text-white font-600">{profileData.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-500 text-muted-foreground uppercase tracking-widest mb-1">{t.userProfile.nickname}</p>
                  <p className="text-sm text-white font-600">{profileData.nickname || profileData.game_nickname || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-500 text-muted-foreground uppercase tracking-widest mb-1">Discord</p>
                  <p className="text-sm text-white font-600">{profileData.discord_handle || 'N/A'}</p>
                </div>

                {profileData.player_game_info && profileData.player_game_info.length > 0 && (
                  <div className="border-t border-border pt-4 space-y-3">
                    <p className="text-xs font-600 uppercase tracking-widest text-primary">{t.userProfile.gameData.replace('{game}', profileData.player_game_info[0].game)}</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-lg bg-background p-3 border border-border">
                        <span className="text-muted-foreground block mb-1">{t.userProfile.gameId}</span>
                        <span className="text-white font-600">{profileData.player_game_info[0].game_id || 'N/A'}</span>
                      </div>
                      <div className="rounded-lg bg-background p-3 border border-border">
                        <span className="text-muted-foreground block mb-1">{t.userProfile.server}</span>
                        <span className="text-white font-600">{profileData.player_game_info[0].server || 'N/A'}</span>
                      </div>
                      {profileData.player_game_info[0].country_account && (
                        <div className="rounded-lg bg-background p-3 border border-border col-span-2">
                          <span className="text-muted-foreground block mb-1">{t.userProfile.accountCountry}</span>
                          <span className="text-white font-600">{profileData.player_game_info[0].country_account}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Redes Sociales y Enlaces */}
                {(profileData.social_ig || profileData.social_twitch || profileData.social_kick || profileData.social_yt || profileData.social_tiktok || profileData.social_x || profileData.social_fb) && (
                  <div className="border-t border-border pt-4 space-y-2.5">
                    <p className="text-xs font-600 uppercase tracking-widest text-primary">{t.userProfile.linkedSocials}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {profileData.social_ig && (
                        <a href={profileData.social_ig} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded bg-background border border-border text-white hover:text-primary transition-colors">
                          Instagram
                        </a>
                      )}
                      {profileData.social_twitch && (
                        <a href={profileData.social_twitch} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded bg-background border border-border text-white hover:text-primary transition-colors">
                          Twitch
                        </a>
                      )}
                      {profileData.social_kick && (
                        <a href={profileData.social_kick} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded bg-background border border-border text-white hover:text-primary transition-colors">
                          Kick
                        </a>
                      )}
                      {profileData.social_yt && (
                        <a href={profileData.social_yt} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded bg-background border border-border text-white hover:text-primary transition-colors">
                          YouTube
                        </a>
                      )}
                      {profileData.social_tiktok && (
                        <a href={profileData.social_tiktok} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded bg-background border border-border text-white hover:text-primary transition-colors">
                          TikTok
                        </a>
                      )}
                      {profileData.social_x && (
                        <a href={profileData.social_x} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded bg-background border border-border text-white hover:text-primary transition-colors">
                          X (Twitter)
                        </a>
                      )}
                      {profileData.social_fb && (
                        <a href={profileData.social_fb} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded bg-background border border-border text-white hover:text-primary transition-colors">
                          Facebook
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                <p className="text-xs font-600 uppercase tracking-widest text-primary">{t.userProfile.verificationStatus}</p>
                <div className="flex items-center gap-2">
                  <div className={cn("px-3 py-1 rounded-full text-xs font-600 uppercase", 
                    (profileData.player_status === 'active' || profileData.player_status === 'approved') ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                    profileData.player_status === 'rejected' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                    "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  )}>
                    {(profileData.player_status === 'active' || profileData.player_status === 'approved') ? '✓ ' + t.userProfile.approved :
                     profileData.player_status === 'rejected' ? '✕ ' + t.userProfile.rejected : '⏳ ' + t.userProfile.underReview}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Fijo */}
            <div className="flex shrink-0 justify-end gap-3 border-t border-border p-6 bg-surface z-10">
              <GmxButton onClick={() => setShowPlayerModal(false)}>
                {t.userProfile.close}
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
                  {isPlayerModificationPending ? t.userProfile.editPlayerModalTitlePending : t.userProfile.editPlayerModalTitle}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.userProfile.editPlayerModalSubtitle}
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
                  <strong>{t.userProfile.mandatoryApproval}</strong> {t.userProfile.mandatoryApprovalDesc}
                </span>
              </div>

              {/* SECCIÓN 1: FOTO & DATOS PERSONALES */}
              <div className="space-y-4">
                <h4 className="text-xs font-700 uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border/50 pb-2">
                  <User className="w-4 h-4" />
                  {t.userProfile.sectionIdentity}
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
                      {t.userProfile.changePlayerPhoto}
                    </button>
                    <p className="text-[11px] text-muted-foreground">
                      {t.userProfile.recommendedFormats}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-white block">
                      {t.userProfile.realName} <span className="text-red-400">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={playerEditForm.name}
                      onChange={(e) => setPlayerEditForm(prev => ({ ...prev, name: formatPersonName(e.target.value) }))}
                      placeholder={t.userProfile.fullNamePlaceholder}
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors uppercase"
                    />
                    <p className="text-[10px] text-muted-foreground">{t.userProfile.fullNameHelp}</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-white block">
                      {t.userProfile.nicknameIgn} <span className="text-red-400">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={playerEditForm.nickname}
                      onChange={(e) => setPlayerEditForm(prev => ({ ...prev, nickname: formatNickname(e.target.value) }))}
                      placeholder={t.userProfile.nickname}
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors uppercase"
                    />
                    <p className="text-[10px] text-muted-foreground">{t.userProfile.nicknameHelp}</p>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-600 uppercase tracking-wider text-white block">
                      {t.userProfile.discordUser}
                    </label>
                    <input 
                      type="text" 
                      value={playerEditForm.discord_handle}
                      onChange={(e) => setPlayerEditForm(prev => ({ ...prev, discord_handle: e.target.value }))}
                      placeholder="usuario#0000 o @usuario"
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-600 uppercase tracking-wider text-white block">
                    {t.userProfile.playerBioLabel}
                  </label>
                  <textarea 
                    value={playerEditForm.bio}
                    onChange={(e) => setPlayerEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    placeholder={t.userProfile.playerBioPlaceholder}
                    className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"
                  />
                </div>
              </div>

              {/* SECCIÓN 2: DATOS DEL JUEGO COMPETITIVO */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-700 uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border/50 pb-2">
                  <Gamepad2 className="w-4 h-4" />
                  {t.userProfile.sectionCompetitiveGame}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-white block">
                      {t.userProfile.mainGame}
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
                      {t.userProfile.gameId}
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
                      {t.userProfile.server}
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
                      {t.userProfile.accountCountry}
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
                  {t.userProfile.sectionSocials}
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
                {t.userProfile.staffReviewNotice}
              </span>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsEditingPlayer(false)}
                  className="rounded-md border border-border bg-transparent px-4 py-2 text-sm font-600 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                >
                  {t.userProfile.cancel}
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
                    {isSubmitting ? t.userProfile.submitting : isPlayerModificationPending ? t.userProfile.updateApplication : t.userProfile.requestModification}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Management Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="relative flex flex-col w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border p-6 bg-surface z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-700 uppercase tracking-tight text-white">
                    {t.userProfile.securityAndPass}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t.userProfile.manageAccessKey}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-muted-foreground hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-border bg-background/50 p-1.5 gap-1 text-xs font-600">
              <button
                type="button"
                onClick={() => {
                  setPasswordMode('change')
                  setPasswordError('')
                  setPasswordSuccess('')
                }}
                className={cn(
                  "flex-1 py-2 rounded-lg transition-all text-center cursor-pointer",
                  passwordMode === 'change'
                    ? "bg-primary text-white font-700 shadow-sm"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                {t.userProfile.changeWithCurrentPass}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasswordMode('email')
                  setPasswordError('')
                  setPasswordSuccess('')
                }}
                className={cn(
                  "flex-1 py-2 rounded-lg transition-all text-center cursor-pointer",
                  passwordMode === 'email'
                    ? "bg-primary text-white font-700 shadow-sm"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                {t.userProfile.recoverByEmail}
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {passwordError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 flex items-start gap-2.5 text-left">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400 font-500 leading-relaxed">
                    {passwordError}
                  </p>
                </div>
              )}

              {passwordSuccess && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-start gap-2.5 text-left">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-300 font-500 leading-relaxed">
                    {passwordSuccess}
                  </p>
                </div>
              )}

              {passwordMode === 'change' ? (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-muted-foreground block">
                      {t.userProfile.currentPassword} <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder={t.userProfile.enterCurrentPass}
                        className="w-full rounded-lg border border-border bg-background py-2.5 pl-3 pr-10 text-sm text-white placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-muted-foreground block">
                      {t.userProfile.newPassword} <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder={t.userProfile.minChars}
                        className="w-full rounded-lg border border-border bg-background py-2.5 pl-3 pr-10 text-sm text-white placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-600 uppercase tracking-wider text-muted-foreground block">
                      {t.userProfile.confirmNewPassword} <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder={t.userProfile.repeatNewPass}
                        className="w-full rounded-lg border border-border bg-background py-2.5 pl-3 pr-10 text-sm text-white placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                      >
                        {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      className="px-4 py-2 text-xs font-600 uppercase tracking-wider rounded-lg border border-border text-muted-foreground hover:text-white transition-colors cursor-pointer"
                    >
                      {t.userProfile.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="px-5 py-2.5 text-xs font-700 uppercase tracking-wider rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t.userProfile.savingChanges}</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>{t.userProfile.savePass}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t.userProfile.emailResetNotice}
                  </p>

                  <div className="p-3.5 rounded-lg bg-background border border-border text-center">
                    <span className="font-mono text-xs text-white font-semibold">{user?.email || t.userProfile.notAvailable}</span>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {t.userProfile.emailResetNoticeSub}
                  </p>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      className="px-4 py-2 text-xs font-600 uppercase tracking-wider rounded-lg border border-border text-muted-foreground hover:text-white transition-colors cursor-pointer"
                    >
                      {t.userProfile.close}
                    </button>
                    <button
                      type="button"
                      onClick={handleSendRecoveryEmail}
                      disabled={isSendingResetEmail || !user?.email}
                      className="px-5 py-2.5 text-xs font-700 uppercase tracking-wider rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSendingResetEmail ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t.userProfile.submitting}</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>{t.userProfile.sendResetLink}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
