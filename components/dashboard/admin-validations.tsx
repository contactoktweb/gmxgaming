'use client'

import { useState, useEffect } from 'react'
import { Check, X, UserCheck, ShieldCheck, ScrollText, Eye, FileText, Image as ImageIcon, AlertCircle, Maximize2, ZoomIn, Search, Trash2, Save, Edit3, UserCog, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trophy } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { GmxButton } from '@/components/gmx-button'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { cn, formatNickname, formatPersonName } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'

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
  player_game_info: 'Datos de Juego / Cuenta',
  tipoequipo: 'Tipo de Equipo',
  tipo_equipo: 'Tipo de Equipo',
  contract_id: 'ID de Contrato',
  player_name: 'Nombre del Jugador',
  team_name: 'Equipo',
  admin_name: 'Administrador',
  admin_nickname: 'Nickname del Administrador',
  justification: 'Justificación / Motivo de Baja',
  conclusion_date: 'Fecha de Conclusión / Baja',
  end_date: 'Fecha Límite del Contrato',
  start_date: 'Fecha de Inicio del Contrato',
  division: 'División',
  roles: 'Roles en el Equipo',
  team_gender_category: 'Categoría del Equipo',
  tournament_name: 'Torneo',
  tournament_logo: 'Logo del Torneo',
  team_tag: 'Tag del Equipo',
  manager_name: 'Manager / Solicitante',
  manager_email: 'Correo del Manager'
}

