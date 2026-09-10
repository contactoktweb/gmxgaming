'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Upload, Image as ImageIcon, Loader2, AlertCircle, HelpCircle, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { GmxButton } from '@/components/gmx-button'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { cn, formatNickname, formatPersonName } from '@/lib/utils'

function FieldTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-block ml-1.5 align-middle">
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors cursor-help inline" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 -translate-y-2 w-48 rounded bg-surface border border-border px-2.5 py-1.5 text-[11px] text-white opacity-0 transition-all group-hover:opacity-100 z-50 text-center shadow-xl normal-case font-normal">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-surface"></span>
      </span>
    </span>
  )
}

const DEFAULT_COUNTRIES = [
  "Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Cuba", 
  "Ecuador", "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua", 
  "Panamá", "Paraguay", "Perú", "Puerto Rico", "República Dominicana", 
  "Uruguay", "Venezuela"
]

const COUNTRY_CODES = [
  { code: '+52', label: '🇲🇽 +52' },
  { code: '+57', label: '🇨🇴 +57' },
  { code: '+54', label: '🇦🇷 +54' },
  { code: '+51', label: '🇵🇪 +51' },
  { code: '+58', label: '🇻🇪 +58' },
  { code: '+56', label: '🇨🇱 +56' },
  { code: '+593', label: '🇪🇨 +593' },
  { code: '+502', label: '🇬🇹 +502' },
  { code: '+53', label: '🇨🇺 +53' },
  { code: '+591', label: '🇧🇴 +591' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+504', label: '🇭🇳 +504' },
  { code: '+503', label: '🇸🇻 +503' },
  { code: '+595', label: '🇵🇾 +595' },
  { code: '+505', label: '🇳🇮 +505' },
  { code: '+506', label: '🇨🇷 +506' },
  { code: '+507', label: '🇵🇦 +507' },
  { code: '+598', label: '🇺🇾 +598' },
  { code: '+34', label: '🇪🇸 +34' },
]

export interface EditTeamModalProps {
  team: any
  isOpen: boolean
  onClose: () => void
  onSuccess?: (updatedDetails?: any) => void
  validation?: any
}

export function EditTeamModal({ team, isOpen, onClose, onSuccess, validation }: EditTeamModalProps) {
  const { user } = useAuth()
  const supabase = createClient()

  // App settings config
  const [countries, setCountries] = useState<string[]>(DEFAULT_COUNTRIES)
  const [games, setGames] = useState<{ name: string, image: string }[]>([
    { name: 'Mobile Legends', image: '/images/mlbb-logo.png' }
  ])
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Manager profile
  const [managerProfile, setManagerProfile] = useState<any>(null)

  // Form states - Team Info
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const [hashtag, setHashtag] = useState('')
  const [country, setCountry] = useState('')
  const [selectedGames, setSelectedGames] = useState<string[]>(['Mobile Legends'])
  
  // Files and URLs
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [jerseyUrl, setJerseyUrl] = useState('')
  const [jerseyFile, setJerseyFile] = useState<File | null>(null)

  // Socials
  const [socialIg, setSocialIg] = useState('')
  const [socialTiktok, setSocialTiktok] = useState('')
  const [socialYt, setSocialYt] = useState('')
  const [socialFb, setSocialFb] = useState('')
  const [socialTwitch, setSocialTwitch] = useState('')
  const [socialKick, setSocialKick] = useState('')
  const [socialX, setSocialX] = useState('')

  // Manager info
  const [managerFirstName, setManagerFirstName] = useState('')
  const [managerLastName, setManagerLastName] = useState('')
  const [managerNickname, setManagerNickname] = useState('')
  const [managerDiscord, setManagerDiscord] = useState('')
  const [managerPhoneCode, setManagerPhoneCode] = useState('+52')
  const [managerPhoneNumber, setManagerPhoneNumber] = useState('')

  // Load config and manager profile
  useEffect(() => {
    if (!isOpen || !team) return

    async function initData() {
      setLoadingConfig(true)
      try {
        // 1. Settings
        const { data: settings } = await supabase.from('app_settings').select('*')
        if (settings && settings.length > 0) {
          const countryConfig = settings.find(c => c.id === 'enabled_countries')
          const gameConfig = settings.find(c => c.id === 'enabled_games')
          
          if (countryConfig && Array.isArray(countryConfig.value) && countryConfig.value.length > 0) {
            setCountries(countryConfig.value as string[])
          }
          if (gameConfig && Array.isArray(gameConfig.value) && gameConfig.value.length > 0) {
            const loadedGames = gameConfig.value.map((g: any) => {
              if (typeof g === 'string') {
                return { name: g, image: g === 'Mobile Legends' ? '/images/mlbb-logo.png' : '' }
              }
              if (g.name === 'Mobile Legends' && !g.image) {
                return { ...g, image: '/images/mlbb-logo.png' }
              }
              return g
            })
            setGames(loadedGames)
          }
        }

        // 2. Manager profile
        const managerId = team.manager_id || user?.id
        let prof: any = null
        if (managerId) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', managerId)
            .single()
          if (profileData) {
            prof = profileData
            setManagerProfile(profileData)
          }
        }

        // 3. Prepopulate: If there is a pending or rejected validation, prioritize its details
        const isPending = validation?.status === 'pending'
        const isRejected = validation?.status === 'rejected'
        const d = (isPending || isRejected) && validation?.details ? validation.details : null

        setName(d?.name || team.name || '')
        setTag(d?.tag || team.tag || '')
        setHashtag(d?.hashtag || team.hashtag || '')
        setCountry(d?.country || team.country || '')
        
        const initialGames = d?.games || team.games
        if (Array.isArray(initialGames) && initialGames.length > 0) {
          setSelectedGames(initialGames)
        } else {
          setSelectedGames(['Mobile Legends'])
        }

        setLogoUrl(d?.logo_url || team.logo_url || '')
        setLogoFile(null)
        setJerseyUrl(d?.jersey_url || team.jersey_url || '')
        setJerseyFile(null)

        setSocialIg(d?.social_ig || team.social_ig || '')
        setSocialTiktok(d?.social_tiktok || team.social_tiktok || '')
        setSocialYt(d?.social_yt || team.social_yt || '')
        setSocialFb(d?.social_fb || team.social_fb || '')
        setSocialTwitch(d?.social_twitch || team.social_twitch || '')
        setSocialKick(d?.social_kick || team.social_kick || '')
        setSocialX(d?.social_x || team.social_x || '')

        // Manager names
        const managerFullName = d?.manager_name || prof?.name || user?.name || ''
        const parts = managerFullName.split(' ')
        setManagerFirstName(d?.manager_first_name || parts[0] || '')
        setManagerLastName(d?.manager_last_name || parts.slice(1).join(' ') || '')
        setManagerNickname(d?.manager_nickname || prof?.nickname || user?.nickname || '')
        setManagerDiscord(d?.manager_discord || prof?.discord_handle || '')

        // Phone
        const fullPhone = d?.manager_phone || ''
        if (fullPhone) {
          const phoneParts = fullPhone.split(' ')
          if (phoneParts.length > 1) {
            setManagerPhoneCode(phoneParts[0])
            setManagerPhoneNumber(phoneParts.slice(1).join(''))
          } else {
            setManagerPhoneNumber(fullPhone)
          }
        }
      } catch (err) {
        console.error('Error loading team edit data:', err)
      } finally {
        setLoadingConfig(false)
      }
    }

    initData()
  }, [isOpen, team, validation])

  if (!isOpen || !team) return null

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El logo supera el límite de 5MB.')
      return
    }
    setLogoFile(file)
    setLogoUrl(URL.createObjectURL(file))
  }

  const handleJerseyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El jersey supera el límite de 5MB.')
      return
    }
    setJerseyFile(file)
    setJerseyUrl(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('El nombre del equipo es obligatorio.')
      return
    }
    if (!tag.trim()) {
      toast.error('El tag del equipo es obligatorio.')
      return
    }
    if (!country) {
      toast.error('Debes seleccionar el país del equipo.')
      return
    }

    setIsSubmitting(true)
    try {
      let finalLogoUrl = logoUrl
      let finalJerseyUrl = jerseyUrl

      // Subir nuevo logo si se seleccionó archivo
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${Date.now()}_logo_${name.trim().replace(/\s+/g, '_')}.${fileExt}`
        const { data, error: uploadErr } = await supabase.storage.from('teams').upload(fileName, logoFile)
        if (!uploadErr && data) {
          const { data: pUrl } = supabase.storage.from('teams').getPublicUrl(data.path)
          finalLogoUrl = pUrl.publicUrl
        }
      }

      // Subir nuevo jersey si se seleccionó archivo
      if (jerseyFile) {
        const fileExt = jerseyFile.name.split('.').pop()
        const fileName = `${Date.now()}_jersey_${name.trim().replace(/\s+/g, '_')}.${fileExt}`
        const { data, error: uploadErr } = await supabase.storage.from('teams').upload(fileName, jerseyFile)
        if (!uploadErr && data) {
          const { data: pUrl } = supabase.storage.from('teams').getPublicUrl(data.path)
          finalJerseyUrl = pUrl.publicUrl
        }
      }

      const fullManagerName = `${managerFirstName.trim()} ${managerLastName.trim()}`.trim().toUpperCase()
      const formattedPhone = managerPhoneNumber.trim() ? `${managerPhoneCode} ${managerPhoneNumber.trim()}` : ''

      const payloadDetails = {
        team_id: team.id,
        manager_id: user?.id || team.manager_id,
        
        // Datos nuevos del equipo
        name: name.trim().toUpperCase(),
        tag: tag.trim().toUpperCase(),
        hashtag: hashtag.trim(),
        country,
        logo_url: finalLogoUrl,
        jersey_url: finalJerseyUrl,
        games: selectedGames,
        social_ig: socialIg.trim(),
        social_tiktok: socialTiktok.trim(),
        social_yt: socialYt.trim(),
        social_fb: socialFb.trim(),
        social_twitch: socialTwitch.trim(),
        social_kick: socialKick.trim(),
        social_x: socialX.trim(),

        // Datos del manager
        manager_first_name: managerFirstName.trim().toUpperCase(),
        manager_last_name: managerLastName.trim().toUpperCase(),
        manager_name: fullManagerName,
        manager_nickname: managerNickname.trim().toUpperCase(),
        manager_discord: managerDiscord.trim(),
        manager_phone: formattedPhone,

        // Valores originales para comparación de auditoría administrativa (diff)
        original_name: team.name || '',
        original_tag: team.tag || '',
        original_hashtag: team.hashtag || '',
        original_country: team.country || '',
        original_logo: team.logo_url || '',
        original_jersey: team.jersey_url || '',
        original_games: team.games || [],
        original_social_ig: team.social_ig || '',
        original_social_tiktok: team.social_tiktok || '',
        original_social_yt: team.social_yt || '',
        original_social_fb: team.social_fb || '',
        original_social_twitch: team.social_twitch || '',
        original_social_kick: team.social_kick || '',
        original_social_x: team.social_x || '',
        original_manager_name: managerProfile?.name || user?.name || '',
        original_manager_nickname: managerProfile?.nickname || user?.nickname || '',
        original_manager_discord: managerProfile?.discord_handle || '',
        original_manager_phone: ''
      }

      const senderNick = user?.nickname || user?.name || user?.email || 'Líder de Equipo'

      // Si ya hay una solicitud pendiente con id, actualizamos
      if (validation?.id && validation.status === 'pending') {
        const { error } = await supabase.from('validations').update({
          target_name: `${name.trim().toUpperCase()} (Modificación de Equipo)`,
          submitted_by: senderNick,
          status: 'pending',
          details: payloadDetails
        }).eq('id', validation.id)

        if (error) throw error

        toast.success('Solicitud de modificación actualizada', {
          description: 'Tus cambios han sido actualizados en la solicitud en revisión.'
        })
      } else {
        // Eliminar solicitudes de modificación previas ya resueltas para este equipo
        await supabase
          .from('validations')
          .delete()
          .eq('type', 'modificacion')
          .in('status', ['approved', 'rejected'])
          .filter('details->>team_id', 'eq', team.id)

        // Crear nueva validación
        const { data: newVal, error } = await supabase.from('validations').insert({
          type: 'modificacion',
          target_name: `${name.trim().toUpperCase()} (Modificación de Equipo)`,
          submitted_by: senderNick,
          status: 'pending',
          details: payloadDetails
        }).select().single()

        if (error) throw error

        toast.success('Solicitud enviada al Administrador', {
          description: 'La modificación de tu equipo fue enviada para aprobación administrativa.'
        })
      }

      if (onSuccess) {
        onSuccess(payloadDetails)
      }
      onClose()
    } catch (err: any) {
      console.error('Error submitting team modification:', err)
      toast.error('Error al guardar la solicitud de modificación.', {
        description: err.message || 'Inténtalo de nuevo más tarde.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="border-b border-border px-6 py-5 flex items-center justify-between shrink-0 bg-deep/80 backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <h2 className="font-display text-xl sm:text-2xl font-700 uppercase tracking-tight text-white">
                Editar Información del Equipo
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Todos los cambios pasan por revisión y aprobación del administrador antes de publicarse.
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="rounded-lg p-2 text-muted-foreground hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {loadingConfig ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Cargando datos del equipo...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
            
            {/* Status alerts */}
            {validation?.status === 'pending' && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-700 uppercase tracking-wider text-amber-400 block">
                    Solicitud de Modificación en Revisión
                  </span>
                  <p className="text-amber-200/90 leading-relaxed">
                    Tienes una solicitud pendiente de revisión por el equipo administrativo. Al guardar cambios aquí, se actualizará tu solicitud en curso.
                  </p>
                </div>
              </div>
            )}

            {validation?.status === 'rejected' && validation?.details?.rejection_reason && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-700 uppercase tracking-wider text-red-400 block">
                    Motivo de Rechazo de Solicitud Anterior
                  </span>
                  <p className="text-white/90 leading-relaxed italic">
                    "{validation.details.rejection_reason}"
                  </p>
                  <p className="text-xs text-red-300/80 pt-1">
                    Corrige los datos necesarios y vuelve a enviar la solicitud para su aprobación.
                  </p>
                </div>
              </div>
            )}

            {/* SECCIÓN 1: DATOS DEL EQUIPO */}
            <div className="space-y-5">
              <div className="border-b border-border/80 pb-2.5 flex items-center justify-between">
                <h3 className="font-display text-base sm:text-lg font-700 uppercase tracking-widest text-primary flex items-center gap-2">
                  <span>1. Datos del Equipo</span>
                </h3>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Formulario Oficial</span>
              </div>

              {/* Logos y Jersey */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                {/* Logo */}
                <div className="rounded-xl border border-border bg-deep/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-600 text-white uppercase tracking-wider flex items-center gap-1">
                      Logo del Equipo <span className="text-primary">*</span>
                      <FieldTooltip text="Logo oficial del equipo. PNG o JPG transparente recomendado. Máx 5MB." />
                    </label>
                    {logoFile && (
                      <span className="text-[10px] text-emerald-400 font-600">Nuevo logo seleccionado</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <img 
                      src={logoUrl || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                      alt="Logo del Equipo"
                      className="w-16 h-16 rounded-xl object-cover border border-border bg-background shadow-md shrink-0" 
                    />
                    <label className="flex-1 cursor-pointer">
                      <div className="rounded-lg border border-dashed border-border hover:border-primary/50 bg-surface/50 hover:bg-surface p-3 text-center transition-all">
                        <Upload className="w-4 h-4 text-primary mx-auto mb-1" />
                        <span className="text-[11px] font-600 text-white block">Cambiar Logo</span>
                        <span className="text-[10px] text-muted-foreground block">Haz clic para seleccionar</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg,.png,.jpg,.jpeg" 
                        onChange={handleLogoChange}
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                {/* Jersey */}
                <div className="rounded-xl border border-border bg-deep/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-600 text-white uppercase tracking-wider flex items-center gap-1">
                      Jersey del Equipo (Opcional)
                      <FieldTooltip text="Uniforme o camiseta oficial del equipo. Formato PNG o JPG." />
                    </label>
                    {jerseyFile && (
                      <span className="text-[10px] text-emerald-400 font-600">Nuevo jersey seleccionado</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl border border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
                      {jerseyUrl ? (
                        <img src={jerseyUrl} alt="Jersey del Equipo" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-faint" />
                      )}
                    </div>
                    <label className="flex-1 cursor-pointer">
                      <div className="rounded-lg border border-dashed border-border hover:border-primary/50 bg-surface/50 hover:bg-surface p-3 text-center transition-all">
                        <Upload className="w-4 h-4 text-primary mx-auto mb-1" />
                        <span className="text-[11px] font-600 text-white block">
                          {jerseyUrl ? 'Cambiar Jersey' : 'Subir Jersey'}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">Haz clic para seleccionar</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg,.png,.jpg,.jpeg" 
                        onChange={handleJerseyChange}
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Campos Principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Nombre */}
                <div className="space-y-1.5">
                  <label className="text-xs font-600 text-white uppercase tracking-wider flex items-center gap-1">
                    Nombre del Equipo <span className="text-primary">*</span>
                    <FieldTooltip text="Solo mayúsculas y números, sin caracteres especiales." />
                  </label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, ''))}
                    placeholder="EJ. GOD SQUAD"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none uppercase font-500"
                  />
                </div>

                {/* Tag */}
                <div className="space-y-1.5">
                  <label className="text-xs font-600 text-white uppercase tracking-wider flex items-center gap-1">
                    Tag del Equipo <span className="text-primary">*</span>
                    <FieldTooltip text="Siglas en mayúsculas que abrevian el nombre. Ej: THK o GMX." />
                  </label>
                  <input 
                    type="text"
                    required
                    value={tag}
                    onChange={e => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    placeholder="EJ. THK"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none uppercase font-700 tracking-wider"
                  />
                </div>

                {/* Hashtag */}
                <div className="space-y-1.5">
                  <label className="text-xs font-600 text-white uppercase tracking-wider flex items-center gap-1">
                    Hashtag del Equipo <span className="text-primary">*</span>
                    <FieldTooltip text="Frase o hashtag de apoyo. Ej: #GODSQUADWIN" />
                  </label>
                  <input 
                    type="text"
                    required
                    value={hashtag}
                    onChange={e => setHashtag(e.target.value)}
                    placeholder="Ej. #GODSQUADWIN"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                  />
                </div>

                {/* País */}
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                  <label className="text-xs font-600 text-white uppercase tracking-wider flex items-center gap-1">
                    País del Equipo <span className="text-primary">*</span>
                    <FieldTooltip text="País principal al que representa la escuadra." />
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                    >
                      <option value="" disabled>Selecciona un país</option>
                      {countries.map(c => (
                        <option key={c} value={c} className="bg-surface text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Juegos en los que participa */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-600 text-white uppercase tracking-wider flex items-center gap-1">
                  Juegos en los que participa <span className="text-primary">*</span>
                  <FieldTooltip text="Selecciona los títulos competitivos en los que participa el equipo." />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {games.map(game => {
                    const isChecked = selectedGames.includes(game.name)
                    return (
                      <label 
                        key={game.name}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                          isChecked 
                            ? "border-primary bg-primary/10" 
                            : "border-border bg-deep/40 hover:border-white/20"
                        )}
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedGames([...selectedGames, game.name])
                            } else {
                              if (selectedGames.length > 1) {
                                setSelectedGames(selectedGames.filter(g => g !== game.name))
                              }
                            }
                          }}
                          className="h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary"
                        />
                        <div className="h-9 w-9 rounded-lg bg-surface border border-border flex items-center justify-center p-1 overflow-hidden shrink-0">
                          {game.image ? (
                            <img src={game.image} alt={game.name} className="h-full w-full object-contain" />
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground">{game.name.substring(0, 3)}</span>
                          )}
                        </div>
                        <span className="font-display text-sm font-600 tracking-wider text-white">
                          {game.name}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: REDES SOCIALES DEL EQUIPO */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-border/80 pb-2.5">
                <h3 className="font-display text-base sm:text-lg font-700 uppercase tracking-widest text-primary">
                  2. Redes Sociales del Equipo
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enlaces oficiales a las redes de la organización.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-500 text-muted-foreground">Instagram</label>
                  <input 
                    type="url"
                    value={socialIg}
                    onChange={e => setSocialIg(e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-500 text-muted-foreground">TikTok</label>
                  <input 
                    type="url"
                    value={socialTiktok}
                    onChange={e => setSocialTiktok(e.target.value)}
                    placeholder="https://tiktok.com/@..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-500 text-muted-foreground">YouTube</label>
                  <input 
                    type="url"
                    value={socialYt}
                    onChange={e => setSocialYt(e.target.value)}
                    placeholder="https://youtube.com/@..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-500 text-muted-foreground">Facebook</label>
                  <input 
                    type="url"
                    value={socialFb}
                    onChange={e => setSocialFb(e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-500 text-muted-foreground">Twitch</label>
                  <input 
                    type="url"
                    value={socialTwitch}
                    onChange={e => setSocialTwitch(e.target.value)}
                    placeholder="https://twitch.tv/..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-500 text-muted-foreground">Kick</label>
                  <input 
                    type="url"
                    value={socialKick}
                    onChange={e => setSocialKick(e.target.value)}
                    placeholder="https://kick.com/..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                  <label className="text-[11px] font-500 text-muted-foreground">X (Twitter)</label>
                  <input 
                    type="url"
                    value={socialX}
                    onChange={e => setSocialX(e.target.value)}
                    placeholder="https://x.com/..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: DATOS DEL GERENTE / MANAGER / LÍDER */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-border/80 pb-2.5">
                <h3 className="font-display text-base sm:text-lg font-700 uppercase tracking-widest text-primary">
                  3. Datos del Gerente General, Manager o Líder
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Información de contacto del representante oficial ante la administración.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="space-y-1.5">
                  <label className="text-xs font-600 text-white uppercase tracking-wider flex items-center gap-1">
                    Nombre(s) <span className="text-primary">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={managerFirstName}
                    onChange={e => setManagerFirstName(formatPersonName(e.target.value))}
                    placeholder="EJ. JUAN CARLOS"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none uppercase"
                  />
                  <span className="text-[10px] text-muted-foreground">Solo letras en mayúsculas.</span>
                </div>

                {/* Apellidos */}
                <div className="space-y-1.5">
                  <label className="text-xs font-600 text-white uppercase tracking-wider flex items-center gap-1">
                    Apellidos <span className="text-primary">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={managerLastName}
                    onChange={e => setManagerLastName(formatPersonName(e.target.value))}
                    placeholder="EJ. PEREZ GOMEZ"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none uppercase"
                  />
                  <span className="text-[10px] text-muted-foreground">Solo letras en mayúsculas.</span>
                </div>

                {/* Nickname */}
                <div className="space-y-1.5">
                  <label className="text-xs font-600 text-white uppercase tracking-wider flex items-center gap-1">
                    Nickname del Manager <span className="text-primary">*</span>
                    <FieldTooltip text="Seudónimo o IGN competitivo del Manager." />
                  </label>
                  <input 
                    type="text"
                    required
                    value={managerNickname}
                    onChange={e => setManagerNickname(formatNickname(e.target.value))}
                    placeholder="EJ. MORDON99"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none uppercase"
                  />
                </div>

                {/* Discord */}
                <div className="space-y-1.5">
                  <label className="text-xs font-600 text-white uppercase tracking-wider flex items-center gap-1">
                    Handle de Discord <span className="text-primary">*</span>
                    <FieldTooltip text="Usuario de Discord sin el # (ej: mordongmx)." />
                  </label>
                  <input 
                    type="text"
                    required
                    value={managerDiscord}
                    onChange={e => setManagerDiscord(e.target.value)}
                    placeholder="Ej. mordongmx"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-600 text-white uppercase tracking-wider flex items-center gap-1">
                    WhatsApp del Manager
                  </label>
                  <div className="flex gap-2">
                    <div className="relative shrink-0 w-28">
                      <select
                        value={managerPhoneCode}
                        onChange={e => setManagerPhoneCode(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                      >
                        {COUNTRY_CODES.map(c => (
                          <option key={c.label} value={c.code}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <input 
                      type="tel"
                      value={managerPhoneNumber}
                      onChange={e => setManagerPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234567890"
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="border-t border-border pt-5 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg border border-border text-sm font-600 text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <GmxButton
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando Solicitud...</span>
                  </span>
                ) : validation?.status === 'pending' ? (
                  'Actualizar Solicitud'
                ) : validation?.status === 'rejected' ? (
                  'Reenviar Solicitud'
                ) : (
                  'Solicitar Modificación'
                )}
              </GmxButton>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
