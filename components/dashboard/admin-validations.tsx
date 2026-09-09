'use client'

import { useState, useEffect } from 'react'
import { Check, X, UserCheck, ShieldCheck, ScrollText, Eye, FileText, Image as ImageIcon, AlertCircle, Maximize2, ZoomIn, Search, Trash2, Save, Edit3, UserCog, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { GmxButton } from '@/components/gmx-button'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre Completo',
  nickname: 'Nickname / Apodo',
  game_nickname: 'Nombre en Juego (IGN)',
  discord_handle: 'Usuario de Discord',
  avatar_url: 'Foto de Perfil',
  closest_airport: 'País / Aeropuerto',
  country: 'País de Residencia',
  bio: 'Biografía / Descripción',
  description: 'Descripción',
  passport_number: 'Nº Pasaporte / Documento',
  id_photo_url: 'Documento de Identidad (DNI/INE)',
  passport_photo_url: 'Foto del Pasaporte',
  jersey_url: 'Diseño de Camiseta (Jersey)',
  logo_url: 'Logo del Equipo',
  tag: 'Tag / Siglas del Equipo',
  hashtag: 'Hashtag Oficial',
  game: 'Juego Principal',
  game_id: 'ID de Cuenta / Juego',
  server: 'Servidor / Región',
  country_account: 'País de la Cuenta',
  games: 'Juegos',
  social_ig: 'Instagram',
  social_tiktok: 'TikTok',
  social_yt: 'YouTube',
  social_twitch: 'Twitch',
  social_kick: 'Kick',
  social_x: 'X (Twitter)',
  social_fb: 'Facebook',
  status: 'Estado del Registro',
  player_status: 'Estado como Jugador',
  player_game_info: 'Datos de Juego / Cuenta'
}