const EXCLUDED_FIELDS = new Set([
  'id',
  'user_id',
  'manager_id',
  'profile_id',
  'team_id',
  'contract_id',
  'tournament_id',
  'admin_id',
  'player_id',
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
  'original_tipoequipo',
  'original_tipo_equipo',
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
    const rawNewVal = details[key] !== undefined && details[key] !== null ? details[key] : null
    const rawOrigVal = details[origKey] !== undefined && details[origKey] !== null ? details[origKey] : null

    const cleanNew = String(rawNewVal || '').trim()
    const cleanOrig = String(rawOrigVal || '').trim()

    // Si ambos están vacíos o no existen, no hubo cambio
    if (!cleanNew && !cleanOrig) return

    // Si el valor nuevo es idéntico al original, no hubo cambio
    if (cleanNew === cleanOrig) return

    // Caso especial para placeholder de biografía
    if (key === 'bio' && cleanNew === 'Cuéntanos un poco sobre ti...' && !cleanOrig) return

    diffs.push({
      label,
      key,
      type,
      originalValue: rawOrigVal ? String(rawOrigVal).trim() : null,
      newValue: rawNewVal ? String(rawNewVal).trim() : null,
      hasChanged: true
    })
  }

  // 1. Campos de Modificación de Equipo
  if (details.team_id !== undefined || details.tag !== undefined) {
    checkField('name', 'original_name', 'Nombre del Equipo', 'text')
    checkField('tag', 'original_tag', 'Tag / Siglas del Equipo', 'text')
    checkField('hashtag', 'original_hashtag', 'Hashtag del Equipo', 'text')
    checkField('country', 'original_country', 'País de Residencia / Sede', 'text')
    checkField('tipoEquipo', 'original_tipoEquipo', 'Tipo de Equipo', 'text')
    const origLogoKey = details.original_logo !== undefined ? 'original_logo' : 'original_logo_url'
    checkField('logo_url', origLogoKey, 'Logo del Equipo', 'image')
    const origJerseyKey = details.original_jersey !== undefined ? 'original_jersey' : 'original_jersey_url'
    checkField('jersey_url', origJerseyKey, 'Jersey del Equipo', 'image')
    checkField('games', 'original_games', 'Juegos en los que participa', 'text')
    checkField('social_ig', 'original_social_ig', 'Instagram', 'text')
    checkField('social_tiktok', 'original_social_tiktok', 'TikTok', 'text')
    checkField('social_yt', 'original_social_yt', 'YouTube', 'text')
    checkField('social_fb', 'original_social_fb', 'Facebook', 'text')
    checkField('social_twitch', 'original_social_twitch', 'Twitch', 'text')
    checkField('social_kick', 'original_social_kick', 'Kick', 'text')
    checkField('social_x', 'original_social_x', 'X (Twitter)', 'text')
    checkField('manager_name', 'original_manager_name', 'Nombre del Manager', 'text')
    checkField('manager_nickname', 'original_manager_nickname', 'Nickname del Manager', 'text')
    checkField('manager_discord', 'original_manager_discord', 'Discord del Manager', 'text')
    checkField('manager_phone', 'original_manager_phone', 'WhatsApp del Manager', 'text')
  }

  // 2. Campos de Modificación de Perfil de Usuario y Jugador Profesional
  if (details.user_id !== undefined || details.bio !== undefined || details.avatar_url !== undefined || details.nickname !== undefined || details.game_id !== undefined) {
    if (!diffs.some(d => d.key === 'name')) {
      checkField('name', 'original_name', 'Nombre Real', 'text')
    }
    // Nickname / IGN: solo mostrar uno si nickname y game_nickname son iguales para evitar duplicar el campo
    checkField('nickname', 'original_nickname', 'Nickname / IGN', 'text')
    if (!diffs.some(d => d.key === 'nickname')) {
      checkField('game_nickname', 'original_game_nickname', 'Nombre en Juego (IGN)', 'text')
    }
    checkField('discord_handle', 'original_discord_handle', 'Usuario de Discord', 'text')
    checkField('country', 'original_country', 'País de Residencia', 'text')
    const origAvatarKey = details.original_avatar !== undefined ? 'original_avatar' : 'original_avatar_url'
    checkField('avatar_url', origAvatarKey, 'Foto de Perfil / Avatar', 'image')
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
  const ALREADY_HANDLED_KEYS = new Set([
    'name', 'tag', 'country', 'logo_url', 'avatar_url', 'bio', 'description',
    'nickname', 'game_nickname', 'discord_handle',
    'game', 'game_id', 'server', 'country_account',
    'social_ig', 'social_tiktok', 'social_yt', 'social_twitch', 'social_kick', 'social_x', 'social_fb',
    'avatar', 'logo', 'photo'
  ])

  Object.keys(details).forEach(key => {
    if (key.startsWith('original_')) {
      const mainKey = key.replace('original_', '')
      if (ALREADY_HANDLED_KEYS.has(mainKey)) return
      if (diffs.some(d => d.key === mainKey)) return

      const isImg = mainKey.includes('avatar') || mainKey.includes('logo') || mainKey.includes('photo') || mainKey.includes('image')
      const isLong = mainKey === 'bio' || mainKey === 'description'
      checkField(mainKey, key, getFieldLabel(mainKey), isImg ? 'image' : isLong ? 'longtext' : 'text')
    }
  })

  return diffs
}

export type ValidationType = 'all' | 'jugador' | 'equipo' | 'contrato' | 'modificacion' | 'baja_contrato' | 'inscripcion_torneo' | string

interface PendingRequest {
  id: string
  type: ValidationType
  target_name: string
  created_at: string
  updated_at: string
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

  // Pagination & Search state (default: 10 per page)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const debouncedSearch = useDebounce(searchQuery, 400)

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

  // Petición paginada directa al servidor según la página y filtros activos
  const fetchValidations = async () => {
    setLoading(true)
    try {
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      let query = supabase
        .from('validations')
        .select('*', { count: 'exact' })

      // Filtro por tipo de validación si no es 'all'
      if (activeTab !== 'all') {
        if (activeTab === 'contrato' || activeTab === 'contratos') {
          query = query.in('type', ['contrato', 'contratos', 'baja_contrato'])
        } else {
          query = query.eq('type', activeTab)
        }
      }

      // Filtro por búsqueda
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.trim()
        query = query.or(`target_name.ilike.%${q}%,submitted_by.ilike.%${q}%`)
      }

      // Paginación por rango en Supabase
      query = query
        .order('created_at', { ascending: false })
        .range(from, to)

      const { data: dbValidations, count, error } = await query

      if (error) {
        console.error('Error fetching validations:', error)
        toast.error('Error al cargar validaciones')
        return
      }

      const total = count || 0
      setTotalCount(total)

      // Si la página actual excede el total, regresar a la primera página
      if (currentPage > 1 && from >= total && total > 0) {
        setCurrentPage(1)
        return
      }

      const formattedRequests: PendingRequest[] = (dbValidations || []).map(v => ({
        id: v.id,
        type: v.type as any,
        target_name: v.target_name,
        created_at: v.created_at,
        updated_at: v.updated_at || v.created_at,
        status: v.status,
        submitted_by: v.submitted_by,
        details: v.details || {}
      }))

      setRequests(formattedRequests)
    } catch (err) {
      console.error('Error in fetchValidations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchValidations()
  }, [currentPage, itemsPerPage, activeTab, debouncedSearch])

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
        // Usar el user_id real del jugador desde los detalles, no el ID del registro en validations
        const playerUserId = requestToUpdate.details?.user_id || requestToUpdate.details?.id
        if (playerUserId) {
          await supabase.from('profiles').update({ is_player: false, player_status: 'none' }).eq('id', playerUserId)
        }
        // Eliminar también el registro de validations si existe
        await supabase.from('validations').delete().eq('id', confirmAction.id)
      } else if (requestToUpdate?.type === 'equipo') {
        await supabase.from('teams').delete().eq('id', confirmAction.id)
      } else if (requestToUpdate?.type === 'modificacion') {
        await supabase.from('profiles').update({ edit_requested: false }).eq('id', confirmAction.id)
        await supabase.from('validations').delete().eq('id', confirmAction.id)
      } else if (requestToUpdate?.type === 'contrato' || requestToUpdate?.type === 'baja_contrato' || requestToUpdate?.type === 'inscripcion_torneo') {
        await supabase.from('validations').delete().eq('id', confirmAction.id)
      }
      
      await fetchValidations()
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
          
          if (isApproved) {
            // Aprobación: activar el jugador y asegurar que su país quede persistido
            const countryVal = requestToUpdate.details?.country || requestToUpdate.details?.closest_airport || 'México'
            await supabase.from('profiles').update({
              is_player: true,
              player_status: 'active',
              closest_airport: countryVal
            }).eq('id', targetUserId)
          } else {
            // Rechazo: desactivar el jugador completamente y registrar razón
            await supabase.from('profiles').update({
              is_player: false,
              player_status: 'rejected'
            }).eq('id', targetUserId)
          }
          
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
          const teamUpdates: any = { status: newStatus }

          // Al aprobar, escribir gender_category desde tipoEquipo de la solicitud
          if (isApproved) {
            const tipoEquipo = requestToUpdate.details?.tipoEquipo || requestToUpdate.details?.['item_meta[782]']
            if (tipoEquipo) {
              teamUpdates.gender_category = tipoEquipo.toLowerCase().includes('fem') ? 'female' : 'mixed'
            }
          }

          await supabase.from('teams').update(teamUpdates).eq('id', targetTeamId)
          
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
              if (details.name !== undefined) updates.name = details.name
              if (details.tag !== undefined) updates.tag = details.tag
              if (details.hashtag !== undefined) updates.hashtag = details.hashtag
              if (details.country !== undefined) updates.country = details.country
              if (details.logo_url !== undefined) updates.logo_url = details.logo_url
              if (details.jersey_url !== undefined) updates.jersey_url = details.jersey_url
              if (details.games !== undefined) updates.games = details.games
              if (details.social_ig !== undefined) updates.social_ig = details.social_ig
              if (details.social_tiktok !== undefined) updates.social_tiktok = details.social_tiktok
              if (details.social_yt !== undefined) updates.social_yt = details.social_yt
              if (details.social_fb !== undefined) updates.social_fb = details.social_fb
              if (details.social_twitch !== undefined) updates.social_twitch = details.social_twitch
              if (details.social_kick !== undefined) updates.social_kick = details.social_kick
              if (details.social_x !== undefined) updates.social_x = details.social_x

              if (Object.keys(updates).length > 0) {
                await supabase.from('teams').update(updates).eq('id', details.team_id)
              }

              // Actualizar tipo de equipo en tabla teams y en contratos activos
              const tipoEquipo = details.tipoEquipo || details['item_meta[782]']
              if (tipoEquipo) {
                const newGenderCategory = tipoEquipo.toLowerCase().includes('fem') ? 'female' : 'mixed'
                // 1. Persistir en tabla teams (fuente de verdad)
                await supabase
                  .from('teams')
                  .update({ gender_category: newGenderCategory })
                  .eq('id', details.team_id)
                // 2. Sincronizar en contratos activos
                await supabase
                  .from('contracts')
                  .update({ team_gender_category: newGenderCategory })
                  .eq('team_id', details.team_id)
                  .in('status', ['active', 'activo', 'pending_player_release', 'pending_manager_release'])
              }

              if (details.manager_id) {
                const managerUpdates: any = {}
                if (details.manager_name) managerUpdates.name = details.manager_name
                if (details.manager_nickname) managerUpdates.nickname = details.manager_nickname
                if (details.manager_discord) managerUpdates.discord_handle = details.manager_discord

                if (Object.keys(managerUpdates).length > 0) {
                  await supabase.from('profiles').update(managerUpdates).eq('id', details.manager_id)
                }
              }

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
              if (details.name !== undefined && details.name !== '') updates.name = formatPersonName(details.name).trim()
              if (details.nickname !== undefined && details.nickname !== '') updates.nickname = formatNickname(details.nickname).trim()
              if (details.game_nickname !== undefined && details.game_nickname !== '') {
                updates.game_nickname = formatNickname(details.game_nickname).trim()
              } else if (updates.nickname) {
                updates.game_nickname = updates.nickname
              }
              if (details.discord_handle !== undefined) updates.discord_handle = details.discord_handle
              if (details.avatar_url !== undefined && details.avatar_url !== '') updates.avatar_url = details.avatar_url
              if (details.closest_airport !== undefined) updates.closest_airport = details.closest_airport
              if (details.social_ig !== undefined) updates.social_ig = details.social_ig
              if (details.social_tiktok !== undefined) updates.social_tiktok = details.social_tiktok
              if (details.social_yt !== undefined) updates.social_yt = details.social_yt
              if (details.social_twitch !== undefined) updates.social_twitch = details.social_twitch
              if (details.social_kick !== undefined) updates.social_kick = details.social_kick
              if (details.social_x !== undefined) updates.social_x = details.social_x
              if (details.social_fb !== undefined) updates.social_fb = details.social_fb

              const { error: profErr } = await supabase.from('profiles').update(updates).eq('id', userId)
              if (profErr) {
                console.error('Error updating profiles:', profErr)
                toast.error('Error actualizando perfil: ' + profErr.message)
                return
              }

              // Actualizar datos de juego en player_game_info si fueron provistos
              try {
                if (details.game_id !== undefined || details.server !== undefined || details.country_account !== undefined || details.game !== undefined || details.nickname !== undefined || details.game_nickname !== undefined) {
                  const gameUpdates: any = {}
                  if (details.game !== undefined && details.game !== '') gameUpdates.game = details.game
                  if (details.game_id !== undefined) gameUpdates.game_id = details.game_id
                  if (details.server !== undefined) gameUpdates.server = details.server
                  if (details.country_account !== undefined) gameUpdates.country_account = details.country_account
                  if (details.game_nickname !== undefined && details.game_nickname !== '') {
                    gameUpdates.game_nickname = formatNickname(details.game_nickname).trim()
                  } else if (details.nickname !== undefined && details.nickname !== '') {
                    gameUpdates.game_nickname = formatNickname(details.nickname).trim()
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
              } catch (gameErr) {
                console.warn('Advertencia actualizando player_game_info:', gameErr)
              }
              
              // Actualizar en tabla validations
              await supabase.from('validations').update({
                status: 'approved',
                details: {
                  ...details,
                  status: 'approved',
                  user_id: userId
                }
              }).eq('id', confirmAction.id)

              // Actualizar también como respaldo por user_id
              await supabase.from('validations').update({
                status: 'approved',
                details: {
                  ...details,
                  status: 'approved',
                  user_id: userId
                }
              }).eq('type', 'modificacion').eq('status', 'pending').filter('details->>user_id', 'eq', userId)
            } else {
              // Revertir y registrar rechazo con motivo obligatorio
              await supabase.from('profiles').update({ edit_requested: false }).eq('id', userId)

              await supabase.from('validations').update({
                status: 'rejected',
                details: {
                  ...details,
                  rejection_reason: reason,
                  status: 'rejected',
                  user_id: userId
                }
              }).eq('id', confirmAction.id)

              await supabase.from('validations').update({
                status: 'rejected',
                details: {
                  ...details,
                  rejection_reason: reason,
                  status: 'rejected',
                  user_id: userId
                }
              }).eq('type', 'modificacion').eq('status', 'pending').filter('details->>user_id', 'eq', userId)
            }
          }
        } else if (requestToUpdate.type === 'contrato') {
          const contractId = requestToUpdate.details?.contract_id
          if (contractId) {
            if (isApproved) {
              await supabase.from('contracts').update({
                status: 'active',
                start_date: new Date().toISOString()
              }).eq('id', contractId)
            } else {
              await supabase.from('contracts').update({
                status: 'rejected'
              }).eq('id', contractId)
            }
          }
          await supabase.from('validations').update({
            status: newStatus,
            details: {
              ...requestToUpdate.details,
              rejection_reason: isApproved ? null : reason,
              status: newStatus
            }
          }).eq('id', confirmAction.id)
        } else if (requestToUpdate.type === 'baja_contrato') {
          await supabase.from('validations').update({
            status: newStatus,
            details: {
              ...requestToUpdate.details,
              rejection_reason: isApproved ? null : reason,
              status: newStatus
            }
          }).eq('id', confirmAction.id)
        } else if (requestToUpdate.type === 'inscripcion_torneo') {
          const tournamentId = requestToUpdate.details?.tournament_id
          const teamId = requestToUpdate.details?.team_id
          if (tournamentId && teamId && isApproved) {
            const { error: insertTeamError } = await supabase.from('tournament_teams').insert({
              tournament_id: tournamentId,
              team_id: teamId
            })
            if (insertTeamError) {
              console.warn('Advertencia al insertar en tournament_teams:', insertTeamError)
            }
          }
          await supabase.from('validations').update({
            status: newStatus,
            details: {
              ...requestToUpdate.details,
              rejection_reason: isApproved ? null : reason,
              status: newStatus
            }
          }).eq('id', confirmAction.id)
        }
      }

      await fetchValidations()

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
    const { player_game_info, profiles, teams, bio, country, ...cleanDetails } = editingDetails;

    if (cleanDetails.name) cleanDetails.name = formatPersonName(cleanDetails.name).trim()
    if (cleanDetails.nickname) cleanDetails.nickname = formatNickname(cleanDetails.nickname).trim()
    if (cleanDetails.game_nickname) cleanDetails.game_nickname = formatNickname(cleanDetails.game_nickname).trim()

    let error = null;
    
    try {
      if (selectedRequest.type === 'jugador') {
        const { error: err } = await supabase.from('profiles').update(cleanDetails).eq('id', selectedRequest.id)
        error = err;
      } else if (selectedRequest.type === 'equipo') {
        const { error: err } = await supabase.from('teams').update(cleanDetails).eq('id', selectedRequest.id)
        error = err;
      } else if (selectedRequest.type === 'modificacion') {
        const isTeamMod = Boolean(selectedRequest.details?.team_id)
        if (isTeamMod) {
          const { error: err } = await supabase.from('teams').update(cleanDetails).eq('id', selectedRequest.details.team_id)
          error = err;
        } else {
          const userId = selectedRequest.details?.user_id || selectedRequest.id
          const { error: err } = await supabase.from('profiles').update({ ...cleanDetails, edit_requested: false }).eq('id', userId)
          error = err;
        }
        await supabase.from('validations').update({ details: editingDetails }).eq('id', selectedRequest.id)
      } else if (selectedRequest.type === 'contrato' || selectedRequest.type === 'baja_contrato') {
        const { error: err } = await supabase.from('validations').update({ details: editingDetails }).eq('id', selectedRequest.id)
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
            } else if (req.type === 'contrato' || req.type === 'baja_contrato') {
              if (editingDetails.status) newStatus = editingDetails.status;
            }
            
            return { ...req, target_name: targetName, details: editingDetails, status: newStatus }
          }
          return req
        }))
        setSelectedRequest({ ...selectedRequest, target_name: editingDetails.nickname || editingDetails.name || selectedRequest.target_name, details: editingDetails, status: editingDetails.status || editingDetails.player_status || selectedRequest.status })
        await fetchValidations()
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
      case 'contrato':
      case 'contratos':
      case 'baja_contrato': return <ScrollText className="w-5 h-5 text-purple-400" />
      case 'inscripcion_torneo': return <Trophy className="w-5 h-5 text-yellow-400" />
      default: return <FileText className="w-5 h-5 text-muted-foreground" />
    }
  }

  // Pagination calculations (Server-side paginated via Supabase range)
  const totalItems = totalCount
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage
  const endIndex = totalItems === 0 ? 0 : Math.min(startIndex + requests.length, totalItems)

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
          {[
            { id: 'all', label: 'Todas' },
            { id: 'jugador', label: 'Jugadores' },
            { id: 'equipo', label: 'Equipos' },
            { id: 'contrato', label: 'Contratos' },
            { id: 'modificacion', label: 'Modificaciones' },
            { id: 'inscripcion_torneo', label: 'Torneos' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as ValidationType)}
              className={cn(
                "px-4 py-2 rounded-md font-display text-sm font-600 uppercase tracking-wider transition-colors",
                activeTab === tab.id 
                  ? "bg-primary text-white" 
                  : "bg-background border border-border text-muted-foreground hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground animate-pulse">Cargando validaciones...</p>
          </div>
        ) : requests.length === 0 ? (
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
                {requests.map(req => (
                  <tr key={req.id} className="transition-colors hover:bg-white/5">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 uppercase font-500 text-xs">
                        {getTypeIcon(req.type)}
                        {req.type === 'baja_contrato' ? 'Baja Contrato' : req.type === 'contrato' ? 'Contrato' : req.type === 'inscripcion_torneo' ? 'Inscripción Torneo' : req.type}
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
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={5}>5 por página</option>
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
              {selectedRequest.type === 'inscripcion_torneo' ? (
                <div className="space-y-6">
                  {/* Card con datos del torneo y equipo */}
                  <div className="p-5 rounded-xl border border-border bg-background space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="text-xs font-700 uppercase tracking-wider text-primary">Torneo de Destino</span>
                      <span className="text-xs font-600 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {selectedRequest.details?.game || 'Torneo'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {selectedRequest.details?.tournament_logo && (
                        <img 
                          src={selectedRequest.details.tournament_logo} 
                          alt="Torneo" 
                          className="w-14 h-14 rounded-xl object-cover bg-surface border border-border"
                        />
                      )}
                      <div>
                        <h4 className="font-display text-lg font-700 uppercase text-white">
                          {selectedRequest.details?.tournament_name || selectedRequest.target_name}
                        </h4>
                        <p className="text-xs text-muted-foreground font-mono">
                          ID Torneo: {selectedRequest.details?.tournament_id}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border border-border bg-background space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="text-xs font-700 uppercase tracking-wider text-primary">Equipo Solicitante</span>
                      {selectedRequest.details?.team_tag && (
                        <span className="text-xs font-mono font-600 px-2.5 py-0.5 rounded bg-surface border border-border text-white">
                          [{selectedRequest.details.team_tag}]
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <img 
                        src={selectedRequest.details?.team_logo || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                        alt="Equipo" 
                        className="w-14 h-14 rounded-full object-cover bg-surface border border-border"
                      />
                      <div>
                        <h4 className="font-display text-lg font-700 uppercase text-white">
                          {selectedRequest.details?.team_name}
                        </h4>
                        <p className="text-xs text-muted-foreground font-mono">
                          ID Equipo: {selectedRequest.details?.team_id}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border border-border bg-background space-y-2">
                    <span className="text-xs font-700 uppercase tracking-wider text-primary block">Datos del Manager</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <span className="text-[11px] text-muted-foreground uppercase block">Nombre / Nickname:</span>
                        <p className="text-sm font-600 text-white">{selectedRequest.details?.manager_name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground uppercase block">Correo Electrónico:</span>
                        <p className="text-sm font-600 text-white">{selectedRequest.details?.manager_email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {selectedRequest.details?.rejection_reason && (
                    <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10">
                      <span className="text-xs font-700 uppercase tracking-wider text-red-400 block mb-1">Motivo del Rechazo:</span>
                      <p className="text-sm text-red-200">{selectedRequest.details.rejection_reason}</p>
                    </div>
                  )}
                </div>
              ) : selectedRequest.type === 'modificacion' ? (
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
