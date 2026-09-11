'use client'

import { useState, useEffect } from 'react'
import { 
  ShieldCheck, 
  Users, 
  MapPin, 
  ExternalLink, 
  Eye, 
  Trash2, 
  X, 
  AlertCircle, 
  Check, 
  ImageIcon, 
  FileText, 
  Download, 
  Save, 
  Upload, 
  ZoomIn, 
  ChevronDown, 
  UserX,
  Edit,
  Share2,
  Trophy,
  Loader2,
  Globe,
  Ban
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { cn, formatLocation, extractCountry, formatRoleTitle, DEFAULT_COUNTRIES } from '@/lib/utils'
import { GmxButton } from '@/components/gmx-button'
import { toast } from 'sonner'

interface PlayerRoster {
  contractId: string
  playerId: string
  nickname: string
  name: string
  country: string
  discord: string
  status: string
  roles: any
}

interface PastContractRoster {
  contractId: string
  playerId: string
  nickname: string
  name: string
  roles: any
  conclusionDate: string | null
  justification?: string | null
  adminName?: string | null
}

interface Team {
  id: string
  name: string
  tag?: string
  hashtag?: string
  captain: string
  managerDiscord: string
  region: string
  logo: string
  jersey?: string
  status: 'active' | 'inactive' | 'banned' | 'pending' | string
  points: number
  foundation_date: string
  roster: PlayerRoster[]
  pastContracts: PastContractRoster[]
  rawDetails: any
}

interface ManagerProfile {
  id: string
  name: string
  nickname?: string | null
  discord_handle?: string | null
  email?: string | null
}

interface EditingTeamState {
  id: string
  name: string
  tag: string
  hashtag: string
  country: string
  status: string
  manager_id: string
  logo_url: string
  jersey_url: string
  games: string[]
  social_x: string
  social_ig: string
  social_tiktok: string
  social_yt: string
  social_fb: string
  social_twitch: string
  social_kick: string
}

export function AdminTeams() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [modalTab, setModalTab] = useState<'info' | 'roster'>('info')
  const [editingTeam, setEditingTeam] = useState<EditingTeamState | null>(null)
  const [isSavingTeam, setIsSavingTeam] = useState(false)
  const [availableManagers, setAvailableManagers] = useState<ManagerProfile[]>([])
  const [lightboxImage, setLightboxImage] = useState<{ src: string; label: string } | null>(null)

  const [confirmAction, setConfirmAction] = useState<{ id: string, name: string } | null>(null)
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
  const [filterRegion, setFilterRegion] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Quick Status Modal state
  const [statusModalTeam, setStatusModalTeam] = useState<Team | null>(null)
  const [quickNewStatus, setQuickNewStatus] = useState<string>('active')
  const [isUpdatingQuickStatus, setIsUpdatingQuickStatus] = useState(false)

  // Reiniciar seleccionados al cambiar cualquier filtro o búsqueda
  useEffect(() => {
    setSelectedIds(new Set())
  }, [searchQuery, filterRegion, filterStatus])

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true)

      // Cargar registros de bajas de contrato previas de administradores
      const { data: validationsData } = await supabase
        .from('validations')
        .select('*')
        .eq('type', 'baja_contrato')

      const terminationsMap = new Map<string, any>()
      if (validationsData) {
        validationsData.forEach((v: any) => {
          if (v.details?.contract_id) {
            terminationsMap.set(v.details.contract_id, v)
          }
        })
      }

      // Cargar perfiles de managers disponibles para asignación
      const { data: managersData } = await supabase
        .from('profiles')
        .select('id, name, nickname, discord_handle, email')
        .order('name')

      if (managersData) {
        setAvailableManagers(managersData)
      }

      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          manager:profiles!teams_manager_id_fkey(name, nickname, discord_handle),
          contracts(
            id,
            player_id,
            status,
            roles,
            conclusion_date,
            profiles!contracts_player_id_fkey(id, name, nickname, discord_handle, closest_airport)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error al cargar equipos:', error)
        toast.error('Error al cargar equipos: ' + error.message)
      }
      
      if (data) {
        const formattedTeams = data.map((t: any) => {
          const activeContracts = t.contracts?.filter((c: any) => 
            c.status === 'active' || c.status === 'activo' || c.status === 'pending_player_release' || c.status === 'pending_manager_release'
          ) || []

          const roster: PlayerRoster[] = activeContracts.map((c: any) => ({
            contractId: c.id,
            playerId: c.player_id,
            name: c.profiles?.name || 'N/A',
            nickname: c.profiles?.nickname || c.profiles?.name || 'N/A',
            country: extractCountry(c.profiles?.closest_airport) || 'N/A',
            discord: c.profiles?.discord_handle || 'N/A',
            status: c.status,
            roles: c.roles
          }))

          const pastCon = t.contracts?.filter((c: any) => 
            c.status === 'completado' || c.status === 'completed' || c.status === 'cancelado' || c.status === 'rejected'
          ) || []

          const pastContracts: PastContractRoster[] = pastCon.map((c: any) => {
            const terminationLog = terminationsMap.get(c.id)
            return {
              contractId: c.id,
              playerId: c.player_id,
              name: c.profiles?.name || 'N/A',
              nickname: c.profiles?.nickname || c.profiles?.name || 'N/A',
              roles: c.roles,
              conclusionDate: c.conclusion_date,
              justification: terminationLog?.details?.justification || null,
              adminName: terminationLog?.details?.admin_nickname || terminationLog?.details?.admin_name || terminationLog?.submitted_by || null
            }
          })

          // Normalizar status para que coincida con los filtros
          const rawStatus = t.status || 'inactive'
          let normalizedStatus = rawStatus
          if (rawStatus === 'approved' || rawStatus === 'activo') normalizedStatus = 'active'
          else if (rawStatus === 'pendiente') normalizedStatus = 'pending'
          else if (rawStatus === 'completado' || rawStatus === 'cancelado') normalizedStatus = 'inactive'
          const status = normalizedStatus

          return {
            id: t.id,
            name: t.name,
            tag: t.tag || '',
            hashtag: t.hashtag || '',
            captain: t.manager?.nickname || t.manager?.name || 'Sin Manager',
            managerDiscord: t.manager?.discord_handle || 'Sin Discord',
            region: t.country || 'Sin Región',
            logo: t.logo_url || '',
            jersey: t.jersey_url || '',
            status,
            points: 0,
            foundation_date: new Date(t.created_at).toLocaleDateString(),
            roster,
            pastContracts,
            rawDetails: t
          }
        })
        setTeams(formattedTeams)
      }
      setLoading(false)
    }
    fetchTeams()
  }, [])

  useEffect(() => {
    if (selectedTeam || confirmAction || terminatingContract || lightboxImage || statusModalTeam) {
      window.__lenis?.stop()
    } else {
      window.__lenis?.start()
    }
    return () => { window.__lenis?.start() }
  }, [selectedTeam, confirmAction, terminatingContract, lightboxImage, statusModalTeam])

  const openTeamDetails = (team: Team) => {
    const raw = team.rawDetails || {}
    setSelectedTeam(team)
    setEditingTeam({
      id: team.id,
      name: raw.name || team.name || '',
      tag: raw.tag || '',
      hashtag: raw.hashtag || '',
      country: raw.country || team.region || 'México',
      status: team.status || 'active',
      manager_id: raw.manager_id || '',
      logo_url: raw.logo_url || team.logo || '',
      jersey_url: raw.jersey_url || team.jersey || '',
      games: Array.isArray(raw.games) && raw.games.length > 0 ? raw.games : ['Mobile Legends'],
      social_x: raw.social_x || '',
      social_ig: raw.social_ig || '',
      social_tiktok: raw.social_tiktok || '',
      social_yt: raw.social_yt || '',
      social_fb: raw.social_fb || '',
      social_twitch: raw.social_twitch || '',
      social_kick: raw.social_kick || '',
    })
    setModalTab('info')
  }

  const handleUploadTeamMedia = async (file: File, fieldKey: 'logo_url' | 'jersey_url') => {
    try {
      toast.loading('Subiendo imagen del equipo...', { id: 'upload-team-media' })
      const fileExt = file.name.split('.').pop()
      const fileName = `team_${fieldKey}_${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage.from('teams').upload(fileName, file)
      if (error) throw error
      const { data: pUrl } = supabase.storage.from('teams').getPublicUrl(data.path)
      const newUrl = pUrl.publicUrl
      setEditingTeam(prev => prev ? { ...prev, [fieldKey]: newUrl } : null)
      toast.success('Imagen subida correctamente', { id: 'upload-team-media' })
    } catch (err: any) {
      console.error('Error uploading team media:', err)
      toast.error('Error al subir imagen: ' + (err?.message || 'Error desconocido'), { id: 'upload-team-media' })
    }
  }

  const handleQuickStatusUpdate = async () => {
    if (!statusModalTeam) return
    setIsUpdatingQuickStatus(true)
    toast.loading('Actualizando estado del equipo...', { id: 'quick-status-team' })
    try {
      const { error } = await supabase
        .from('teams')
        .update({ status: quickNewStatus })
        .eq('id', statusModalTeam.id)

      if (error) throw error

      setTeams(prev => prev.map(t => t.id === statusModalTeam.id ? { ...t, status: quickNewStatus } : t))
      if (selectedTeam && selectedTeam.id === statusModalTeam.id) {
        setSelectedTeam(prev => prev ? { ...prev, status: quickNewStatus } : null)
      }
      if (editingTeam && editingTeam.id === statusModalTeam.id) {
        setEditingTeam(prev => prev ? { ...prev, status: quickNewStatus } : null)
      }

      // Sincronizar con la tabla validations si existe solicitud
      try {
        await supabase
          .from('validations')
          .update({ status: quickNewStatus === 'banned' ? 'rejected' : quickNewStatus })
          .or(`details->>team_id.eq.${statusModalTeam.id},target_name.eq.${statusModalTeam.name}`)
      } catch (vErr) {
        console.warn('Sync validation warning:', vErr)
      }

      const statusLabels: Record<string, string> = {
        active: 'Activo',
        pending: 'En Revisión',
        inactive: 'Inactivo',
        banned: 'Baneado'
      }
      toast.success(`Estado de "${statusModalTeam.name}" actualizado a ${statusLabels[quickNewStatus] || quickNewStatus}`, { id: 'quick-status-team' })
      setStatusModalTeam(null)
    } catch (err: any) {
      console.error('Error updating team status:', err)
      toast.error('Error al actualizar estado: ' + (err?.message || 'Error inesperado'), { id: 'quick-status-team' })
    } finally {
      setIsUpdatingQuickStatus(false)
    }
  }

  const handleSaveTeam = async () => {
    if (!editingTeam || !selectedTeam) return
    const nameVal = editingTeam.name.trim()
    if (!nameVal) {
      toast.error('El nombre del equipo no puede estar vacío.')
      return
    }

    setIsSavingTeam(true)
    toast.loading('Guardando cambios del equipo...', { id: 'save-team' })

    try {
      const updates = {
        name: nameVal,
        tag: editingTeam.tag.trim().toUpperCase() || null,
        hashtag: editingTeam.hashtag.trim() || null,
        country: editingTeam.country.trim() || 'México',
        status: editingTeam.status || 'active',
        manager_id: editingTeam.manager_id ? editingTeam.manager_id : null,
        logo_url: editingTeam.logo_url.trim() || null,
        jersey_url: editingTeam.jersey_url.trim() || null,
        games: editingTeam.games.length > 0 ? editingTeam.games : ['Mobile Legends'],
        social_x: editingTeam.social_x.trim() || null,
        social_ig: editingTeam.social_ig.trim() || null,
        social_tiktok: editingTeam.social_tiktok.trim() || null,
        social_yt: editingTeam.social_yt.trim() || null,
        social_fb: editingTeam.social_fb.trim() || null,
        social_twitch: editingTeam.social_twitch.trim() || null,
        social_kick: editingTeam.social_kick.trim() || null,
      }

      const { error } = await supabase.from('teams').update(updates).eq('id', editingTeam.id)
      if (error) throw error

      // Sincronizar con la tabla validations si existe solicitud
      try {
        await supabase
          .from('validations')
          .update({ status: updates.status === 'banned' ? 'rejected' : updates.status })
          .or(`details->>team_id.eq.${editingTeam.id},target_name.eq.${editingTeam.name}`)
      } catch (vErr) {
        console.warn('Sync validation warning:', vErr)
      }

      // Obtener información del nuevo manager
      const newManager = availableManagers.find(m => m.id === updates.manager_id)
      const captainName = newManager ? (newManager.nickname || newManager.name) : 'Sin Manager'
      const managerDiscord = newManager?.discord_handle || 'Sin Discord'

      const updatedTeamObj: Team = {
        ...selectedTeam,
        name: updates.name,
        tag: updates.tag || '',
        hashtag: updates.hashtag || '',
        region: updates.country,
        status: updates.status,
        logo: updates.logo_url || '',
        jersey: updates.jersey_url || '',
        captain: captainName,
        managerDiscord: managerDiscord,
        rawDetails: {
          ...selectedTeam.rawDetails,
          ...updates
        }
      }

      setTeams(prev => prev.map(t => t.id === editingTeam.id ? updatedTeamObj : t))
      setSelectedTeam(updatedTeamObj)

      toast.success('Información del equipo guardada con éxito', { id: 'save-team' })
    } catch (err: any) {
      console.error('Error saving team:', err)
      toast.error('Error al guardar equipo: ' + (err?.message || 'Error inesperado'), { id: 'save-team' })
    } finally {
      setIsSavingTeam(false)
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
        description: `Se dio de baja inmediatamente a ${terminatingContract.playerName}. La justificación quedó registrada.`
      })

      // Actualizar estado local
      const movedPlayer = selectedTeam?.roster.find(p => p.contractId === terminatingContract.contractId)
      const newPastItem: PastContractRoster = {
        contractId: terminatingContract.contractId,
        playerId: terminatingContract.playerId,
        name: terminatingContract.playerName,
        nickname: movedPlayer?.nickname || terminatingContract.playerName,
        roles: movedPlayer?.roles || [],
        conclusionDate: new Date().toISOString(),
        justification: trimmed,
        adminName: user?.name || user?.email || 'Administrador'
      }

      setTeams(prev => prev.map(t => {
        if (t.id === terminatingContract.teamId) {
          return {
            ...t,
            roster: t.roster.filter(p => p.contractId !== terminatingContract.contractId),
            pastContracts: [newPastItem, ...(t.pastContracts || [])]
          }
        }
        return t
      }))

      if (selectedTeam && selectedTeam.id === terminatingContract.teamId) {
        setSelectedTeam({
          ...selectedTeam,
          roster: selectedTeam.roster.filter(p => p.contractId !== terminatingContract.contractId),
          pastContracts: [newPastItem, ...(selectedTeam.pastContracts || [])]
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

  const handleDelete = async () => {
    if (confirmAction) {
      await supabase.from('teams').delete().eq('id', confirmAction.id)
      setTeams(prev => prev.filter(t => t.id !== confirmAction.id))
      setConfirmAction(null)
      toast.success('Equipo eliminado correctamente')
    }
  }

  // Unique regions — sorted alphabetically
  const uniqueRegions = Array.from(new Set(teams.map(t => t.region).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))

  // Filter and Sort
  const filteredAndSortedTeams = (() => {
    let result = teams.filter(t => {
      if (filterRegion !== 'all' && t.region !== filterRegion) return false
      if (filterStatus !== 'all' && t.status !== filterStatus) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return t.name.toLowerCase().includes(q)
      }
      return true
    })

    const statusWeight: Record<string, number> = { active: 4, pending: 3, inactive: 2, banned: 1 }
    result.sort((a, b) => {
      const weightA = statusWeight[a.status] || 0
      const weightB = statusWeight[b.status] || 0
      if (weightA !== weightB) {
        return weightB - weightA
      }
      return new Date(b.foundation_date).getTime() - new Date(a.foundation_date).getTime()
    })

    return result
  })()

  const downloadTeamsCSV = (list: Team[], baseName: string) => {
    const date = new Date()
    const dateStr = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`
    const headers = ['Nombre', 'Tag', 'Hashtag', 'Estado', 'País / Región', 'Manager', 'Discord Manager', 'Jugadores Activos', 'Fecha Creación', 'Logo URL', 'Jersey URL']
    const csvContent = [
      headers.join(','),
      ...list.map(t => {
        const rosterNames = t.roster.map(p => p.nickname || p.name).join(' | ')
        return [
          `"${(t.name || '').replace(/"/g, '""')}"`,
          `"${(t.tag || '').replace(/"/g, '""')}"`,
          `"${(t.hashtag || '').replace(/"/g, '""')}"`,
          `"${t.status}"`,
          `"${(t.region || '').replace(/"/g, '""')}"`,
          `"${(t.captain || '').replace(/"/g, '""')}"`,
          `"${(t.managerDiscord || '').replace(/"/g, '""')}"`,
          `"${rosterNames.replace(/"/g, '""')}"`,
          `"${t.foundation_date}"`,
          `"${t.logo || ''}"`,
          `"${t.jersey || ''}"`,
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

  const exportAllTeamsCSV = () => {
    if (filteredAndSortedTeams.length === 0) return alert('No hay equipos para exportar con los filtros actuales.')
    const suffix = filterStatus !== 'all' ? `_estado_${filterStatus}` :
                   filterRegion !== 'all' ? `_pais_${filterRegion}` : '_todos'
    downloadTeamsCSV(filteredAndSortedTeams, `equipos${suffix}`)
  }

  const exportSelectedTeamsCSV = () => {
    const toExport = teams.filter(t => selectedIds.has(t.id))
    if (toExport.length === 0) return alert('Selecciona al menos un equipo para exportar.')
    downloadTeamsCSV(toExport, 'equipos_seleccionados')
  }

  const socialPlatforms = [
    { key: 'social_x', label: 'X (Twitter)', placeholder: 'https://x.com/...' },
    { key: 'social_ig', label: 'Instagram', placeholder: 'https://instagram.com/...' },
    { key: 'social_tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
    { key: 'social_yt', label: 'YouTube', placeholder: 'https://youtube.com/@...' },
    { key: 'social_fb', label: 'Facebook', placeholder: 'https://facebook.com/...' },
    { key: 'social_twitch', label: 'Twitch', placeholder: 'https://twitch.tv/...' },
    { key: 'social_kick', label: 'Kick', placeholder: 'https://kick.com/...' },
  ] as const

  const countrySelectOptions = Array.from(new Set([
    ...DEFAULT_COUNTRIES,
    editingTeam?.country
  ].filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'es'))

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        
        {/* Header & Filters */}
        <div className="flex flex-col gap-4 mb-8">

          {/* Fila 1: Título + Exportar */}
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white shrink-0">
              Equipos
            </h2>
            <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-600 text-primary">
              {filteredAndSortedTeams.length} Total
            </span>
            <GmxButton onClick={exportAllTeamsCSV} className="h-9 px-3 gap-2 text-xs" variant="secondary">
              <Download className="w-3.5 h-3.5" />
              Exportar Todo ({filteredAndSortedTeams.length})
            </GmxButton>
            {selectedIds.size > 0 && (
              <GmxButton onClick={exportSelectedTeamsCSV} className="h-9 px-3 gap-2 text-xs" variant="secondary">
                <Download className="w-3.5 h-3.5" />
                Selección ({selectedIds.size})
              </GmxButton>
            )}
          </div>

          {/* Fila 2: Búsqueda + Filtros */}
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Buscar por nombre de equipo..."
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
                <option value="pending">En Revisión</option>
                <option value="inactive">Inactivos</option>
                <option value="banned">Baneados</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            <div className="relative">
              <select
                value={filterRegion}
                onChange={e => setFilterRegion(e.target.value)}
                className="appearance-none rounded-lg border border-border bg-background px-4 py-2.5 pr-9 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/50 transition-colors cursor-pointer font-500"
              >
                <option value="all">Todos los Países</option>
                {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground animate-pulse">Cargando equipos...</p>
          </div>
        ) : filteredAndSortedTeams.length === 0 ? (
          <div className="flex justify-center items-center py-12 border border-dashed border-border rounded-lg bg-background/50">
            <p className="text-muted-foreground">No hay equipos que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedTeams.map(team => (
              <div 
                key={team.id} 
                className={cn(
                  "group relative flex flex-col items-center rounded-lg border bg-background p-6 text-center transition-colors",
                  team.status === 'banned' 
                    ? "border-red-500/50 bg-red-950/5 hover:border-red-500 shadow-sm shadow-red-950/20" 
                    : "border-border hover:border-primary/50"
                )}
              >
                
                {team.status === 'banned' && (
                  <div className="absolute -top-2.5 left-4 z-10">
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white font-extrabold text-[10px] tracking-wider uppercase shadow flex items-center gap-1">
                      <Ban className="w-3 h-3" />
                      Baneado
                    </span>
                  </div>
                )}

                <div className="absolute right-3 top-3 flex items-center gap-1.5 z-10">
                  <button 
                    onClick={() => {
                      setStatusModalTeam(team)
                      setQuickNewStatus(team.status)
                    }}
                    title="Cambiar Estado (Activo / Baneado / etc.)"
                    className={cn(
                      "p-2 transition-colors bg-surface border border-border rounded-md",
                      team.status === 'banned' 
                        ? "text-red-400 border-red-500/40 hover:bg-red-500/20" 
                        : "text-muted-foreground hover:text-white hover:border-primary"
                    )}
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => openTeamDetails(team)}
                    title="Editar Información"
                    className="p-2 text-muted-foreground hover:text-white transition-colors bg-surface border border-border rounded-md hover:border-primary"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setConfirmAction({ id: team.id, name: team.name })}
                    title="Eliminar Equipo"
                    className="p-2 text-muted-foreground hover:text-red-500 transition-colors bg-surface border border-border rounded-md hover:border-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative mb-4">
                  <img 
                    src={team.logo || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                    alt={team.name} 
                    className={cn(
                      "h-20 w-20 rounded-full object-cover ring-4 ring-surface bg-surface",
                      team.status === 'banned' ? "grayscale opacity-70 ring-red-500/30" : ""
                    )}
                  />
                  {team.tag && (
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-primary text-black font-extrabold text-[10px] tracking-wider uppercase shadow">
                      {team.tag}
                    </span>
                  )}
                </div>

                <h3 className={cn(
                  "mb-1 font-display text-lg font-700 uppercase transition-colors",
                  team.status === 'banned' ? "text-red-400 line-through" : "text-white group-hover:text-primary"
                )}>
                  {team.name}
                </h3>
                
                <div className="mb-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    <span>{team.captain || 'Sin Capitán'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{team.region || 'Sin Región'}</span>
                  </div>
                </div>

                <div className="mt-auto flex w-full items-center justify-between border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusModalTeam(team)
                      setQuickNewStatus(team.status)
                    }}
                    title="Clic para cambiar estado"
                    className="flex items-center gap-1.5 text-sm font-500 text-white hover:opacity-80 transition-opacity cursor-pointer group/btn"
                  >
                    <Users className="h-4 w-4 text-primary" />
                    {team.status === 'active' ? (
                       <span className="text-emerald-500 font-semibold text-xs uppercase group-hover/btn:underline">Activo</span>
                    ) : team.status === 'pending' ? (
                       <span className="text-amber-400 font-semibold text-xs uppercase group-hover/btn:underline">En Revisión</span>
                    ) : team.status === 'banned' ? (
                       <span className="text-red-500 font-semibold text-xs uppercase group-hover/btn:underline">Baneado</span>
                    ) : (
                       <span className="text-yellow-500 font-semibold text-xs uppercase group-hover/btn:underline">Inactivo</span>
                    )}
                  </button>
                  <button 
                    onClick={() => openTeamDetails(team)} 
                    className="text-xs font-600 text-primary hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>Editar / Roster</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details & Edit Modal */}
      {selectedTeam && editingTeam && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedTeam(null)} />
          <div className="relative flex flex-col w-full max-w-4xl h-[92vh] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Header Fijo */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4 bg-surface z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
                    Administración de Equipo
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Modifica todos los datos oficiales, multimedia, estado y roster del equipo.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTeam(null)}
                className="text-muted-foreground hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Pestañas */}
            <div className="flex border-b border-border bg-background/50 px-6 gap-2">
              <button
                type="button"
                onClick={() => setModalTab('info')}
                className={cn(
                  "py-3 px-4 font-display text-xs font-700 uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2",
                  modalTab === 'info'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-white"
                )}
              >
                <Edit className="w-4 h-4" />
                Datos del Equipo
              </button>
              <button
                type="button"
                onClick={() => setModalTab('roster')}
                className={cn(
                  "py-3 px-4 font-display text-xs font-700 uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2",
                  modalTab === 'roster'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-white"
                )}
              >
                <Users className="w-4 h-4" />
                Roster y Contratos
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
                  {selectedTeam.roster.length}
                </span>
              </button>
            </div>
            
            {/* Body con Scroll */}
            <div data-lenis-prevent data-modal-scrollbody className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-6">
              
              {modalTab === 'info' ? (
                <div className="space-y-6">

                  {/* Resumen Superior */}
                  <div className="rounded-xl border border-border bg-background/60 p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img 
                        src={editingTeam.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                        alt={editingTeam.name} 
                        className="h-16 w-16 rounded-full border-2 border-primary/30 object-cover bg-surface"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-display text-xl font-bold uppercase text-white">
                            {editingTeam.name || 'Sin Nombre'}
                          </h4>
                          {editingTeam.tag && (
                            <span className="px-2 py-0.5 rounded bg-primary text-black font-extrabold text-xs tracking-wider uppercase">
                              [{editingTeam.tag}]
                            </span>
                          )}
                          {editingTeam.hashtag && (
                            <span className="text-xs text-primary font-semibold">
                              {editingTeam.hashtag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ID: <span className="text-white font-mono text-[11px]">{editingTeam.id}</span> • Fundación: {selectedTeam.foundation_date}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-xs font-700 uppercase tracking-wider text-muted-foreground">
                        Estado:
                      </span>
                      <div className="relative">
                        <select
                          value={editingTeam.status}
                          onChange={(e) => setEditingTeam({ ...editingTeam, status: e.target.value })}
                          className={cn(
                            "appearance-none rounded-lg border px-3 py-1.5 pr-8 text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-1 cursor-pointer transition-colors",
                            editingTeam.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 focus:border-emerald-500' :
                            editingTeam.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 focus:border-amber-500' :
                            editingTeam.status === 'banned' ? 'bg-red-500/10 text-red-400 border-red-500/30 focus:border-red-500' :
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 focus:border-yellow-500'
                          )}
                        >
                          <option value="active" className="bg-surface text-emerald-400 font-semibold">Activo</option>
                          <option value="pending" className="bg-surface text-amber-400 font-semibold">En Revisión</option>
                          <option value="inactive" className="bg-surface text-yellow-400 font-semibold">Inactivo</option>
                          <option value="banned" className="bg-surface text-red-400 font-semibold">Baneado</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>

                    {editingTeam.status === 'banned' && (
                      <div className="w-full mt-2 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400 flex items-center gap-2">
                        <Ban className="w-4 h-4 shrink-0 text-red-400" />
                        <span>Este equipo se encuentra en estado <strong>Baneado</strong>. No podrá participar en torneos ni competiciones oficiales.</span>
                      </div>
                    )}
                  </div>

                  {/* SECCIÓN 1: Identidad y Configuración General */}
                  <div className="rounded-xl border border-border bg-background/50 p-5 space-y-4">
                    <h4 className="text-xs font-700 uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/60 pb-3">
                      <ShieldCheck className="w-4 h-4" />
                      Identidad & Información General
                    </h4>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-600 text-muted-foreground uppercase block mb-1">
                          Nombre del Equipo <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={editingTeam.name}
                          onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase font-semibold"
                          placeholder="Ej: GMX ESPORTS"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-600 text-muted-foreground uppercase block mb-1">
                          Tag / Siglas Oficiales
                        </label>
                        <input
                          type="text"
                          value={editingTeam.tag}
                          onChange={(e) => setEditingTeam({ ...editingTeam, tag: e.target.value.toUpperCase() })}
                          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase font-semibold"
                          placeholder="Ej: GMX"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-600 text-muted-foreground uppercase block mb-1">
                          Hashtag Oficial
                        </label>
                        <input
                          type="text"
                          value={editingTeam.hashtag}
                          onChange={(e) => setEditingTeam({ ...editingTeam, hashtag: e.target.value })}
                          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Ej: #GOGOGMX"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-600 text-muted-foreground uppercase block mb-1">
                          País / Región Principal
                        </label>
                        <div className="relative">
                          <select
                            value={editingTeam.country}
                            onChange={(e) => setEditingTeam({ ...editingTeam, country: e.target.value })}
                            className="w-full appearance-none rounded-lg border border-border bg-surface px-3.5 py-2 pr-9 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          >
                            {countrySelectOptions.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-600 text-muted-foreground uppercase block mb-1">
                          Estado en la Plataforma
                        </label>
                        <div className="relative">
                          <select
                            value={editingTeam.status}
                            onChange={(e) => setEditingTeam({ ...editingTeam, status: e.target.value })}
                            className={cn(
                              "w-full appearance-none rounded-lg border bg-surface px-3.5 py-2 pr-9 text-sm focus:outline-none focus:ring-1 cursor-pointer font-semibold transition-colors",
                              editingTeam.status === 'active' ? 'text-emerald-400 border-emerald-500/30 focus:border-emerald-500' :
                              editingTeam.status === 'pending' ? 'text-amber-400 border-amber-500/30 focus:border-amber-500' :
                              editingTeam.status === 'banned' ? 'text-red-400 border-red-500/30 focus:border-red-500' :
                              'text-yellow-400 border-yellow-500/30 focus:border-yellow-500'
                            )}
                          >
                            <option value="active" className="bg-surface text-emerald-400 font-semibold">Activo (Visible en competiciones)</option>
                            <option value="pending" className="bg-surface text-amber-400 font-semibold">En Revisión / Pendiente</option>
                            <option value="inactive" className="bg-surface text-yellow-400 font-semibold">Inactivo</option>
                            <option value="banned" className="bg-surface text-red-400 font-semibold">Baneado</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        {editingTeam.status === 'banned' && (
                          <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1 font-500">
                            <Ban className="w-3.5 h-3.5 shrink-0" />
                            Equipo sancionado / baneado de la plataforma.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-600 text-muted-foreground uppercase block mb-1">
                          Manager / Representante Asignado
                        </label>
                        <div className="relative">
                          <select
                            value={editingTeam.manager_id}
                            onChange={(e) => setEditingTeam({ ...editingTeam, manager_id: e.target.value })}
                            className="w-full appearance-none rounded-lg border border-border bg-surface px-3.5 py-2 pr-9 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          >
                            <option value="">Sin Manager Asignado</option>
                            {availableManagers.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.nickname ? `${m.nickname} (${m.name})` : m.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 2: Multimedia Oficial (Logo y Jersey) */}
                  <div className="rounded-xl border border-border bg-background/50 p-5 space-y-4">
                    <h4 className="text-xs font-700 uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/60 pb-3">
                      <ImageIcon className="w-4 h-4" />
                      Identidad Visual & Multimedia (Logo y Camiseta)
                    </h4>

                    <div className="grid sm:grid-cols-2 gap-6">
                      
                      {/* Logo Oficial */}
                      <div className="space-y-3">
                        <label className="text-xs font-600 text-muted-foreground uppercase block">
                          Logo Oficial del Equipo
                        </label>
                        <div className="relative w-full h-44 rounded-xl border border-border bg-surface overflow-hidden flex items-center justify-center group">
                          {editingTeam.logo_url ? (
                            <img 
                              src={editingTeam.logo_url} 
                              alt="Logo Oficial" 
                              className="w-full h-full object-contain p-2" 
                            />
                          ) : (
                            <div className="text-center p-3 text-muted-foreground text-xs">
                              <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                              Sin logo asignado
                            </div>
                          )}
                          {editingTeam.logo_url && (
                            <button
                              type="button"
                              onClick={() => setLightboxImage({ src: editingTeam.logo_url, label: `Logo de ${editingTeam.name}` })}
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
                                handleUploadTeamMedia(e.target.files[0], 'logo_url')
                              }
                            }}
                            className="w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-muted-foreground font-500 block">O URL directa:</label>
                          <input
                            type="text"
                            value={editingTeam.logo_url}
                            onChange={(e) => setEditingTeam({ ...editingTeam, logo_url: e.target.value })}
                            className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-white focus:border-primary focus:outline-none"
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      {/* Camiseta / Jersey Oficial */}
                      <div className="space-y-3">
                        <label className="text-xs font-600 text-muted-foreground uppercase block">
                          Camiseta / Jersey Oficial
                        </label>
                        <div className="relative w-full h-44 rounded-xl border border-border bg-surface overflow-hidden flex items-center justify-center group">
                          {editingTeam.jersey_url ? (
                            <img 
                              src={editingTeam.jersey_url} 
                              alt="Camiseta Oficial" 
                              className="w-full h-full object-contain p-2" 
                            />
                          ) : (
                            <div className="text-center p-3 text-muted-foreground text-xs">
                              <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                              Sin camiseta registrada
                            </div>
                          )}
                          {editingTeam.jersey_url && (
                            <button
                              type="button"
                              onClick={() => setLightboxImage({ src: editingTeam.jersey_url, label: `Camiseta de ${editingTeam.name}` })}
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
                                handleUploadTeamMedia(e.target.files[0], 'jersey_url')
                              }
                            }}
                            className="w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-muted-foreground font-500 block">O URL directa:</label>
                          <input
                            type="text"
                            value={editingTeam.jersey_url}
                            onChange={(e) => setEditingTeam({ ...editingTeam, jersey_url: e.target.value })}
                            className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-white focus:border-primary focus:outline-none"
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* SECCIÓN 3: Redes Sociales del Equipo */}
                  <div className="rounded-xl border border-border bg-background/50 p-5 space-y-4">
                    <h4 className="text-xs font-700 uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/60 pb-3">
                      <Share2 className="w-4 h-4" />
                      Redes Sociales Oficiales
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {socialPlatforms.map((s) => (
                        <div key={s.key}>
                          <label className="text-xs font-600 text-muted-foreground uppercase block mb-1">
                            {s.label}
                          </label>
                          <input
                            type="text"
                            value={editingTeam[s.key] || ''}
                            onChange={(e) => setEditingTeam({ ...editingTeam, [s.key]: e.target.value })}
                            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder={s.placeholder}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Barra de Guardar */}
                  <div className="sticky bottom-0 bg-surface/95 backdrop-blur border border-border p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 z-20 shadow-xl">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-700 uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          Estado:
                        </span>
                        <div className="relative">
                          <select
                            value={editingTeam.status}
                            onChange={(e) => setEditingTeam({ ...editingTeam, status: e.target.value })}
                            className={cn(
                              "appearance-none rounded-lg border px-3 py-2 pr-8 text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-1 cursor-pointer transition-colors font-sans",
                              editingTeam.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 focus:border-emerald-500" :
                              editingTeam.status === 'pending' ? "bg-amber-500/10 text-amber-400 border-amber-500/30 focus:border-amber-500" :
                              editingTeam.status === 'banned' ? "bg-red-500/10 text-red-400 border-red-500/30 focus:border-red-500" :
                              "bg-yellow-500/10 text-yellow-400 border-yellow-500/30 focus:border-yellow-500"
                            )}
                          >
                            <option value="active" className="bg-surface text-emerald-400 font-semibold">Activo</option>
                            <option value="pending" className="bg-surface text-amber-400 font-semibold">En Revisión</option>
                            <option value="inactive" className="bg-surface text-yellow-400 font-semibold">Inactivo</option>
                            <option value="banned" className="bg-surface text-red-400 font-semibold">Baneado</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground hidden lg:inline">
                        Los cambios se aplicarán inmediatamente en la base de datos de GMX Gaming.
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isSavingTeam}
                      onClick={handleSaveTeam}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-black bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingTeam ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Guardar Cambios</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Roster Actual */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-display text-lg font-700 uppercase tracking-tight text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Roster Actual
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {selectedTeam.roster.length} {selectedTeam.roster.length === 1 ? 'jugador activo' : 'jugadores activos'}
                      </span>
                    </div>
                    
                    {selectedTeam.roster.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-border rounded-lg bg-background/50">
                        <p className="text-muted-foreground text-sm">Este equipo no tiene jugadores con contratos activos actualmente.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-background">
                            <tr>
                              <th className="px-4 py-3 font-600 text-muted-foreground text-xs uppercase tracking-wider">JUGADOR</th>
                              <th className="px-4 py-3 font-600 text-muted-foreground text-xs uppercase tracking-wider">ROLES</th>
                              <th className="px-4 py-3 font-600 text-muted-foreground text-xs uppercase tracking-wider">PAÍS</th>
                              <th className="px-4 py-3 font-600 text-muted-foreground text-xs uppercase tracking-wider">DISCORD</th>
                              <th className="px-4 py-3 font-600 text-muted-foreground text-xs uppercase tracking-wider text-right">ACCIÓN</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border bg-surface">
                            {selectedTeam.roster.map((p, idx) => (
                              <tr key={idx} className="transition-colors hover:bg-white/5">
                                <td className="px-4 py-3">
                                  <div className="font-bold text-white tracking-wide">{p.nickname}</div>
                                  {p.name && p.name !== p.nickname && (
                                    <div className="text-xs text-muted-foreground">{p.name}</div>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1">
                                    {Array.isArray(p.roles) && p.roles.length > 0 ? (
                                      p.roles.map((r: any, rIdx: number) => (
                                        <span key={rIdx} className="rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                                          {formatRoleTitle(r)}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  <span className="inline-flex items-center gap-1.5 text-xs">
                                    <span>🌐</span> {formatLocation(p.country)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-primary text-xs">{p.discord}</td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => {
                                      setTerminatingContract({
                                        contractId: p.contractId,
                                        playerId: p.playerId,
                                        playerName: p.nickname || p.name,
                                        teamId: selectedTeam.id,
                                        teamName: selectedTeam.name
                                      })
                                      setTerminationJustification('')
                                    }}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                    title="Dar de baja contrato administrativamente"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>Dar de Baja</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Historial de Contratos Pasados y Bajas */}
                  <div className="mt-8 border-t border-border pt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-display text-lg font-700 uppercase tracking-tight text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Historial de Bajas y Contratos Pasados
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {selectedTeam.pastContracts?.length || 0} en registro
                      </span>
                    </div>

                    {(!selectedTeam.pastContracts || selectedTeam.pastContracts.length === 0) ? (
                      <div className="text-center py-6 border border-dashed border-border rounded-lg bg-background/50">
                        <p className="text-muted-foreground text-xs">No hay registro de contratos anteriores o dados de baja en este equipo.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {selectedTeam.pastContracts.map((past, pIdx) => (
                          <div key={pIdx} className="rounded-lg border border-border/80 bg-background/60 p-3.5 flex flex-col gap-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-white">{past.nickname || past.name}</span>
                                <div className="flex gap-1">
                                  {Array.isArray(past.roles) && past.roles.map((r: any, rIdx: number) => (
                                    <span key={rIdx} className="rounded bg-white/5 border border-white/10 px-1.5 py-0.2 text-[10px] text-muted-foreground">
                                      {formatRoleTitle(r)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {past.conclusionDate ? `Baja / Conclusión: ${new Date(past.conclusionDate).toLocaleDateString()}` : 'Contrato Concluido'}
                              </div>
                            </div>

                            {past.justification ? (
                              <div className="mt-1 rounded bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-300/90">
                                <div className="flex items-center justify-between font-semibold text-[11px] uppercase tracking-wider text-amber-400 mb-1">
                                  <span>Justificación Administrativa</span>
                                  {past.adminName && <span>Por: {past.adminName}</span>}
                                </div>
                                <p className="italic">"{past.justification}"</p>
                              </div>
                            ) : (
                              <div className="text-[11px] text-muted-foreground italic">
                                Concluido por finalización de plazo o acuerdo mutuo.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage.src}
              alt={lightboxImage.label}
              className="max-h-[80vh] w-auto rounded-lg object-contain border border-border shadow-2xl"
            />
            <span className="mt-3 text-sm font-600 text-white uppercase tracking-wider">{lightboxImage.label}</span>
          </div>
        </div>
      )}

      {/* Modal de Baja de Contrato Administrativa con Justificación Obligatoria */}
      {terminatingContract && (
        <div className="fixed inset-0 z-[1020] flex items-center justify-center p-4">
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
                ℹ️ <strong className="text-amber-300">Aviso:</strong> Como administrador, esta baja se aplicará <strong>automáticamente e inmediatamente</strong> sin requerir confirmación del jugador o del manager. <strong>El registro del contrato se mantendrá intacto en el historial</strong> junto con el motivo ingresado.
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

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-6 bg-red-500/10 text-red-500">
              <AlertCircle className="h-8 w-8" />
            </div>

            <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-2">
              ¿Eliminar Equipo?
            </h3>
            
            <p className="text-muted-foreground mb-8">
              Estás a punto de eliminar al equipo:<br/>
              <span className="text-white mt-2 block font-500">{confirmAction.name}</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-md border border-border bg-transparent px-4 py-3 font-display text-[13px] font-600 uppercase tracking-widest text-muted-foreground transition-colors hover:text-white"
              >
                CANCELAR
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 rounded-md px-4 py-3 font-display text-[13px] font-600 uppercase tracking-widest text-white transition-colors relative overflow-hidden clip-corner group bg-red-600 hover:bg-red-500"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  ELIMINAR <Trash2 className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Status Modal */}
      {statusModalTeam && (
        <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setStatusModalTeam(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Modificar Estado del Equipo
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Modificando al equipo: <strong className="text-white font-semibold">{statusModalTeam.name}</strong>
            </p>

            <div className="space-y-4 mb-8">
              <label className="text-xs font-700 uppercase tracking-wider text-primary block">Nuevo Estado</label>
              <div className="relative">
                <select
                  value={quickNewStatus}
                  onChange={(e) => setQuickNewStatus(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-3 pr-10 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/50 transition-colors cursor-pointer font-500"
                >
                  <option value="active">Activo (Visible en competiciones)</option>
                  <option value="pending">En Revisión / Pendiente</option>
                  <option value="inactive">Inactivo</option>
                  <option value="banned">Baneado</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>

              {quickNewStatus === 'banned' && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400 flex items-start gap-2">
                  <Ban className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span>El equipo quedará baneado y no podrá participar ni inscribirse en torneos oficiales de GMX Gaming.</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setStatusModalTeam(null)}
                className="flex-1 rounded-lg border border-border bg-transparent px-4 py-3 font-display text-xs font-600 uppercase tracking-widest text-muted-foreground transition-colors hover:text-white hover:border-primary/50"
              >
                CANCELAR
              </button>
              <GmxButton 
                onClick={handleQuickStatusUpdate} 
                disabled={isUpdatingQuickStatus}
                className="flex-1 px-4 py-3"
              >
                {isUpdatingQuickStatus ? 'GUARDANDO...' : 'CONFIRMAR CAMBIO'}
              </GmxButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