const EXCLUDED_FIELDS = new Set([
  'id',
  'user_id',
  'manager_id',
  'profile_id',
  'team_id',
  'created_at',
  'updated_at',
  'cover_url',
  'edit_requested',
  'can_edit_profile',
  'role',
  'is_player',
  'is_featured',
  'rejection_reason',
  'original_name',
  'original_tag',
  'original_country',
  'original_logo',
  'original_avatar',
  'original_bio'
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

interface DiffField {
  label: string
  key: string
  type: 'text' | 'image' | 'longtext'
  originalValue: string | null
  newValue: string | null
  hasChanged: boolean
}

function getModificationDiffs(details: any): DiffField[] {
  if (!details) return []
  const diffs: DiffField[] = []

  const checkField = (
    key: string,
    origKey: string,
    label: string,
    type: 'text' | 'image' | 'longtext' = 'text'
  ) => {
    const newVal = details[key] !== undefined ? details[key] : null
    const origVal = details[origKey] !== undefined ? details[origKey] : null

    // Si ambos son nulos o no existen, omitir
    if (newVal === null && origVal === null) return

    // Comprobar si cambió
    const hasChanged = String(newVal || '').trim() !== String(origVal || '').trim()
    
    if (hasChanged && (newVal || origVal)) {
      diffs.push({
        label,
        key,
        type,
        originalValue: origVal,
        newValue: newVal,
        hasChanged: true
      })
    }
  }

  // 1. Campos de Modificación de Equipo
  if (details.team_id !== undefined || details.tag !== undefined) {
    checkField('name', 'original_name', 'Nombre del Equipo', 'text')
    checkField('tag', 'original_tag', 'Tag / Siglas del Equipo', 'text')
    checkField('country', 'original_country', 'País de Residencia / Sede', 'text')
    checkField('logo_url', 'original_logo', 'Logo del Equipo', 'image')
  }

  // 2. Campos de Modificación de Perfil de Usuario y Jugador Profesional
  if (details.user_id !== undefined || details.bio !== undefined || details.avatar_url !== undefined || details.nickname !== undefined || details.game_id !== undefined) {
    if (!diffs.some(d => d.key === 'name')) {
      checkField('name', 'original_name', 'Nombre Real', 'text')
    }
    checkField('nickname', 'original_nickname', 'Nickname / IGN', 'text')
    checkField('game_nickname', 'original_game_nickname', 'Nombre en Juego (IGN)', 'text')
    checkField('discord_handle', 'original_discord_handle', 'Usuario de Discord', 'text')
    checkField('closest_airport', 'original_closest_airport', 'País / Aeropuerto', 'text')
    checkField('country', 'original_country', 'País de Residencia', 'text')
    checkField('avatar_url', 'original_avatar', 'Foto de Perfil / Avatar', 'image')
    checkField('bio', 'original_bio', 'Biografía / Trayectoria', 'longtext')
    checkField('game', 'original_game', 'Juego Principal', 'text')
    checkField('game_id', 'original_game_id', 'ID de Juego / Cuenta', 'text')
    checkField('server', 'original_server', 'Servidor / Región', 'text')
    checkField('country_account', 'original_country_account', 'País de la Cuenta', 'text')
    checkField('social_ig', 'original_social_ig', 'Instagram', 'text')
    checkField('social_tiktok', 'original_social_tiktok', 'TikTok', 'text')
    checkField('social_yt', 'original_social_yt', 'YouTube', 'text')
    checkField('social_twitch', 'original_social_twitch', 'Twitch', 'text')
    checkField('social_kick', 'original_social_kick', 'Kick', 'text')
    checkField('social_x', 'original_social_x', 'X (Twitter)', 'text')
    checkField('social_fb', 'original_social_fb', 'Facebook', 'text')
  }

  // Fallback para otros campos que tengan original_
  // Se excluyen los campos ya procesados explícitamente para evitar duplicados
  const ALREADY_HANDLED_KEYS = new Set([
    'name', 'tag', 'country', 'logo_url', 'avatar_url', 'bio', 'description',
    'nickname', 'game_nickname', 'discord_handle', 'closest_airport',
    'game', 'game_id', 'server', 'country_account',
    'social_ig', 'social_tiktok', 'social_yt', 'social_twitch', 'social_kick', 'social_x', 'social_fb',
    // Variantes que se derivan de original_ pero son alias de los anteriores
    'avatar', 'logo', 'photo'
  ])

  Object.keys(details).forEach(key => {
    if (key.startsWith('original_')) {
      const mainKey = key.replace('original_', '')
      // Omitir si ya fue procesado explícitamente o es alias de uno procesado
      if (ALREADY_HANDLED_KEYS.has(mainKey)) return
      if (diffs.some(d => d.key === mainKey)) return

      const isImg = mainKey.includes('avatar') || mainKey.includes('logo') || mainKey.includes('photo') || mainKey.includes('image')
      const isLong = mainKey === 'bio' || mainKey === 'description'
      checkField(mainKey, key, getFieldLabel(mainKey), isImg ? 'image' : isLong ? 'longtext' : 'text')
    }
  })

  return diffs
}

interface PendingRequest {
  id: string
  type: ValidationType
  target_name: string
  created_at: string
  status: 'pending' | 'approved' | 'rejected' | string
  submitted_by?: string
  details?: any
}

export function AdminValidations() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  // Filters and search
  const [activeTab, setActiveTab] = useState<ValidationType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination state (default: 5 per page)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const handleTabChange = (tab: ValidationType) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleItemsPerPageChange = (count: number) => {
    setItemsPerPage(count)
    setCurrentPage(1)
  }

  // Modals state
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: string, action: 'approved' | 'rejected' | 'deleted', name: string } | null>(null)
  const [lightboxImage, setLightboxImage] = useState<{ src: string, label: string } | null>(null)
  
  // Deletion & Rejection logic
  const [deleteConfirmationWord, setDeleteConfirmationWord] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  // Edit details logic
  const [editingDetails, setEditingDetails] = useState<any>(null)

  const fetchValidations = async () => {
    setLoading(true)
    
    // 1. Fetch players
    const { data: pendingPlayers } = await supabase
      .from('profiles')
      .select('*, player_game_info(*)')
      .eq('is_player', true)

    // 2. Fetch teams
    const { data: pendingTeams } = await supabase
      .from('teams')
      .select('*')

    // 3. Fetch profile modification requests from profiles
    const { data: pendingModifications } = await supabase
      .from('profiles')
      .select('*, player_game_info(*)')
      .eq('edit_requested', true)

    // 4. Fetch validations records
    const { data: dbValidations } = await supabase
      .from('validations')
      .select('*')
      .order('created_at', { ascending: false })

    const formattedRequests: PendingRequest[] = []
    const processedIds = new Set<string>()
    const processedEntityIds = new Set<string>()

    // Add profile modifications
    if (pendingModifications) {
      pendingModifications.forEach(m => {
        processedIds.add(m.id)
        processedEntityIds.add(m.id)
        formattedRequests.push({
          id: m.id,
          type: 'modificacion',
          target_name: `${m.name || m.nickname || 'Usuario'} (Cambio de Perfil)`,
          created_at: m.created_at,
          status: 'pending',
          submitted_by: m.name || 'Usuario',
          details: m
        })
      })
    }

    if (dbValidations) {
      dbValidations.forEach(v => {
        const entityId = v.details?.user_id || v.details?.team_id || v.details?.id
        // Si ya procesamos una validación más reciente para esta misma entidad, evitamos duplicados
        if (entityId && processedEntityIds.has(entityId)) {
          return
        }
        if (processedIds.has(v.id)) {
          return
        }

        processedIds.add(v.id)
        if (entityId) {
          processedEntityIds.add(entityId)
          processedIds.add(entityId)
        }

        formattedRequests.push({
          id: v.id,
          type: v.type as any,
          target_name: v.target_name,
          created_at: v.created_at,
          status: v.status,
          submitted_by: v.submitted_by,
          details: v.details || {}
        })
      })
    }

    if (pendingPlayers) {
      pendingPlayers.forEach(p => {
        if (!processedIds.has(p.id) && !processedEntityIds.has(p.id)) {
          processedIds.add(p.id)
          processedEntityIds.add(p.id)
          formattedRequests.push({
            id: p.id,
            type: 'jugador',
            target_name: p.nickname || p.name || 'Jugador',
            created_at: p.created_at,
            status: p.player_status,
            submitted_by: p.name,
            details: p
          })
        }
      })
    }

    if (pendingTeams) {
      pendingTeams.forEach(t => {
        if (!processedIds.has(t.id) && !processedEntityIds.has(t.id)) {
          processedIds.add(t.id)
          processedEntityIds.add(t.id)
          formattedRequests.push({
            id: t.id,
            type: 'equipo',
            target_name: t.name,
            created_at: t.created_at,
            status: t.status,
            submitted_by: t.manager_id,
            details: t
          })
        }
      })
    }

    // Sort by date descending
    formattedRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setRequests(formattedRequests)
    setLoading(false)
  }

  useEffect(() => {
    fetchValidations()
  }, [])

  useEffect(() => {
    if (selectedRequest || confirmAction) {
      window.__lenis?.stop()
    } else {
      window.__lenis?.start()
    }
    return () => {
      window.__lenis?.start()
    }
  }, [selectedRequest, confirmAction])

  const handleExecuteAction = async () => {
    if (!confirmAction) return

    if (confirmAction.action === 'deleted') {
      if (deleteConfirmationWord !== 'SI') return
      
      const requestToUpdate = requests.find(req => req.id === confirmAction.id)
      if (requestToUpdate?.type === 'jugador') {
        await supabase.from('profiles').update({ is_player: false, player_status: 'none' }).eq('id', confirmAction.id)
      } else if (requestToUpdate?.type === 'equipo') {
        await supabase.from('teams').delete().eq('id', confirmAction.id)
      } else if (requestToUpdate?.type === 'modificacion') {
        await supabase.from('profiles').update({ edit_requested: false }).eq('id', confirmAction.id)
        await supabase.from('validations').delete().eq('id', confirmAction.id)
      }
      
      setRequests(prev => prev.filter(req => req.id !== confirmAction.id))
      toast.success('Solicitud eliminada')
    } else {
      const requestToUpdate = requests.find(req => req.id === confirmAction.id)
      const isApproved = confirmAction.action === 'approved'
      const newStatus = isApproved ? 'active' : 'rejected'
      const reason = rejectionReason.trim()
      
      if (!isApproved && !reason) {
        toast.error('Debes indicar la razón del rechazo')
        return
      }

      // Evitar volver a aprobar una solicitud que ya se encuentra activa o aprobada
      if (isApproved && (requestToUpdate?.status === 'active' || requestToUpdate?.status === 'approved')) {
        toast.info('Esta solicitud ya se encuentra aprobada y activa.')
        setConfirmAction(null)
        return
      }

      // Evitar volver a rechazar una solicitud que ya fue rechazada
      if (!isApproved && requestToUpdate?.status === 'rejected') {
        toast.info('Esta solicitud ya se encuentra rechazada.')
        setConfirmAction(null)
        return
      }

      if (requestToUpdate) {
        if (requestToUpdate.type === 'jugador') {
          const targetUserId = requestToUpdate.details?.user_id || requestToUpdate.details?.id || confirmAction.id
          await supabase.from('profiles').update({ player_status: newStatus }).eq('id', targetUserId)
          
          // Actualizar en tabla validations si existe el registro con este ID
          const { data: valExists } = await supabase.from('validations').select('id').eq('id', confirmAction.id).limit(1)
          if (valExists && valExists.length > 0) {
            await supabase.from('validations').update({
              status: newStatus,
              details: {
                ...requestToUpdate.details,
                rejection_reason: isApproved ? null : reason,
                user_id: targetUserId
              }
            }).eq('id', confirmAction.id)
          } else {
            // Verificar si hay alguna validación previa para este user_id
            const { data: userVal } = await supabase.from('validations').select('id').eq('details->>user_id', targetUserId).limit(1)
            if (userVal && userVal.length > 0) {
              await supabase.from('validations').update({
                status: newStatus,
                details: {
                  ...requestToUpdate.details,
                  rejection_reason: isApproved ? null : reason,
                  user_id: targetUserId
                }
              }).eq('id', userVal[0].id)
            } else {
              await supabase.from('validations').insert({
                type: 'jugador',
                target_name: requestToUpdate.target_name,
                submitted_by: requestToUpdate.submitted_by || requestToUpdate.target_name,
                status: newStatus,
                details: {
                  ...requestToUpdate.details,
                  rejection_reason: isApproved ? null : reason,
                  user_id: targetUserId
                }
              })
            }
          }
        } else if (requestToUpdate.type === 'equipo') {
          const targetTeamId = requestToUpdate.details?.team_id || requestToUpdate.details?.id || confirmAction.id
          await supabase.from('teams').update({ status: newStatus }).eq('id', targetTeamId)
          
          const { data: valExists } = await supabase.from('validations').select('id').eq('id', confirmAction.id).limit(1)
          if (valExists && valExists.length > 0) {
            await supabase.from('validations').update({
              status: newStatus,
              details: {
                ...requestToUpdate.details,
                rejection_reason: isApproved ? null : reason,
                team_id: targetTeamId
              }
            }).eq('id', confirmAction.id)
          } else {
            const { data: teamVal } = await supabase.from('validations').select('id').eq('details->>team_id', targetTeamId).limit(1)
            if (teamVal && teamVal.length > 0) {
              await supabase.from('validations').update({
                status: newStatus,
                details: {
                  ...requestToUpdate.details,
                  rejection_reason: isApproved ? null : reason,
                  team_id: targetTeamId
                }
              }).eq('id', teamVal[0].id)
            } else {
              await supabase.from('validations').insert({
                type: 'equipo',
                target_name: requestToUpdate.target_name,
                submitted_by: requestToUpdate.submitted_by || requestToUpdate.target_name,
                status: newStatus,
                details: {
                  ...requestToUpdate.details,
                  rejection_reason: isApproved ? null : reason,
                  team_id: targetTeamId
                }
              })
            }
          }
        } else if (requestToUpdate.type === 'modificacion') {
          const details = requestToUpdate.details || {}
          const isTeamMod = Boolean(details.team_id)

          if (isTeamMod) {
            // Modificación de Equipo
            if (isApproved) {
              const updates: any = {}
              if (details.name) updates.name = details.name
              if (details.tag) updates.tag = details.tag
              if (details.country) updates.country = details.country
              if (details.logo_url) updates.logo_url = details.logo_url

              await supabase.from('teams').update(updates).eq('id', details.team_id)

              await supabase.from('validations').update({
                status: 'approved',
                details: {
                  ...details,
                  status: 'approved'
                }
              }).eq('id', confirmAction.id)
            } else {
              await supabase.from('validations').update({
                status: 'rejected',
                details: {
                  ...details,
                  rejection_reason: reason,
                  status: 'rejected'
                }
              }).eq('id', confirmAction.id)
            }
          } else {
            // Modificación de Perfil de Usuario / Jugador Profesional
            const userId = details.user_id || confirmAction.id
            if (isApproved) {
              const updates: any = { edit_requested: false }
              if (details.name !== undefined) updates.name = details.name
              if (details.nickname !== undefined) updates.nickname = details.nickname
              if (details.game_nickname !== undefined) updates.game_nickname = details.game_nickname
              if (details.discord_handle !== undefined) updates.discord_handle = details.discord_handle
              if (details.closest_airport !== undefined) updates.closest_airport = details.closest_airport
              if (details.country !== undefined) updates.country = details.country
              if (details.avatar_url !== undefined) updates.avatar_url = details.avatar_url
              if (details.bio !== undefined) updates.bio = details.bio
              if (details.social_ig !== undefined) updates.social_ig = details.social_ig
              if (details.social_tiktok !== undefined) updates.social_tiktok = details.social_tiktok
              if (details.social_yt !== undefined) updates.social_yt = details.social_yt
              if (details.social_twitch !== undefined) updates.social_twitch = details.social_twitch
              if (details.social_kick !== undefined) updates.social_kick = details.social_kick
              if (details.social_x !== undefined) updates.social_x = details.social_x
              if (details.social_fb !== undefined) updates.social_fb = details.social_fb

              await supabase.from('profiles').update(updates).eq('id', userId)

              // Actualizar datos de juego en player_game_info si fueron provistos
              if (details.game_id !== undefined || details.server !== undefined || details.country_account !== undefined || details.game !== undefined) {
                const gameUpdates: any = {}
                if (details.game_id !== undefined) gameUpdates.game_id = details.game_id
                if (details.server !== undefined) gameUpdates.server = details.server
                if (details.country_account !== undefined) gameUpdates.country_account = details.country_account
                if (details.game !== undefined) gameUpdates.game = details.game
                if (details.game_nickname !== undefined || details.nickname !== undefined) {
                  gameUpdates.game_nickname = details.game_nickname || details.nickname
                }

                const { data: existingGameInfo } = await supabase
                  .from('player_game_info')
                  .select('id')
                  .eq('profile_id', userId)
                  .limit(1)

                if (existingGameInfo && existingGameInfo.length > 0) {
                  await supabase.from('player_game_info').update(gameUpdates).eq('id', existingGameInfo[0].id)
                } else {
                  await supabase.from('player_game_info').insert({
                    profile_id: userId,
                    game: details.game || 'Mobile Legends',
                    ...gameUpdates
                  })
                }
              }
              
              await supabase.from('validations').update({
                status: 'approved',
                details: {
                  ...details,
                  status: 'approved',
                  user_id: userId
                }
              }).eq('id', confirmAction.id)
            } else {
              // Revertir y registrar rechazo con motivo obligatorio
              const updates: any = { edit_requested: false }
              if (details.original_name !== undefined) updates.name = details.original_name
              if (details.original_avatar !== undefined) updates.avatar_url = details.original_avatar
              if (details.original_bio !== undefined) updates.bio = details.original_bio
              if (details.original_nickname !== undefined) updates.nickname = details.original_nickname
              if (details.original_game_nickname !== undefined) updates.game_nickname = details.original_game_nickname
              if (details.original_discord_handle !== undefined) updates.discord_handle = details.original_discord_handle
              if (details.original_closest_airport !== undefined) updates.closest_airport = details.original_closest_airport
              if (details.original_social_ig !== undefined) updates.social_ig = details.original_social_ig
              if (details.original_social_tiktok !== undefined) updates.social_tiktok = details.original_social_tiktok
              if (details.original_social_yt !== undefined) updates.social_yt = details.original_social_yt
              if (details.original_social_twitch !== undefined) updates.social_twitch = details.original_social_twitch
              if (details.original_social_kick !== undefined) updates.social_kick = details.original_social_kick
              if (details.original_social_x !== undefined) updates.social_x = details.original_social_x
              if (details.original_social_fb !== undefined) updates.social_fb = details.original_social_fb

              await supabase.from('profiles').update(updates).eq('id', userId)

              await supabase.from('validations').update({
                status: 'rejected',
                details: {
                  ...details,
                  rejection_reason: reason,
                  status: 'rejected',
                  user_id: userId
                }
              }).eq('id', confirmAction.id)
            }
          }
        }
      }

      setRequests(prev => prev.map(req => {
        if (req.id === confirmAction.id) {
          return { ...req, status: newStatus }
        }
        return req
      }))

      if (isApproved) {
        toast.success('Solicitud aprobada correctamente')
      } else {
        toast.error('Solicitud rechazada con motivo registrado')
      }
    }
    
    setConfirmAction(null)
    setSelectedRequest(null)
    setDeleteConfirmationWord('')
    setRejectionReason('')
  }

  const handleSaveDetails = async () => {
    if (!selectedRequest || !editingDetails) return
    
    // Remove nested relational data before saving to main table
    const { player_game_info, profiles, teams, ...cleanDetails } = editingDetails;

    let error = null;
    
    try {
      if (selectedRequest.type === 'jugador') {
        const { error: err } = await supabase.from('profiles').update(cleanDetails).eq('id', selectedRequest.id)
        error = err;
      } else if (selectedRequest.type === 'equipo') {
        const { error: err } = await supabase.from('teams').update(cleanDetails).eq('id', selectedRequest.id)
        error = err;
      } else if (selectedRequest.type === 'modificacion') {
        const { error: err } = await supabase.from('profiles').update({ ...cleanDetails, edit_requested: false }).eq('id', selectedRequest.id)
        error = err;
      }
        
      if (!error) {
        // Update local state
        setRequests(prev => prev.map(req => {
          if (req.id === selectedRequest.id) {
            // Also update the target_name if name or nickname changed
            let targetName = req.target_name;
            let newStatus = req.status;
            
            if (req.type === 'jugador' || req.type === 'modificacion') {
              targetName = editingDetails.nickname || editingDetails.name || req.target_name;
              if (editingDetails.player_status) newStatus = editingDetails.player_status;
            } else if (req.type === 'equipo') {
              targetName = editingDetails.name;
              if (editingDetails.status) newStatus = editingDetails.status;
            }
            
            return { ...req, target_name: targetName, details: editingDetails, status: newStatus }
          }
          return req
        }))
        setSelectedRequest({ ...selectedRequest, target_name: editingDetails.nickname || editingDetails.name || selectedRequest.target_name, details: editingDetails, status: editingDetails.status || editingDetails.player_status || selectedRequest.status })
        toast.success('Cambios guardados correctamente.')
      } else {
        console.error(error)
        toast.error('Error guardando cambios.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error inesperado al guardar cambios.')
    }
  }

  const getTypeIcon = (type: ValidationType) => {
    switch (type) {
      case 'jugador': return <UserCheck className="w-5 h-5 text-emerald-400" />
      case 'equipo': return <ShieldCheck className="w-5 h-5 text-blue-400" />
      case 'modificacion': return <Edit3 className="w-5 h-5 text-amber-400" />
      default: return <FileText className="w-5 h-5 text-muted-foreground" />
    }
  }

  const filteredRequests = requests.filter(req => {
    if (activeTab !== 'all' && req.type !== activeTab) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return req.target_name.toLowerCase().includes(q) || req.submitted_by?.toLowerCase().includes(q)
    }
    return true
  })

  // Pagination calculations (loads 5 by 5 by default)
  const totalItems = filteredRequests.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Tabs */}
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white">
            Validaciones
          </h2>
          
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar validación..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-sm text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
          {['all', 'jugador', 'equipo', 'modificacion'].map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab as ValidationType)}
              className={cn(
                "px-4 py-2 rounded-md font-display text-sm font-600 uppercase tracking-wider transition-colors",
                activeTab === tab 
                  ? "bg-primary text-white" 
                  : "bg-background border border-border text-muted-foreground hover:text-white"
              )}
            >
              {tab === 'all' ? 'Todas' : tab === 'jugador' ? 'Jugadores' : tab === 'equipo' ? 'Equipos' : 'Modificaciones'}
            </button>
          ))}
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground animate-pulse">Cargando validaciones...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg bg-background/50">
            <p className="text-muted-foreground">No hay solicitudes que coincidan con los filtros.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 font-600 text-muted-foreground">TIPO</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">NOMBRE / NICKNAME</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">FECHA REGISTRO</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground">ESTATUS</th>
                  <th className="px-4 py-3 font-600 text-muted-foreground text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedRequests.map(req => (
                  <tr key={req.id} className="transition-colors hover:bg-white/5">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 uppercase font-500 text-xs">
                        {getTypeIcon(req.type)}
                        {req.type}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-500 text-white">{req.target_name}</td>
                    <td className="px-4 py-4 text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-4">
                      {req.status === 'pending' ? (
                        <span className="inline-flex items-center rounded-full bg-yellow-400/10 px-2 py-1 text-xs font-500 text-yellow-400 ring-1 ring-inset ring-yellow-400/20">
                          Pendiente
                        </span>
                      ) : (req.status === 'active' || req.status === 'approved') ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-400/10 px-2 py-1 text-xs font-500 text-emerald-400 ring-1 ring-inset ring-emerald-400/20">
                          ACTIVO
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-400/10 px-2 py-1 text-xs font-500 text-red-400 ring-1 ring-inset ring-red-400/20">
                          RECHAZADO
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(req)
                            setEditingDetails(req.details)
                          }}
                          title="Ver y Editar Detalles"
                          className="flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {(() => {
                          const isApproved = req.status === 'active' || req.status === 'approved'
                          const isRejected = req.status === 'rejected'

                          return (
                            <>
                              <button
                                disabled={isApproved}
                                onClick={() => {
                                  if (isApproved) return
                                  setConfirmAction({ id: req.id, action: 'approved', name: req.target_name })
                                }}
                                title={isApproved ? "Esta solicitud ya fue aprobada y se encuentra activa" : "Aprobar / Activar"}
                                className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded border transition-colors",
                                  isApproved
                                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500/30 cursor-not-allowed opacity-40"
                                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                                )}
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                disabled={isRejected}
                                onClick={() => {
                                  if (isRejected) return
                                  setConfirmAction({ id: req.id, action: 'rejected', name: req.target_name })
                                }}
                                title={isRejected ? "Esta solicitud ya fue rechazada" : "Rechazar"}
                                className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded border transition-colors",
                                  isRejected
                                    ? "border-red-500/20 bg-red-500/5 text-red-500/30 cursor-not-allowed opacity-40"
                                    : "border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                                )}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )
                        })()}

                        <button
                          onClick={() => setConfirmAction({ id: req.id, action: 'deleted', name: req.target_name })}
                          title="Eliminar"
                          className="flex h-8 w-8 items-center justify-center rounded border border-red-900/50 bg-red-900/10 text-red-700 transition-colors hover:bg-red-900 hover:text-white ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-5 mt-4 text-xs">
            {/* Left: Info & Items per page selector */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-500">Mostrar:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  aria-label="Cantidad por página"
                  className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
                >
                  <option value={5}>5 por página</option>
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                </select>
              </div>

              <span className="text-border hidden sm:inline">|</span>

              <span>
                Mostrando <strong className="text-white font-600">{totalItems === 0 ? 0 : startIndex + 1}</strong> - <strong className="text-white font-600">{endIndex}</strong> de <strong className="text-white font-600">{totalItems}</strong> solicitudes
              </span>
            </div>

            {/* Right: Page navigation */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                title="Primera página"
                aria-label="Primera página"
                className="flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                title="Página anterior"
                aria-label="Página anterior"
                className="flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1 mx-1">
                {(() => {
                  const pages: (number | string)[] = []
                  const delta = 1

                  for (let i = 1; i <= totalPages; i++) {
                    if (
                      i === 1 ||
                      i === totalPages ||
                      (i >= safeCurrentPage - delta && i <= safeCurrentPage + delta)
                    ) {
                      pages.push(i)
                    } else if (pages[pages.length - 1] !== '...') {
                      pages.push('...')
                    }
                  }

                  return pages.map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground select-none">
                          ...
                        </span>
                      )
                    }
                    const isCurrent = p === safeCurrentPage
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(Number(p))}
                        className={cn(
                          "flex h-8 min-w-[32px] px-2 items-center justify-center rounded text-xs font-600 transition-colors",
                          isCurrent
                            ? "bg-primary text-white font-700 shadow-sm"
                            : "border border-border bg-background text-muted-foreground hover:border-primary hover:text-white"
                        )}
                      >
                        {p}
                      </button>
                    )
                  })
                })()}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                title="Página siguiente"
                aria-label="Página siguiente"
                className="flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                title="Última página"
                aria-label="Última página"
                className="flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          </>
        )}
      </div>

      {/* Details / Edit Modal */}
      {selectedRequest && editingDetails && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedRequest(null)} />
          <div className="relative flex flex-col w-full max-w-2xl h-[90vh] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex shrink-0 items-center justify-between border-b border-border p-6 bg-surface z-10">
              <div>
                <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
                  {getTypeIcon(selectedRequest.type)}
                  Detalles de la Solicitud
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedRequest.target_name}</p>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="text-muted-foreground hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body con Scroll (Solo Visualización) */}
            <div data-lenis-prevent data-modal-scrollbody className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6">
              {selectedRequest.type === 'modificacion' ? (
                <div className="space-y-6">
                  {(() => {
                    const diffs = getModificationDiffs(editingDetails)
                    
                    if (diffs.length === 0) {
                      return (
                        <div className="text-center py-10 rounded-xl bg-background/50 border border-border">
                          <p className="text-muted-foreground text-sm">
                            No se detectaron campos modificados o se conservan los valores originales.
                          </p>
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-700 uppercase tracking-wider">
                            <Edit3 className="w-3.5 h-3.5" />
                            {diffs.length} {diffs.length === 1 ? 'Campo Modificado' : 'Campos Modificados'}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-500">
                            Comparativa: Original vs Solicitado
                          </span>
                        </div>

                        <div className="space-y-4">
                          {diffs.map((diff, idx) => (
                            <div key={idx} className="rounded-xl border border-border/80 bg-background/60 p-5 space-y-3 shadow-md">
                              <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                                <span className="text-xs font-700 uppercase tracking-widest text-primary">
                                  {diff.label}
                                </span>
                                <span className="text-[10px] font-800 uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                  Cambio Solicitado
                                </span>
                              </div>

                              {diff.type === 'image' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                  {/* Original Image */}
                                  <div className="space-y-2 rounded-lg bg-surface/40 border border-border/50 p-3.5">
                                    <span className="text-[11px] font-600 uppercase tracking-wider text-muted-foreground block">
                                      Valor Anterior (Original)
                                    </span>
                                    <div className="flex items-center gap-3">
                                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border bg-background shrink-0">
                                        {diff.originalValue ? (
                                          <img src={diff.originalValue} alt="Original" className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground text-center p-1">Sin imagen</div>
                                        )}
                                      </div>
                                      {diff.originalValue && (
                                        <button
                                          type="button"
                                          onClick={() => setLightboxImage({ src: diff.originalValue!, label: `Original: ${diff.label}` })}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-white hover:border-primary text-xs font-600 uppercase tracking-wider transition-colors"
                                        >
                                          <ZoomIn className="w-3.5 h-3.5 text-primary" />
                                          Ver Original
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* New Image */}
                                  <div className="space-y-2 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/30 p-3.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-700 uppercase tracking-wider text-emerald-400 block">
                                        Nuevo Valor Solicitado
                                      </span>
                                      <span className="text-[9px] font-800 uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        NUEVO
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-emerald-500/40 bg-background shrink-0 shadow-md">
                                        {diff.newValue ? (
                                          <img src={diff.newValue} alt="Nuevo" className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground text-center p-1">Sin imagen</div>
                                        )}
                                      </div>
                                      {diff.newValue && (
                                        <button
                                          type="button"
                                          onClick={() => setLightboxImage({ src: diff.newValue!, label: `Nuevo: ${diff.label}` })}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-600 uppercase tracking-wider transition-colors shadow-sm"
                                        >
                                          <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                                          Agrandar Nuevo
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                  {/* Original Text */}
                                  <div className="space-y-1.5 rounded-lg bg-surface/40 border border-border/50 p-3.5">
                                    <span className="text-[11px] font-600 uppercase tracking-wider text-muted-foreground block">
                                      Valor Anterior (Original)
                                    </span>
                                    <p className="text-sm font-500 text-white/70 break-words line-through decoration-red-500/60 leading-relaxed">
                                      {diff.originalValue || <span className="italic text-muted-foreground text-xs font-normal">Sin información previa</span>}
                                    </p>
                                  </div>

                                  {/* New Text */}
                                  <div className="space-y-1.5 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/30 p-3.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-700 uppercase tracking-wider text-emerald-400 block">
                                        Nuevo Valor Solicitado
                                      </span>
                                      <span className="text-[9px] font-800 uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        NUEVO
                                      </span>
                                    </div>
                                    <p className="text-sm font-700 text-emerald-300 break-words leading-relaxed">
                                      {diff.newValue || <span className="italic text-muted-foreground text-xs font-normal">Vacio</span>}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  {Object.entries(editingDetails)
                    .filter(([key, value]) => {
                      const lower = key.toLowerCase()
                      if (EXCLUDED_FIELDS.has(lower)) return false
                      
                      // Solo mostrar campos que tengan contenido
                      if (value === null || value === undefined || value === '') return false
                      if (Array.isArray(value) && value.length === 0) return false
                      if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return false

                      return true
                    })
                    .map(([key, value]) => {
                      const isImage = typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image')) && !value.endsWith('.pdf');
                      const isPdf = typeof value === 'string' && value.endsWith('.pdf');
                      const isBoolean = typeof value === 'boolean';
                      const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
                      const isArray = Array.isArray(value);
                      const isStatusField = key === 'status' || key === 'player_status';
                      const isLongText = key === 'bio' || key === 'description';
                      const labelTitle = getFieldLabel(key);
                      
                      if (isObject) {
                         const validSubEntries = Object.entries(value).filter(([subKey, subVal]) => {
                           if (EXCLUDED_FIELDS.has(subKey.toLowerCase())) return false
                           return subVal !== null && subVal !== undefined && subVal !== ''
                         })

                         if (validSubEntries.length === 0) return null

                         return (
                           <div key={key} className="col-span-full border border-border rounded-xl p-5 bg-background/50">
                             <span className="text-xs font-700 uppercase tracking-widest text-primary mb-4 block border-b border-border/50 pb-2">
                               {labelTitle}
                             </span>
                             <div className="grid sm:grid-cols-2 gap-4">
                               {validSubEntries.map(([subKey, subValue]) => (
                                 <div key={subKey} className="space-y-1 rounded-lg bg-surface/60 border border-border/50 p-3">
                                   <span className="text-[11px] font-600 uppercase tracking-wider text-muted-foreground block">
                                     {getFieldLabel(subKey)}
                                   </span>
                                   <p className="text-sm font-600 text-white break-words">
                                     {String(subValue)}
                                   </p>
                                 </div>
                               ))}
                             </div>
                           </div>
                         )
                      }

                      if (isArray && key === 'player_game_info') {
                        const validGameItems = (value as any[]).filter(item => {
                          return Object.values(item).some(v => v !== null && v !== undefined && v !== '')
                        })

                        if (validGameItems.length === 0) return null

                        return (
                          <div key={key} className="col-span-full border border-border rounded-xl p-5 bg-background/50">
                            <span className="text-xs font-700 uppercase tracking-widest text-primary mb-4 block border-b border-border/50 pb-2">
                              {labelTitle}
                            </span>
                            <div className="space-y-4">
                              {validGameItems.map((gameItem, idx) => (
                                <div key={idx} className="grid sm:grid-cols-3 gap-4 p-4 rounded-lg bg-surface border border-border/60">
                                  {Object.entries(gameItem)
                                    .filter(([gKey, gVal]) => !EXCLUDED_FIELDS.has(gKey.toLowerCase()) && gVal !== null && gVal !== undefined && gVal !== '')
                                    .map(([gKey, gVal]) => (
                                      <div key={gKey} className="space-y-1">
                                        <span className="text-[11px] font-600 uppercase tracking-wider text-muted-foreground block">
                                          {getFieldLabel(gKey)}
                                        </span>
                                        <p className="text-sm font-600 text-white break-words">
                                          {String(gVal)}
                                        </p>
                                      </div>
                                    ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div key={key} className={cn("space-y-1.5", (isImage || isPdf || isLongText) ? "col-span-full" : "")}>
                          <span className="text-[11px] font-700 uppercase tracking-wider text-primary block">
                            {labelTitle}
                          </span>

                          {isImage ? (
                            <div className="rounded-xl border border-border bg-background p-4 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                              <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border-2 border-border bg-surface shadow-md">
                                <img src={value as string} alt={labelTitle} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex flex-col gap-2">
                                <button 
                                  type="button"
                                  onClick={() => setLightboxImage({ src: value as string, label: labelTitle })}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border text-white hover:border-primary hover:text-primary text-xs font-600 uppercase tracking-wider transition-colors shadow-sm"
                                >
                                  <ZoomIn className="w-4 h-4 text-primary" />
                                  Agrandar Imagen
                                </button>
                              </div>
                            </div>
                          ) : isPdf ? (
                            <a 
                              href={value as string} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-4 text-white hover:border-primary hover:text-primary transition-colors group"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <FileText className="w-8 h-8 shrink-0 text-primary group-hover:text-primary" />
                                <span className="text-sm font-600 truncate">{labelTitle}</span>
                              </div>
                              <ScrollText className="w-4 h-4 shrink-0 opacity-50 group-hover:opacity-100" />
                            </a>
                          ) : isBoolean ? (
                            <div className="rounded-xl border border-border bg-background/80 px-4 py-3 text-white text-sm font-600">
                              {value ? 'Sí' : 'No'}
                            </div>
                          ) : isArray ? (
                            <div className="rounded-xl border border-border bg-background/80 px-4 py-3 text-white text-sm font-600">
                              {(value as string[]).join(', ')}
                            </div>
                          ) : isStatusField ? (
                            <div className="rounded-xl border border-border bg-background/80 px-4 py-3">
                              <span className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-600 uppercase tracking-wider",
                                (value === 'active' || value === 'approved') ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                value === 'pending' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                "bg-red-500/10 text-red-400 border border-red-500/20"
                              )}>
                                {value === 'active' || value === 'approved' ? 'Activo / Aprobado' : value === 'pending' ? 'Pendiente' : 'Rechazado'}
                              </span>
                            </div>
                          ) : isLongText ? (
                            <div className="rounded-xl border border-border bg-background/80 px-4 py-3 text-white text-sm font-500 leading-relaxed whitespace-pre-wrap">
                              {String(value)}
                            </div>
                          ) : (
                            <div className="rounded-xl border border-border bg-background/80 px-4 py-3 text-white text-sm font-600 break-words">
                              {String(value)}
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              )}
            </div>

            {/* Footer Fijo con Acciones */}
            <div className="flex shrink-0 items-center justify-between border-t border-border p-6 bg-surface z-10">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-5 py-2.5 rounded-lg border border-border bg-background text-xs font-600 uppercase tracking-widest text-muted-foreground hover:text-white hover:border-primary/50 transition-colors"
              >
                Cerrar
              </button>

              <div className="flex gap-3">
                <GmxButton 
                  variant="secondary"
                  disabled={selectedRequest.status === 'rejected'}
                  onClick={() => {
                    if (selectedRequest.status === 'rejected') return
                    setConfirmAction({ id: selectedRequest.id, action: 'rejected', name: selectedRequest.target_name })
                    setSelectedRequest(null)
                  }}
                  className={cn(
                    "border-red-500/20 text-red-500 hover:border-red-500 hover:text-white hover:bg-red-500/20",
                    selectedRequest.status === 'rejected' && "border-red-500/20 bg-red-500/5 text-red-500/30 cursor-not-allowed opacity-40 pointer-events-none"
                  )}
                >
                  {selectedRequest.status === 'rejected' ? '✓ YA RECHAZADO' : 'RECHAZAR'}
                </GmxButton>
                <GmxButton 
                  disabled={selectedRequest.status === 'active' || selectedRequest.status === 'approved'}
                  onClick={() => {
                    if (selectedRequest.status === 'active' || selectedRequest.status === 'approved') return
                    setConfirmAction({ id: selectedRequest.id, action: 'approved', name: selectedRequest.target_name })
                    setSelectedRequest(null)
                  }}
                  className={cn(
                    (selectedRequest.status === 'active' || selectedRequest.status === 'approved') && "bg-emerald-950/20 border-emerald-500/20 text-emerald-400/40 cursor-not-allowed opacity-40 pointer-events-none"
                  )}
                >
                  {(selectedRequest.status === 'active' || selectedRequest.status === 'approved') ? '✓ YA APROBADO' : 'APROBAR SOLICITUD'}
                </GmxButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            
            <div className={cn(
              "mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-6",
              confirmAction.action === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
            )}>
              {confirmAction.action === 'approved' ? <Check className="h-8 w-8" /> : confirmAction.action === 'deleted' ? <Trash2 className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
            </div>

            <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-2">
              ¿Estás seguro?
            </h3>
            
            <p className="text-muted-foreground mb-8">
              Estás a punto de <strong className={cn(
                confirmAction.action === 'approved' ? 'text-emerald-500' : 
                confirmAction.action === 'deleted' ? 'text-red-500' : 'text-red-500'
              )}>
                {confirmAction.action === 'approved' ? 'APROBAR' : confirmAction.action === 'deleted' ? 'ELIMINAR' : 'RECHAZAR'}
              </strong> la solicitud de:<br/>
              <span className="text-white mt-2 block font-500">{confirmAction.name}</span>
            </p>

            {confirmAction.action === 'rejected' && (
              <div className="mb-6 space-y-2 text-left">
                <label className="text-xs font-700 uppercase tracking-wider text-red-400 block">
                  Motivo / Razón del Rechazo <span className="text-white">* (Obligatorio)</span>
                </label>
                <textarea 
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none placeholder:text-muted-foreground/60"
                  placeholder="Escribe la razón detallada por la cual se rechaza la solicitud..."
                />
                {!rejectionReason.trim() && (
                  <p className="text-[11px] text-red-400 font-500">
                    * Debes escribir un motivo para poder confirmar el rechazo.
                  </p>
                )}
              </div>
            )}

            {confirmAction.action === 'deleted' && (
              <div className="mb-6 space-y-2 text-left">
                <label className="text-sm text-muted-foreground">Escribe la palabra <strong className="text-red-500 font-bold">SI</strong> para confirmar:</label>
                <input 
                  type="text" 
                  value={deleteConfirmationWord}
                  onChange={e => setDeleteConfirmationWord(e.target.value)}
                  className="w-full rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  placeholder="SI"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => {
                  setConfirmAction(null)
                  setDeleteConfirmationWord('')
                  setRejectionReason('')
                }}
                className="flex-1 rounded-md border border-border bg-transparent px-4 py-3 font-display text-[13px] font-600 uppercase tracking-widest text-muted-foreground transition-colors hover:text-white"
              >
                CANCELAR
              </button>
              <button 
                onClick={handleExecuteAction}
                disabled={
                  (confirmAction.action === 'deleted' && deleteConfirmationWord !== 'SI') ||
                  (confirmAction.action === 'rejected' && !rejectionReason.trim())
                }
                className={cn(
                  "flex-1 rounded-md px-4 py-3 font-display text-[13px] font-600 uppercase tracking-widest text-white transition-colors relative overflow-hidden clip-corner group",
                  confirmAction.action === 'approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500',
                  ((confirmAction.action === 'deleted' && deleteConfirmationWord !== 'SI') ||
                   (confirmAction.action === 'rejected' && !rejectionReason.trim())) ? 'opacity-50 cursor-not-allowed grayscale' : ''
                )}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  CONFIRMAR {confirmAction.action === 'approved' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </span>
              </button>
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
