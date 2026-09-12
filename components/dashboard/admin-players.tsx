'use client'

import { useState, useEffect, useMemo } from 'react'
import { User, Mail, Gamepad2, Shield, Eye, X, Phone, Calendar, Filter, Ban, CheckCircle2, Edit, Download, Save, ZoomIn, Star, ChevronDown, UserX, AlertCircle, FileText, Globe, Upload, Image as ImageIcon, Loader2, RotateCcw, Power } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { GmxButton } from '@/components/gmx-button'
import { toast } from 'sonner'
import { cn, formatNickname, formatPersonName, formatRoleTitle, extractCountry, DEFAULT_COUNTRIES } from '@/lib/utils'

const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre Completo',
  nickname: 'Nickname / Apodo',
  game_nickname: 'Nombre en Juego (IGN)',
  discord_handle: 'Usuario de Discord',
  avatar_url: 'Foto de Perfil',
  country: 'País de Residencia',
  bio: 'Biografía / Descripción',
  description: 'Descripción',
  passport_number: 'Nº Pasaporte / Documento',
  id_photo_url: 'Documento de Identidad (DNI/INE)',
  passport_photo_url: 'Foto del Pasaporte',
  jersey_url: 'Diseño de Camiseta (Jersey)',
  game: 'Juego Principal',
  game_id: 'ID de Cuenta / Juego',
  server: 'Servidor / Región',
  country_account: 'País de la Cuenta',
  social_ig: 'Instagram',
  social_tiktok: 'TikTok',
  social_yt: 'YouTube',
  social_twitch: 'Twitch',
  social_kick: 'Kick',
  social_x: 'X (Twitter)',
  social_fb: 'Facebook',
  status: 'Estado del Registro',
  player_status: 'Estado como Jugador'
}

const EXCLUDED_FIELDS = new Set([
  'id',
  'user_id',
  'manager_id',
  'profile_id',
  'created_at',
  'updated_at',
  'cover_url',
  'role',
  'is_player',
  'is_featured',
  'edit_requested',
  'can_edit_profile',
  'contracts',
  'closest_airport'
])

function getFieldLabel(key: string): string {
  const lower = key.toLowerCase()
  if (FIELD_LABELS[lower]) return FIELD_LABELS[lower]
  if (FIELD_LABELS[key]) return FIELD_LABELS[key]
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
    .trim()
}

export interface PlayerContractItem {
  id: string
  team_id: string
  teamName: string
  teamLogo?: string
  status: string
  roles: any
  team_gender_category?: string
  start_date: string | null
  end_date: string | null
  conclusion_date: string | null
  justification?: string | null
  adminName?: string | null
}

export interface Player {
  id: string
  name: string
  email: string
  phone?: string
  birthDate?: string
  gender?: string
  contractTimeLeft: string
  team: string
  status: 'active' | 'inactive' | 'banned'
  avatar: string
  discord: string
  country: string
  created_at: string
  is_featured: boolean
  rawDetails: any
  activeContract?: PlayerContractItem | null
  pastContracts?: PlayerContractItem[]
}

export function AdminPlayers() {
  const { user } = useAuth()
  const isVisitor = Boolean(user?.isAdminVisitante)
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [modalTab, setModalTab] = useState<'profile' | 'contracts'>('profile')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Contract termination state
  const [terminatingContract, setTerminatingContract] = useState<{
    contractId: string
    playerId: string
    playerName: string
    teamId: string
    teamName: string
  } | null>(null)
  const [terminationJustification, setTerminationJustification] = useState('')
  const [submittingTermination, setSubmittingTermination] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTeam, setFilterTeam] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCountry, setFilterCountry] = useState<string>('all')
  
  // Modal Actions
  const [actionModal, setActionModal] = useState<{type: 'status' | 'team', player: Player} | null>(null)
  const [newStatus, setNewStatus] = useState<'active' | 'inactive' | 'banned'>('active')
  const [newTeam, setNewTeam] = useState<string>('')
  const [availableTeams, setAvailableTeams] = useState<string[]>([])
  const [editingDetails, setEditingDetails] = useState<any>(null)
  const [lightboxImage, setLightboxImage] = useState<{src: string, label: string} | null>(null)

  // Selection for Export
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Reiniciar seleccionados al cambiar cualquier filtro o búsqueda
  useEffect(() => {
    setSelectedIds(new Set())
  }, [searchQuery, filterTeam, filterStatus, filterCountry])

  useEffect(() => {
    async function init() {
      setLoading(true)
      const { data: playersData, error } = await supabase
        .from('profiles')
        .select(`
          *,
          player_game_info(game, game_id, server, game_nickname, country_account),
          contracts(
            id,
            team_id,
            roles,
            team_gender_category,
            start_date,
            end_date,
            conclusion_date,
            status,
            created_at,
            teams(id, name, logo_url, country)
          )
        `)
        .eq('is_player', true)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error("Error fetching players:", error)
        toast.error("Error al cargar jugadores: " + error.message)
      }

      // Fetch all validations to link audit trail, justifications, and player data (email, phone, birth_date, gender)
      const { data: allValidations } = await supabase
        .from('validations')
        .select('*')
        .order('created_at', { ascending: false })

      const valMap: Record<string, any> = {}
      const playerDetailsLookup: Record<string, { email: string; phone: string; birthDate: string; gender: string; details: any }> = {}

      if (allValidations) {
        allValidations.forEach((v: any) => {
          if (v.type === 'baja_contrato') {
            const cId = v.details?.contract_id
            if (cId) valMap[cId] = v
          }

          const uId = v.details?.user_id || v.details?.id || (v.type === 'jugador' ? v.id : null)
          const d = v.details || {}

          const emailVal = d.email || d['item_meta[676]'] || (v.submitted_by && v.submitted_by.includes('@') ? v.submitted_by : '')
          const phoneVal = d.phone || d.whatsapp || d.telefono || d.celular || d['item_meta[685]'] || ''
          const birthVal = d.birth_date || d.fecha_nacimiento || d['item_meta[675]'] || d['item_meta[683]'] || ''
          const genderVal = d.gender || d.genero || d['item_meta[783]'] || ''

          const merge = (key: string) => {
            if (!key) return
            if (!playerDetailsLookup[key]) {
              playerDetailsLookup[key] = { email: '', phone: '', birthDate: '', gender: '', details: {} }
            }
            const current = playerDetailsLookup[key]
            if (!current.email && emailVal) current.email = emailVal
            if (!current.phone && phoneVal) current.phone = phoneVal
            if (!current.birthDate && birthVal) current.birthDate = birthVal
            if (!current.gender && genderVal) current.gender = genderVal
            current.details = { ...d, ...current.details }
          }

          if (uId) merge(uId)
        })
      }

      if (playersData) {
        const formattedPlayers: Player[] = playersData.map((p: any) => {
          const allContracts = p.contracts || []
          const activeContractRaw = allContracts.find((c: any) => c.status === 'active' || c.status === 'activo')
          
          let team = activeContractRaw?.teams?.name || 'Ninguno'
          let contractTimeLeft = 'No aplica'

          if (p.player_status === 'active' && activeContractRaw?.end_date) {
             const end = new Date(activeContractRaw.end_date)
             const now = new Date()
             const diffTime = end.getTime() - now.getTime()
             if (diffTime > 0) {
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
               contractTimeLeft = `${diffDays} días restantes`
             } else {
               contractTimeLeft = 'Expirado'
             }
          } else if (p.player_status === 'inactive' || p.player_status === 'banned') {
             team = 'Ninguno'
             contractTimeLeft = 'No aplica'
          }

          const activeContract: PlayerContractItem | null = activeContractRaw ? {
            id: activeContractRaw.id,
            team_id: activeContractRaw.team_id,
            teamName: activeContractRaw.teams?.name || 'Equipo',
            teamLogo: activeContractRaw.teams?.logo_url || '',
            status: activeContractRaw.status,
            roles: activeContractRaw.roles,
            team_gender_category: activeContractRaw.team_gender_category,
            start_date: activeContractRaw.start_date,
            end_date: activeContractRaw.end_date,
            conclusion_date: activeContractRaw.conclusion_date
          } : null

          const pastContracts: PlayerContractItem[] = allContracts
            .filter((c: any) => c.status === 'completado' || c.status === 'cancelado' || c.status === 'rejected')
            .map((c: any) => {
              const v = valMap[c.id]
              return {
                id: c.id,
                team_id: c.team_id,
                teamName: c.teams?.name || 'Equipo',
                teamLogo: c.teams?.logo_url || '',
                status: c.status,
                roles: c.roles,
                team_gender_category: c.team_gender_category,
                start_date: c.start_date,
                end_date: c.end_date,
                conclusion_date: c.conclusion_date,
                justification: v?.details?.justification || null,
                adminName: v?.details?.admin_nickname || v?.details?.admin_name || v?.submitted_by || null
              }
            })

          const playerCountry = p.country || (p.player_game_info && p.player_game_info[0]?.country_account) || extractCountry(p.closest_airport) || activeContractRaw?.teams?.country || 'México'

          const extra = playerDetailsLookup[p.id] || { email: '', phone: '', birthDate: '', gender: '', details: {} }

          // Búsqueda por nickname o nombre si falta algún campo
          if ((!extra.email || !extra.phone || !extra.birthDate || !extra.gender) && allValidations) {
            const pNick = (p.nickname || '').toLowerCase().trim()
            const pName = (p.name || '').toLowerCase().trim()

            for (const v of allValidations) {
              const tName = (v.target_name || '').toLowerCase().trim()
              const sub = (v.submitted_by || '').toLowerCase().trim()
              const vNick = (v.details?.nickname || '').toLowerCase().trim()
              const vName = (v.details?.name || '').toLowerCase().trim()

              const isMatch = (pNick && (tName.includes(pNick) || sub === pNick || vNick === pNick)) ||
                              (pName && (tName.includes(pName) || sub === pName || vName === pName))

              if (isMatch) {
                const d = v.details || {}
                const emailVal = d.email || d['item_meta[676]'] || (v.submitted_by && v.submitted_by.includes('@') ? v.submitted_by : '')
                const phoneVal = d.phone || d.whatsapp || d.telefono || d.celular || d['item_meta[685]'] || ''
                const birthVal = d.birth_date || d.fecha_nacimiento || d['item_meta[675]'] || d['item_meta[683]'] || ''
                const genderVal = d.gender || d.genero || d['item_meta[783]'] || ''

                if (!extra.email && emailVal) extra.email = emailVal
                if (!extra.phone && phoneVal) extra.phone = phoneVal
                if (!extra.birthDate && birthVal) extra.birthDate = birthVal
                if (!extra.gender && genderVal) extra.gender = genderVal
                extra.details = { ...d, ...extra.details }
              }
            }
          }

          const playerEmail = (p.email && p.email !== 'Sin correo') ? p.email : (extra.email || '')
          const playerPhone = extra.phone || ''
          const playerBirthDate = extra.birthDate || ''
          const playerGender = extra.gender || 'Masculino'

          return {
            id: p.id,
            name: p.name,
            email: playerEmail || 'Sin correo',
            phone: playerPhone,
            birthDate: playerBirthDate,
            gender: playerGender,
            contractTimeLeft,
            team,
            status: p.player_status || 'inactive',
            avatar: p.avatar_url,
            discord: p.discord_handle,
            country: playerCountry,
            created_at: p.created_at,
            is_featured: p.is_featured || false,
            rawDetails: {
              ...p,
              ...extra.details,
              email: playerEmail,
              phone: playerPhone,
              birth_date: playerBirthDate,
              gender: playerGender,
              country: playerCountry
            },
            activeContract,
            pastContracts
          }
        })
        setPlayers(formattedPlayers)
      }

      const { data: teamsData } = await supabase.from('teams').select('name')
      if (teamsData) {
        setAvailableTeams(teamsData.map(t => t.name))
      }

      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (selectedPlayer || actionModal || terminatingContract) {
      window.__lenis?.stop()
    } else {
      window.__lenis?.start()
    }
    return () => { window.__lenis?.start() }
  }, [selectedPlayer, actionModal, terminatingContract])

  const handleUpdateStatus = async () => {
    if (!actionModal) return
    const { error } = await supabase.from('profiles').update({ player_status: newStatus }).eq('id', actionModal.player.id)
    if (!error) {
      setPlayers(prev => prev.map(p => p.id === actionModal.player.id ? { ...p, status: newStatus } : p))
      setSelectedPlayer(prev => prev?.id === actionModal.player.id ? { ...prev, status: newStatus } : prev)
      toast.success('Estado del jugador actualizado correctamente')
    } else {
      toast.error('Error al actualizar estado: ' + error.message)
    }
    setActionModal(null)
  }

  const handleDeactivatePlayer = async (playerId: string, playerName: string) => {
    const { error } = await supabase.from('profiles').update({ player_status: 'inactive' }).eq('id', playerId)
    if (error) {
      toast.error('Error al desactivar el jugador: ' + error.message)
    } else {
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, status: 'inactive' } : p))
      setSelectedPlayer(prev => prev?.id === playerId ? { ...prev, status: 'inactive' } : prev)
      toast.success(`Jugador "${playerName}" desactivado. El registro se conserva y puede reactivarse.`)
    }
  }

  const handleReactivatePlayer = async (playerId: string, playerName: string) => {
    const { error } = await supabase.from('profiles').update({ player_status: 'active' }).eq('id', playerId)
    if (error) {
      toast.error('Error al reactivar el jugador: ' + error.message)
    } else {
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, status: 'active' } : p))
      setSelectedPlayer(prev => prev?.id === playerId ? { ...prev, status: 'active' } : prev)
      toast.success(`Jugador "${playerName}" reactivado correctamente a estado Activo.`)
    }
  }

  const handleToggleFeatured = async (playerId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    const { error } = await supabase.from('profiles').update({ is_featured: newStatus }).eq('id', playerId)
    if (!error) {
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, is_featured: newStatus } : p))
      toast.success(newStatus ? 'Marcado como Jugador Destacado' : 'Ya no es Jugador Destacado')
    } else {
      toast.error('Error al actualizar el estado destacado')
    }
  }

  const handleUpdateTeam = async () => {
    // Kept for backward compatibility but actual team changes happen via contracts
    setActionModal(null)
  }

  const openPlayerDetails = (player: Player) => {
    setSelectedPlayer(player)
    setEditingDetails({
      name: player.name || '',
      nickname: player.rawDetails?.nickname || '',
      game_nickname: player.rawDetails?.game_nickname || '',
      discord_handle: player.discord || player.rawDetails?.discord_handle || '',
      email: (player.email && player.email !== 'Sin correo') ? player.email : (player.rawDetails?.email || ''),
      phone: player.phone || player.rawDetails?.phone || '',
      birth_date: player.birthDate || player.rawDetails?.birth_date || '',
      gender: player.gender || player.rawDetails?.gender || 'Masculino',
      country: player.country || 'México',
      player_status: player.status || 'active',
      is_featured: Boolean(player.is_featured),
      passport_number: player.rawDetails?.passport_number || '',
      avatar_url: player.avatar || '',
      cover_url: player.rawDetails?.cover_url || '',
      id_photo_url: player.rawDetails?.id_photo_url || '',
      passport_photo_url: player.rawDetails?.passport_photo_url || '',
      social_x: player.rawDetails?.social_x || '',
      social_ig: player.rawDetails?.social_ig || '',
      social_tiktok: player.rawDetails?.social_tiktok || '',
      social_yt: player.rawDetails?.social_yt || '',
      social_twitch: player.rawDetails?.social_twitch || '',
      social_kick: player.rawDetails?.social_kick || '',
      social_fb: player.rawDetails?.social_fb || '',
    })
    setModalTab('profile')
  }

  const handleUploadPlayerMedia = async (file: File, fieldKey: string) => {
    try {
      toast.loading('Subiendo imagen...', { id: 'upload-player-media' })
      const fileExt = file.name.split('.').pop()
      const bucket = (fieldKey === 'avatar_url' || fieldKey === 'cover_url') ? 'avatars' : 'documents'
      const fileName = `player_${fieldKey}_${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file)
      if (error) throw error
      const { data: pUrl } = supabase.storage.from(bucket).getPublicUrl(data.path)
      setEditingDetails((prev: any) => ({ ...prev, [fieldKey]: pUrl.publicUrl }))
      toast.success('Imagen subida correctamente', { id: 'upload-player-media' })
    } catch (err: any) {
      console.error('Error uploading player media:', err)
      toast.error('Error al subir imagen: ' + (err?.message || 'Error desconocido'), { id: 'upload-player-media' })
    }
  }

  const handleSaveDetails = async () => {
    if (!selectedPlayer || !editingDetails) return
    const nameVal = formatPersonName(editingDetails.name || '').trim()
    const nickVal = formatNickname(editingDetails.nickname || '').trim()
    const gameNickVal = formatNickname(editingDetails.game_nickname || '').trim()
    const countryVal = editingDetails.country?.trim() || 'México'
    const emailVal = editingDetails.email?.trim() || ''
    const phoneVal = editingDetails.phone?.trim() || ''
    const birthVal = editingDetails.birth_date?.trim() || ''
    const genderVal = editingDetails.gender?.trim() || 'Masculino'

    const updates = {
      name: nameVal,
      nickname: nickVal,
      game_nickname: gameNickVal,
      discord_handle: editingDetails.discord_handle?.trim() || null,
      closest_airport: countryVal,
      player_status: editingDetails.player_status || 'active',
      is_featured: Boolean(editingDetails.is_featured),
      passport_number: editingDetails.passport_number?.trim() || null,
      avatar_url: editingDetails.avatar_url?.trim() || null,
      cover_url: editingDetails.cover_url?.trim() || null,
      id_photo_url: editingDetails.id_photo_url?.trim() || null,
      passport_photo_url: editingDetails.passport_photo_url?.trim() || null,
      social_x: editingDetails.social_x?.trim() || null,
      social_ig: editingDetails.social_ig?.trim() || null,
      social_tiktok: editingDetails.social_tiktok?.trim() || null,
      social_yt: editingDetails.social_yt?.trim() || null,
      social_twitch: editingDetails.social_twitch?.trim() || null,
      social_kick: editingDetails.social_kick?.trim() || null,
      social_fb: editingDetails.social_fb?.trim() || null,
    }

    const { error } = await supabase.from('profiles').update(updates).eq('id', selectedPlayer.id)
    if (!error) {
      // Sincronizar en tabla validations para mantener email, phone, birth_date, gender
      try {
        const { data: userVal } = await supabase
          .from('validations')
          .select('*')
          .eq('type', 'jugador')
          .or(`details->>user_id.eq.${selectedPlayer.id},id.eq.${selectedPlayer.id},details->>id.eq.${selectedPlayer.id}`)
          .limit(1)

        if (userVal && userVal.length > 0) {
          await supabase.from('validations').update({
            submitted_by: emailVal || userVal[0].submitted_by,
            details: {
              ...userVal[0].details,
              email: emailVal,
              phone: phoneVal,
              birth_date: birthVal,
              gender: genderVal,
              nickname: nickVal,
              name: nameVal,
              country: countryVal
            }
          }).eq('id', userVal[0].id)
        } else {
          await supabase.from('validations').insert({
            type: 'jugador',
            target_name: nickVal || nameVal || selectedPlayer.name,
            submitted_by: emailVal || nameVal,
            status: updates.player_status || 'active',
            details: {
              user_id: selectedPlayer.id,
              name: nameVal,
              nickname: nickVal,
              email: emailVal,
              phone: phoneVal,
              birth_date: birthVal,
              gender: genderVal,
              country: countryVal
            }
          })
        }
      } catch (vErr) {
        console.warn('Error sincronizando validations:', vErr)
      }

      toast.success('Datos del jugador actualizados correctamente.')
      setPlayers(prev => prev.map(p => p.id === selectedPlayer.id ? { 
        ...p, 
        name: nameVal,
        email: emailVal || p.email,
        phone: phoneVal,
        birthDate: birthVal,
        gender: genderVal,
        avatar: updates.avatar_url || p.avatar,
        discord: updates.discord_handle,
        country: countryVal,
        status: updates.player_status,
        is_featured: updates.is_featured,
        rawDetails: { 
          ...p.rawDetails, 
          ...updates, 
          email: emailVal,
          phone: phoneVal,
          birth_date: birthVal,
          gender: genderVal,
          country: countryVal 
        }
      } : p))
      setSelectedPlayer(null)
    } else {
      console.error('Error saving player:', error)
      toast.error('Error guardando los datos: ' + error.message)
    }
  }

  const handleAdminTerminateContract = async () => {
    if (!terminatingContract) return
    const trimmed = terminationJustification.trim()
    if (!trimmed || trimmed.length < 5) {
      toast.error('La justificación es obligatoria (mínimo 5 caracteres).')
      return
    }

    setSubmittingTermination(true)
    toast.loading('Aplicando baja administrativa inmediata...', { id: 'admin-term' })

    try {
      // 1. Actualizar contrato a completado inmediatamente
      const { error: contractError } = await supabase
        .from('contracts')
        .update({
          status: 'completado',
          conclusion_date: new Date().toISOString()
        })
        .eq('id', terminatingContract.contractId)

      if (contractError) throw contractError

      const adminNick = user?.nickname || user?.name || user?.email || 'Administrador'

      // 2. Registrar en validations con la justificación obligatoria
      const { error: validationError } = await supabase
        .from('validations')
        .insert({
          type: 'baja_contrato',
          target_name: `Baja Administrativa: ${terminatingContract.playerName} (${terminatingContract.teamName})`,
          submitted_by: adminNick,
          status: 'approved',
          details: {
            contract_id: terminatingContract.contractId,
            player_id: terminatingContract.playerId,
            player_name: terminatingContract.playerName,
            team_id: terminatingContract.teamId,
            team_name: terminatingContract.teamName,
            justification: trimmed,
            admin_id: user?.id,
            admin_nickname: adminNick,
            admin_name: adminNick,
            conclusion_date: new Date().toISOString()
          }
        })

      if (validationError) {
        console.error('Error logging termination validation:', validationError)
      }

      toast.success('Baja Administrativa Realizada', {
        id: 'admin-term',
        description: `Se dio de baja inmediatamente el contrato de ${terminatingContract.playerName}. La justificación quedó registrada.`
      })

      const newPastItem: PlayerContractItem = {
        id: terminatingContract.contractId,
        team_id: terminatingContract.teamId,
        teamName: terminatingContract.teamName,
        status: 'completado',
        roles: selectedPlayer?.activeContract?.roles || [],
        team_gender_category: selectedPlayer?.activeContract?.team_gender_category,
        start_date: selectedPlayer?.activeContract?.start_date || null,
        end_date: selectedPlayer?.activeContract?.end_date || null,
        conclusion_date: new Date().toISOString(),
        justification: trimmed,
        adminName: user?.name || user?.email || 'Administrador'
      }

      setPlayers(prev => prev.map(p => {
        if (p.id === terminatingContract.playerId) {
          return {
            ...p,
            team: 'Ninguno',
            contractTimeLeft: 'No aplica',
            activeContract: null,
            pastContracts: [newPastItem, ...(p.pastContracts || [])]
          }
        }
        return p
      }))

      if (selectedPlayer && selectedPlayer.id === terminatingContract.playerId) {
        setSelectedPlayer({
          ...selectedPlayer,
          team: 'Ninguno',
          contractTimeLeft: 'No aplica',
          activeContract: null,
          pastContracts: [newPastItem, ...(selectedPlayer.pastContracts || [])]
        })
      }

      setTerminatingContract(null)
      setTerminationJustification('')
    } catch (err: any) {
      console.error('Error in admin contract termination:', err)
      toast.error('Error al dar de baja el contrato: ' + (err?.message || 'Error inesperado'), { id: 'admin-term' })
    } finally {
      setSubmittingTermination(false)
    }
  }

  const exportToCSV = () => {
    const toExport = players.filter(p => selectedIds.has(p.id))
    if (toExport.length === 0) return alert('Selecciona al menos un jugador para exportar.')
    downloadPlayersCSV(toExport, 'jugadores_seleccionados')
  }

  const exportAllToCSV = () => {
    const toExport = filteredAndSortedPlayers
    if (toExport.length === 0) return alert('No hay jugadores para exportar con los filtros actuales.')
    const suffix = filterTeam !== 'all' ? `_equipo_${filterTeam}` :
                   filterStatus !== 'all' ? `_estado_${filterStatus}` :
                   filterCountry !== 'all' ? `_pais_${filterCountry}` : '_todos'
    downloadPlayersCSV(toExport, `jugadores${suffix}`)
  }

  const downloadPlayersCSV = (list: Player[], baseName: string) => {
    const date = new Date()
    const dateStr = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`
    const headers = [
      'Nombre',
      'Nickname',
      'Discord',
      'Email',
      'Pais',
      'Estado',
      'Equipo',
      'Contrato Vence',
      'Telefono',
      'Fecha Nacimiento',
      'Genero',
      'Foto de Perfil (URL)',
      'Documento Identidad (URL)',
      'Pasaporte (URL)',
      'Num. Pasaporte / Documento'
    ]
    const csvContent = [
      headers.join(','),
      ...list.map(p => {
        const d = p.rawDetails || {}
        // Email: evitar que salga el placeholder 'Sin correo'
        const emailVal = (p.email && p.email !== 'Sin correo') ? p.email : (d.email && d.email !== 'Sin correo' ? d.email : '')
        // Teléfono: buscar en p y d con fallbacks
        const phoneVal = p.phone || d.phone || d.whatsapp || d.telefono || d.celular || d['item_meta[685]'] || ''
        // Fecha de Nacimiento: buscar en p y d con fallbacks
        const birthVal = p.birthDate || d.birth_date || d.fecha_nacimiento || d['item_meta[675]'] || d['item_meta[683]'] || ''
        // Género: buscar en p y d con fallbacks
        const genderVal = p.gender || d.gender || d.genero || d['item_meta[783]'] || ''
        // País: usar el campo directo del jugador, fallback a rawDetails
        const countryVal = p.country || d.country || ''
        // Avatar/foto del jugador — campo directo mapeado
        const avatarVal = p.avatar || d.avatar_url || ''
        return [
          `"${(p.name || '').replace(/"/g, '""')}"`,
          `"${(d.nickname || p.rawDetails?.nickname || '').replace(/"/g, '""')}"`,
          `"${(p.discord || '').replace(/"/g, '""')}"`,
          `"${emailVal.replace(/"/g, '""')}"`,
          `"${countryVal.replace(/"/g, '""')}"`,
          `"${(p.status || '').replace(/"/g, '""')}"`,
          `"${(p.team || '').replace(/"/g, '""')}"`,
          `"${(p.contractTimeLeft || '').replace(/"/g, '""')}"`,
          `"${phoneVal.replace(/"/g, '""')}"`,
          `"${birthVal.replace(/"/g, '""')}"`,
          `"${genderVal.replace(/"/g, '""')}"`,
          `"${avatarVal}"`,
          `"${(d.id_photo_url || '')}"`,
          `"${(d.passport_photo_url || '')}"`,
          `"${(d.passport_number || '').replace(/"/g, '""')}"`
        ].join(',')
      })
    ].join('\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `${baseName}_${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Unique values for filters — exclude 'Ninguno' from teams (handled separately)
  const uniqueTeams = useMemo(() =>
    Array.from(new Set(players.map(p => p.team).filter(t => Boolean(t) && t !== 'Ninguno')))
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
  , [players])

  const uniqueCountries = useMemo(() =>
    Array.from(new Set(players.map(p => p.country).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
  , [players])

  const filteredAndSortedPlayers = useMemo(() => {
    let result = players.filter(p => {
      if (filterTeam === 'none') {
        if (p.team !== 'Ninguno') return false
      } else if (filterTeam !== 'all') {
        if (p.team !== filterTeam) return false
      }
      if (filterStatus !== 'all' && p.status !== filterStatus) return false
      if (filterCountry !== 'all' && p.country !== filterCountry) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.discord && p.discord.toLowerCase().includes(q)) ||
          (p.rawDetails?.nickname && p.rawDetails.nickname.toLowerCase().includes(q)) ||
          (p.rawDetails?.game_nickname && p.rawDetails.game_nickname.toLowerCase().includes(q)) ||
          (p.team && p.team.toLowerCase().includes(q)) ||
          (p.country && p.country.toLowerCase().includes(q))
        )
      }
      return true
    })

    // Custom sorting: active > inactive > banned, then by date descending
    const statusWeight = { active: 3, inactive: 2, banned: 1 }
    result.sort((a, b) => {
      const weightA = statusWeight[a.status] || 0
      const weightB = statusWeight[b.status] || 0
      if (weightA !== weightB) {
        return weightB - weightA
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return result
  }, [players, filterTeam, filterStatus, filterCountry, searchQuery])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        
        {/* Header & Filters */}
        <div className="flex flex-col gap-4 mb-8">

          {/* Fila 1: Título + Botones */}
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white shrink-0">
              Jugadores
            </h2>
            <GmxButton
              onClick={exportAllToCSV}
              className="h-9 px-3 gap-2 text-xs"
              variant="secondary"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar Todo ({filteredAndSortedPlayers.length})
            </GmxButton>
            {selectedIds.size > 0 && (
              <GmxButton onClick={exportToCSV} className="h-9 px-3 gap-2 text-xs" variant="secondary">
                <Download className="w-3.5 h-3.5" />
                Selección ({selectedIds.size})
              </GmxButton>
            )}
          </div>

          {/* Fila 2: Búsqueda + Filtros */}
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Buscar por nickname, nombre, email o discord..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full sm:w-60 rounded-md border border-border bg-background px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />

            <div className="relative">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="appearance-none rounded-lg border border-border bg-background px-4 py-2.5 pr-9 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/50 transition-colors cursor-pointer font-500"
              >
                <option value="all">Todos los Estados</option>
                <option value="active">Activos</option>
                <option value="approved">Aprobados</option>
                <option value="pending">En Revisión</option>
                <option value="rejected">Rechazados</option>
                <option value="inactive">Inactivos</option>
                <option value="banned">Baneados</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            <div className="relative">
              <select
                value={filterTeam}
                onChange={e => setFilterTeam(e.target.value)}
                className="appearance-none rounded-lg border border-border bg-background px-4 py-2.5 pr-9 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/50 transition-colors cursor-pointer font-500"
              >
                <option value="all">Todos los Equipos</option>
                <option value="none">Sin Equipo</option>
                {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            <div className="relative">
              <select
                value={filterCountry}
                onChange={e => setFilterCountry(e.target.value)}
                className="appearance-none rounded-lg border border-border bg-background px-4 py-2.5 pr-9 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/50 transition-colors cursor-pointer font-500"
              >
                <option value="all">Todos los Países</option>
                {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground animate-pulse">Cargando jugadores...</p>
          </div>
        ) : filteredAndSortedPlayers.length === 0 ? (
          <div className="flex justify-center items-center py-12 border border-dashed border-border rounded-lg bg-background/50">
            <p className="text-muted-foreground">No hay jugadores que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAndSortedPlayers.map(player => (
              <div key={player.id} className="relative flex flex-col rounded-lg border border-border bg-background p-5 hover:border-primary/50 transition-colors">
                <div className="absolute top-4 right-4 z-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(player.id)}
                    onChange={(e) => {
                      const newSet = new Set(selectedIds)
                      if (e.target.checked) newSet.add(player.id)
                      else newSet.delete(player.id)
                      setSelectedIds(newSet)
                    }}
                    className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
                  />
                </div>
                <div className="flex items-start gap-4">
                  <img 
                    src={player.avatar || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                    alt={player.name} 
                    className={cn(
                      "h-12 w-12 rounded-full border border-border object-cover",
                      player.status === 'banned' ? 'grayscale opacity-50' : ''
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={cn("font-600 truncate", player.status === 'banned' ? 'text-red-500 line-through' : 'text-white')}>{player.name}</h3>
                      {player.status === 'active' && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Activo" />
                      )}
                      {player.status === 'inactive' && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-yellow-500 shrink-0" title="Inactivo" />
                      )}
                      {player.status === 'banned' && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-red-500 shrink-0" title="Baneado" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
                      <span className="truncate">{player.discord || 'Sin Discord'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate">{player.team}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate">{player.contractTimeLeft}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Globe className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate">{player.country}</span>
                    </div>
                  </div>
                  
                  {/* Acciones Rápidas */}
                  <div className="flex items-center gap-2 mt-2">
                    {isVisitor ? (
                      <button
                        onClick={() => openPlayerDetails(player)}
                        title="Ver Información y Documentos"
                        className="flex-1 flex h-8 items-center justify-center gap-1.5 rounded bg-surface border border-sky-500/30 text-xs font-500 text-sky-300 hover:bg-sky-500/10 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> Ver Información
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleToggleFeatured(player.id, player.is_featured)}
                          title={player.is_featured ? "Quitar de Destacados" : "Marcar como Destacado"}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded border transition-colors",
                            player.is_featured 
                              ? "border-amber-500/50 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" 
                              : "border-border bg-surface text-muted-foreground hover:text-amber-500 hover:border-amber-500/50"
                          )}
                        >
                          <Star className={cn("h-3 w-3", player.is_featured && "fill-current")} />
                        </button>
                        <button
                          onClick={() => openPlayerDetails(player)}
                          title="Ver Detalles Completos y Editar"
                          className="flex-1 flex h-8 items-center justify-center gap-1 rounded bg-surface border border-border text-xs font-500 text-white hover:bg-white/5 transition-colors"
                        >
                          <Eye className="h-3 w-3" /> Detalles / Editar
                        </button>
                        {player.status === 'inactive' ? (
                          <button
                            onClick={() => handleReactivatePlayer(player.id, player.name)}
                            title="Reactivar Jugador"
                            className="flex h-8 w-8 items-center justify-center rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeactivatePlayer(player.id, player.name)}
                            title="Desactivar Jugador (conserva su registro)"
                            className="flex h-8 w-8 items-center justify-center rounded border border-border bg-surface text-muted-foreground hover:text-amber-400 hover:border-amber-500/40 transition-colors"
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setActionModal({ type: 'status', player })
                            setNewStatus(player.status)
                          }}
                          title="Cambiar Estado Avanzado"
                          className="flex h-8 w-8 items-center justify-center rounded border border-border bg-surface text-muted-foreground hover:text-white transition-colors"
                        >
                          <Ban className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details / Edit Modal */}
      {selectedPlayer && editingDetails && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedPlayer(null)} />
          <div className="relative flex flex-col w-full max-w-2xl h-[90vh] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex shrink-0 items-center justify-between border-b border-border p-6 bg-surface z-10">
              <div>
                <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Jugador: {selectedPlayer.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedPlayer.email} {selectedPlayer.rawDetails?.nickname ? `• IGN: ${selectedPlayer.rawDetails.nickname}` : ''}
                </p>
              </div>
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="text-muted-foreground hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Pestañas de Navegación del Modal */}
            <div className="flex border-b border-border bg-background/50 px-6 pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setModalTab('profile')}
                className={cn(
                  "px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px flex items-center gap-2",
                  modalTab === 'profile'
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-white"
                )}
              >
                <User className="w-4 h-4" />
                Datos de Perfil
              </button>
              <button
                type="button"
                onClick={() => setModalTab('contracts')}
                className={cn(
                  "px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px flex items-center gap-2",
                  modalTab === 'contracts'
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-white"
                )}
              >
                <FileText className="w-4 h-4" />
                Contratos y Bajas
                {selectedPlayer.activeContract && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold">
                    1 Activo
                  </span>
                )}
              </button>
            </div>

            {/* Body con Scroll */}
            <div data-lenis-prevent data-modal-scrollbody className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6">
              {modalTab === 'profile' ? (
                <div className="space-y-6">
                  {/* SECCIÓN 1: Identidad y Juego */}
                  <div className="rounded-xl border border-border bg-background/50 p-5 space-y-4">
                    <h4 className="text-xs font-700 uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/60 pb-3">
                      <User className="w-4 h-4" />
                      Datos de Identidad y Gaming
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-600 text-muted-foreground uppercase">Nombre Completo</label>
                        <input
                          type="text"
                          value={editingDetails.name || ''}
                          onChange={(e) => setEditingDetails({ ...editingDetails, name: formatPersonName(e.target.value) })}
                          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                          placeholder="Nombre y Apellidos"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-600 text-muted-foreground uppercase">Nickname / Apodo</label>
                        <input
                          type="text"
                          value={editingDetails.nickname || ''}
                          onChange={(e) => setEditingDetails({ ...editingDetails, nickname: formatNickname(e.target.value) })}
                          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                          placeholder="Nickname"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-600 text-muted-foreground uppercase">Nombre en Juego (IGN)</label>
                        <input
                          type="text"
                          value={editingDetails.game_nickname || ''}
                          onChange={(e) => setEditingDetails({ ...editingDetails, game_nickname: formatNickname(e.target.value) })}
                          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                          placeholder="IGN"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-600 text-muted-foreground uppercase">Usuario de Discord</label>
                        <input
                          type="text"
                          value={editingDetails.discord_handle || ''}
                          onChange={(e) => setEditingDetails({ ...editingDetails, discord_handle: e.target.value })}
                          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="ej. usuario#1234 o usuario"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-600 text-muted-foreground uppercase">Correo Electrónico (Email)</label>
                        <input
                          type="email"
                          value={editingDetails.email || ''}
                          onChange={(e) => setEditingDetails({ ...editingDetails, email: e.target.value })}
                          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="correo@ejemplo.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-600 text-muted-foreground uppercase">Teléfono / WhatsApp</label>
                        <input
                          type="tel"
                          value={editingDetails.phone || ''}
                          onChange={(e) => setEditingDetails({ ...editingDetails, phone: e.target.value })}
                          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="+52 55 1234 5678"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-600 text-muted-foreground uppercase">Fecha de Nacimiento</label>
                        <input
                          type="date"
                          value={editingDetails.birth_date || ''}
                          onChange={(e) => setEditingDetails({ ...editingDetails, birth_date: e.target.value })}
                          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-600 text-muted-foreground uppercase">Género</label>
                        <div className="relative">
                          <select
                            value={editingDetails.gender || 'Masculino'}
                            onChange={(e) => setEditingDetails({ ...editingDetails, gender: e.target.value })}
                            className="w-full appearance-none rounded-lg border border-border bg-surface px-3.5 py-2 pr-9 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-500"
                          >
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 2: Ubicación y Estado */}
                  <div className="rounded-xl border border-border bg-background/50 p-5 space-y-4">
                    <h4 className="text-xs font-700 uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/60 pb-3">
                      <Globe className="w-4 h-4" />
                      Ubicación y Estado en la Plataforma
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-600 text-muted-foreground uppercase">País de Residencia</label>
                        <div className="relative">
                          <select
                            value={editingDetails.country || 'México'}
                            onChange={(e) => setEditingDetails({ ...editingDetails, country: e.target.value })}
                            className="w-full appearance-none rounded-lg border border-border bg-surface px-3.5 py-2 pr-9 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-500"
                          >
                            {DEFAULT_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-600 text-muted-foreground uppercase">Estado del Jugador</label>
                        <div className="relative">
                          <select
                            value={editingDetails.player_status || 'active'}
                            onChange={(e) => setEditingDetails({ ...editingDetails, player_status: e.target.value })}
                            className="w-full appearance-none rounded-lg border border-border bg-surface px-3.5 py-2 pr-9 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-500"
                          >
                            <option value="active">Activo</option>
                            <option value="inactive">Inactivo</option>
                            <option value="banned">Baneado</option>
                            <option value="pending">Pendiente</option>
                            <option value="rejected">Rechazado</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-600 text-muted-foreground uppercase">Jugador Destacado en Inicio</label>
                        <div className="relative">
                          <select
                            value={editingDetails.is_featured ? 'true' : 'false'}
                            onChange={(e) => setEditingDetails({ ...editingDetails, is_featured: e.target.value === 'true' })}
                            className="w-full appearance-none rounded-lg border border-border bg-surface px-3.5 py-2 pr-9 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-500"
                          >
                            <option value="true">Sí (Destacado)</option>
                            <option value="false">No</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-600 text-muted-foreground uppercase">Nº Pasaporte / Documento</label>
                        <input
                          type="text"
                          value={editingDetails.passport_number || ''}
                          onChange={(e) => setEditingDetails({ ...editingDetails, passport_number: e.target.value })}
                          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Número oficial"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 3: Redes Sociales */}
                  <div className="rounded-xl border border-border bg-background/50 p-5 space-y-4">
                    <h4 className="text-xs font-700 uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/60 pb-3">
                      <Globe className="w-4 h-4" />
                      Redes Sociales
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { key: 'social_x', label: 'X (Twitter)', placeholder: 'https://x.com/...' },
                        { key: 'social_ig', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                        { key: 'social_tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
                        { key: 'social_yt', label: 'YouTube', placeholder: 'https://youtube.com/@...' },
                        { key: 'social_twitch', label: 'Twitch', placeholder: 'https://twitch.tv/...' },
                        { key: 'social_kick', label: 'Kick', placeholder: 'https://kick.com/...' },
                        { key: 'social_fb', label: 'Facebook', placeholder: 'https://facebook.com/...' },
                      ].map((s) => (
                        <div key={s.key} className="space-y-1.5">
                          <label className="text-xs font-600 text-muted-foreground uppercase">{s.label}</label>
                          <input
                            type="text"
                            value={editingDetails[s.key] || ''}
                            onChange={(e) => setEditingDetails({ ...editingDetails, [s.key]: e.target.value })}
                            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder={s.placeholder}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECCIÓN 4: Fotografías y Documentos */}
                  <div className="rounded-xl border border-border bg-background/50 p-5 space-y-4">
                    <h4 className="text-xs font-700 uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/60 pb-3">
                      <ImageIcon className="w-4 h-4" />
                      Archivos e Imágenes Oficiales
                    </h4>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {[
                        { key: 'avatar_url', label: 'Foto de Perfil' },
                        { key: 'cover_url', label: 'Foto de Portada' },
                        { key: 'id_photo_url', label: 'Documento INE / DNI' },
                        { key: 'passport_photo_url', label: 'Foto de Pasaporte' }
                      ].map((item) => {
                        const url = editingDetails[item.key] || ''
                        return (
                          <div key={item.key} className="space-y-3">
                            <label className="text-xs font-600 text-muted-foreground uppercase block">{item.label}</label>
                            <div className="relative w-full h-36 rounded-xl border border-border bg-surface overflow-hidden flex items-center justify-center group">
                              {url ? (
                                <img src={url} alt={item.label} className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-center p-3 text-muted-foreground text-xs">
                                  <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                                  Sin imagen
                                </div>
                              )}
                              {url && (
                                <button
                                  type="button"
                                  onClick={() => setLightboxImage({ src: url, label: item.label })}
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs text-white font-semibold"
                                >
                                  <ZoomIn className="w-4 h-4" /> Agrandar
                                </button>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] text-muted-foreground font-500 block">Subir archivo nuevo:</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleUploadPlayerMedia(e.target.files[0], item.key)
                                  }
                                }}
                                className="w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] text-muted-foreground font-500 block">O URL directa:</label>
                              <input
                                type="text"
                                value={url}
                                onChange={(e) => setEditingDetails({ ...editingDetails, [item.key]: e.target.value })}
                                className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-white focus:border-primary focus:outline-none"
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Contrato Activo */}
                  <div>
                    <h4 className="text-xs font-700 uppercase tracking-wider text-primary mb-3">
                      Contrato Activo
                    </h4>
                    {selectedPlayer.activeContract ? (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {selectedPlayer.activeContract.teamLogo ? (
                              <img 
                                src={selectedPlayer.activeContract.teamLogo} 
                                alt={selectedPlayer.activeContract.teamName} 
                                className="w-12 h-12 rounded-lg object-cover border border-border bg-background"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-surface border border-border flex items-center justify-center text-primary font-bold">
                                {selectedPlayer.activeContract.teamName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h5 className="font-bold text-white text-base">
                                {selectedPlayer.activeContract.teamName}
                              </h5>
                              <span className="text-xs text-muted-foreground">
                                {selectedPlayer.activeContract.team_gender_category === 'female' ? 'División Femenil' : 'División Varonil / Mixta'}
                              </span>
                            </div>
                          </div>

                          {!isVisitor && (
                            <button
                              type="button"
                              onClick={() => {
                                setTerminatingContract({
                                  contractId: selectedPlayer.activeContract!.id,
                                  playerId: selectedPlayer.id,
                                  playerName: selectedPlayer.name,
                                  teamId: selectedPlayer.activeContract!.team_id,
                                  teamName: selectedPlayer.activeContract!.teamName
                                })
                                setTerminationJustification('')
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 transition-colors shadow-sm"
                              title="Dar de baja contrato administrativamente"
                            >
                              <UserX className="w-4 h-4" />
                              <span>Dar de Baja Contrato</span>
                            </button>
                          )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 pt-3 border-t border-border/60 text-xs">
                          <div>
                            <span className="text-muted-foreground block text-[11px]">Roles asignados:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Array.isArray(selectedPlayer.activeContract.roles) && selectedPlayer.activeContract.roles.length > 0 ? (
                                selectedPlayer.activeContract.roles.map((r: any, rIdx: number) => (
                                  <span key={rIdx} className="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs text-primary font-medium">
                                    {formatRoleTitle(r)}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[11px]">Vencimiento:</span>
                            <span className="text-white font-medium mt-1 block">
                              {selectedPlayer.activeContract.end_date ? new Date(selectedPlayer.activeContract.end_date).toLocaleDateString() : 'Indefinido'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-border rounded-lg bg-background/50">
                        <p className="text-muted-foreground text-xs">El jugador no cuenta con un contrato activo actualmente.</p>
                      </div>
                    )}
                  </div>

                  {/* Historial de Contratos Pasados y Bajas */}
                  <div className="border-t border-border pt-6">
                    <h4 className="text-xs font-700 uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                      <span>Historial de Contratos y Bajas</span>
                      <span className="text-xs font-normal">
                        {selectedPlayer.pastContracts?.length || 0} en registro
                      </span>
                    </h4>

                    {(!selectedPlayer.pastContracts || selectedPlayer.pastContracts.length === 0) ? (
                      <div className="text-center py-6 border border-dashed border-border rounded-lg bg-background/50">
                        <p className="text-muted-foreground text-xs">No hay registro de contratos anteriores finalizados o dados de baja.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedPlayer.pastContracts.map((past, pIdx) => (
                          <div key={pIdx} className="rounded-lg border border-border bg-background p-3.5 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold text-white text-sm">{past.teamName}</span>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                  past.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-muted-foreground'
                                )}>
                                  {past.status === 'rejected' ? 'Rechazado' : 'Concluido / Baja'}
                                </span>
                                {past.conclusion_date && (
                                  <span className="text-[11px] text-muted-foreground">
                                    {new Date(past.conclusion_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            {past.justification ? (
                              <div className="rounded bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-200">
                                <div className="flex items-center justify-between font-semibold text-[11px] uppercase tracking-wider text-amber-400 mb-1">
                                  <span>Justificación Administrativa</span>
                                  {past.adminName && <span>Por: {past.adminName}</span>}
                                </div>
                                <p className="italic">"{past.justification}"</p>
                              </div>
                            ) : (
                              <p className="text-[11px] text-muted-foreground italic">
                                Concluido por expiración o acuerdo mutuo sin baja administrativa forzada.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Fijo */}
            <div className="flex shrink-0 items-center justify-between border-t border-border p-6 bg-surface z-10 gap-4">
              {isVisitor ? (
                <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-2 text-xs text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3.5 py-2.5 rounded-lg w-full sm:w-auto">
                    <Eye className="w-4 h-4 shrink-0" />
                    <span>Modo Consulta (Admin Visitante): Puedes consultar la información y descargar imágenes o reportes. No se permite edición.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPlayer(null)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-border text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/5 transition-colors text-center"
                  >
                    Cerrar
                  </button>
                </div>
              ) : modalTab === 'profile' ? (
                <div className="flex justify-end w-full">
                  <GmxButton
                    variant="secondary"
                    onClick={handleSaveDetails}
                    className="gap-2 px-6"
                  >
                    <Save className="w-4 h-4" />
                    GUARDAR CAMBIOS
                  </GmxButton>
                </div>
              ) : (
                <div className="flex justify-end w-full">
                  <button
                    type="button"
                    onClick={() => setSelectedPlayer(null)}
                    className="px-6 py-2.5 rounded-lg border border-border text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/5 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Baja de Contrato Administrativa con Justificación Obligatoria */}
      {terminatingContract && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => !submittingTermination && setTerminatingContract(null)} 
          />
          <div className="relative w-full max-w-lg rounded-xl border border-red-500/30 bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-400 mb-4 pb-3 border-b border-border">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold uppercase tracking-tight text-white">
                  Baja Administrativa de Contrato
                </h3>
                <p className="text-xs text-muted-foreground">
                  Acción directa de administrador • Ejecución automática
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-lg border border-border bg-background/80 p-3 text-xs space-y-1">
                <div className="text-white">
                  <span className="text-muted-foreground">Jugador:</span>{' '}
                  <span className="font-semibold text-primary">{terminatingContract.playerName}</span>
                </div>
                <div className="text-white">
                  <span className="text-muted-foreground">Equipo:</span>{' '}
                  <span className="font-semibold">{terminatingContract.teamName}</span>
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200/90 leading-relaxed">
                ℹ️ <strong className="text-amber-300">Aviso:</strong> Como administrador, esta baja se aplicará <strong>automáticamente e inmediatamente</strong> sin requerir confirmación del manager o del jugador. <strong>El registro del contrato se mantendrá intacto en el historial</strong> junto con el motivo ingresado.
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white mb-1.5">
                  Motivo / Justificación de la Baja <span className="text-red-400">* (Obligatorio)</span>
                </label>
                <textarea
                  value={terminationJustification}
                  onChange={(e) => setTerminationJustification(e.target.value)}
                  placeholder="Escribe obligatoriamente el motivo de la baja administrativa (mínimo 5 caracteres)..."
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm text-white placeholder:text-muted-foreground/60 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                />
                <div className="flex justify-between items-center mt-1 text-[11px] text-muted-foreground">
                  <span>Mínimo 5 caracteres</span>
                  <span className={terminationJustification.trim().length >= 5 ? 'text-emerald-400' : 'text-amber-400'}>
                    {terminationJustification.trim().length} caracteres
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={submittingTermination}
                  onClick={() => {
                    setTerminatingContract(null)
                    setTerminationJustification('')
                  }}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-white rounded-lg border border-border hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={submittingTermination || terminationJustification.trim().length < 5}
                  onClick={handleAdminTerminateContract}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
                >
                  <UserX className="w-4 h-4" />
                  {submittingTermination ? 'Aplicando Baja...' : 'Confirmar Baja Inmediata'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal (Status / Team Edit) */}
      {actionModal && (
        <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActionModal(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white mb-4">
              {actionModal.type === 'status' ? 'Modificar Estado' : 'Asignar Equipo'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Modificando al jugador: <strong className="text-white">{actionModal.player.name}</strong>
            </p>

            {actionModal.type === 'status' ? (
              <div className="space-y-4 mb-8">
                <label className="text-xs font-700 uppercase tracking-wider text-primary block">Nuevo Estado</label>
                <div className="relative">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-3 pr-10 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/50 transition-colors cursor-pointer font-500"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="banned">Baneado</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {newStatus === 'banned' && (
                  <p className="text-xs text-red-400">El jugador no podrá iniciar sesión si es baneado.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                <label className="text-xs font-700 uppercase tracking-wider text-primary block">Seleccionar Equipo</label>
                <div className="relative">
                  <select
                    value={newTeam}
                    onChange={(e) => setNewTeam(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-3 pr-10 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/50 transition-colors cursor-pointer font-500"
                  >
                    <option value="">Ninguno / Sin Equipo</option>
                    {availableTeams.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => setActionModal(null)}
                className="flex-1 rounded-lg border border-border bg-transparent px-4 py-3 font-display text-xs font-600 uppercase tracking-widest text-muted-foreground transition-colors hover:text-white hover:border-primary/50"
              >
                CANCELAR
              </button>
              <GmxButton onClick={actionModal.type === 'status' ? handleUpdateStatus : handleUpdateTeam} className="flex-1 px-4 py-3">
                GUARDAR CAMBIOS
              </GmxButton>
            </div>
          </div>
        </div>
      )}
      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/95 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            className="absolute right-6 top-6 text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 z-10"
            onClick={() => setLightboxImage(null)}
          >
            <X className="w-7 h-7" />
          </button>
          <p className="absolute top-6 left-6 text-xs font-600 uppercase tracking-widest text-white/50">
            {lightboxImage.label}
          </p>
          <img 
            src={lightboxImage.src} 
            alt={lightboxImage.label} 
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
