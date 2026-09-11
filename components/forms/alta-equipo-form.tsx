'use client'

import { useState, useEffect } from 'react'
import { Upload, Image as ImageIcon, Loader2, CheckCircle2, HelpCircle, ShieldAlert } from 'lucide-react'
import { GmxButton } from '@/components/gmx-button'
import { PhoneInput } from '@/components/forms/phone-input'
import { FileUpload } from '@/components/forms/file-upload'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { cn, formatNickname, formatPersonName } from '@/lib/utils'

function FieldTooltip({ text }: { text: string }) {
  return (
    <div className="group relative inline-block ml-2 align-middle">
      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 -translate-y-2 w-48 rounded bg-surface border border-border px-3 py-2 text-xs text-white opacity-0 transition-all group-hover:opacity-100 z-50 text-center shadow-xl">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-surface"></div>
      </div>
    </div>
  )
}

const DEFAULT_COUNTRIES = [
  "Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Cuba", 
  "Ecuador", "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua", 
  "Panamá", "Paraguay", "Perú", "Puerto Rico", "República Dominicana", 
  "Uruguay", "Venezuela"
]

export function AltaEquipoForm() {
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const { user } = useAuth()
  const supabase = createClient()
  const [countries, setCountries] = useState<string[]>(DEFAULT_COUNTRIES)
  const [games, setGames] = useState<{name: string, image: string}[]>([
    { name: 'Mobile Legends', image: '/images/mlbb-logo.png' }
  ])
  const [selectedGames, setSelectedGames] = useState<string[]>(['Mobile Legends'])
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [blockMessage, setBlockMessage] = useState<string | null>(null)
  const [existingTeamInfo, setExistingTeamInfo] = useState<{ type: 'pending' | 'active', teamName: string } | null>(null)

  // Validation state
  const [teamName, setTeamName] = useState('')
  const [teamTag, setTeamTag] = useState('')
  const [teamNameError, setTeamNameError] = useState('')
  const [teamTagError, setTeamTagError] = useState('')
  const [debouncedTeamName, setDebouncedTeamName] = useState('')
  const [debouncedTeamTag, setDebouncedTeamTag] = useState('')
  
  // Manager info state (Mayúsculas y sin caracteres especiales)
  const [managerFirstName, setManagerFirstName] = useState('')
  const [managerLastName, setManagerLastName] = useState('')
  const [managerNickname, setManagerNickname] = useState('')
  
  // Files
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [jerseyFile, setJerseyFile] = useState<File | null>(null)

  // Debounce para validaciones en tiempo real
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTeamName(teamName)
    }, 350)
    return () => clearTimeout(timer)
  }, [teamName])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTeamTag(teamTag)
    }, 350)
    return () => clearTimeout(timer)
  }, [teamTag])

  // Validar nombre de equipo en tiempo real
  useEffect(() => {
    async function validateTeamName() {
      const clean = debouncedTeamName.trim().toUpperCase()
      if (!clean) {
        setTeamNameError('')
        return
      }

      try {
        // 1. Verificar en tabla teams
        const { data: existingTeams } = await supabase
          .from('teams')
          .select('id, name')
          .ilike('name', clean)

        const exactMatch = existingTeams?.some(
          t => t.name?.trim().toUpperCase() === clean
        )

        if (exactMatch) {
          setTeamNameError('Ya existe un equipo registrado con este nombre.')
          return
        }

        // 2. Verificar en tabla validations solicitudes pendientes
        const { data: pendingVals } = await supabase
          .from('validations')
          .select('id, details')
          .eq('type', 'equipo')
          .eq('status', 'pending')

        const pendingMatch = pendingVals?.some(
          v => v.details?.name?.trim().toUpperCase() === clean
        )

        if (pendingMatch) {
          setTeamNameError('Ya existe una solicitud pendiente con este nombre de equipo.')
          return
        }

        setTeamNameError('')
      } catch (err) {
        console.error('Error al validar nombre de equipo:', err)
      }
    }

    validateTeamName()
  }, [debouncedTeamName, supabase])

  // Validar tag de equipo en tiempo real
  useEffect(() => {
    async function validateTeamTag() {
      const clean = debouncedTeamTag.trim().toUpperCase()
      if (!clean) {
        setTeamTagError('')
        return
      }

      try {
        const { data: existingTags } = await supabase
          .from('teams')
          .select('id, tag')
          .ilike('tag', clean)

        const exactMatch = existingTags?.some(
          t => t.tag?.trim().toUpperCase() === clean
        )

        if (exactMatch) {
          setTeamTagError('Este tag ya se encuentra en uso por otro equipo.')
          return
        }

        const { data: pendingVals } = await supabase
          .from('validations')
          .select('id, details')
          .eq('type', 'equipo')
          .eq('status', 'pending')

        const pendingMatch = pendingVals?.some(
          v => v.details?.tag?.trim().toUpperCase() === clean
        )

        if (pendingMatch) {
          setTeamTagError('Este tag ya está en uso en una solicitud pendiente.')
          return
        }

        setTeamTagError('')
      } catch (err) {
        console.error('Error al validar tag de equipo:', err)
      }
    }

    validateTeamTag()
  }, [debouncedTeamTag, supabase])

  useEffect(() => {
    async function loadConfig() {
      if (!user) {
        setBlockMessage('Debes iniciar sesión para poder registrar un equipo.')
        setLoadingConfig(false)
        return
      }

      setBlockMessage(null)

      try {
        // Verificar si el usuario ya tiene un equipo registrado o pendiente
        const { data: userTeams } = await supabase
          .from('teams')
          .select('id, name, status')
          .eq('manager_id', user.id)

        if (userTeams && userTeams.length > 0) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

          const isAdmin = profile?.role === 'admin'

          if (!isAdmin) {
            const pendingTeam = userTeams.find(t => t.status === 'pending')
            if (pendingTeam) {
              setExistingTeamInfo({
                type: 'pending',
                teamName: pendingTeam.name
              })
              setLoadingConfig(false)
              return
            }

            const activeTeam = userTeams.find(t => t.status === 'active' || t.status === 'approved')
            if (activeTeam) {
              setExistingTeamInfo({
                type: 'active',
                teamName: activeTeam.name
              })
              setLoadingConfig(false)
              return
            }
          }
        }
      } catch (userTeamErr) {
        console.warn('Error verificando equipos del usuario:', userTeamErr)
      }

      const { data } = await supabase.from('app_settings').select('*')
      if (data && data.length > 0) {
        const countryConfig = data.find(c => c.id === 'enabled_countries')
        const gameConfig = data.find(c => c.id === 'enabled_games')
        
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
          });
          setGames(loadedGames)
          if (loadedGames.length > 0) {
            setSelectedGames([loadedGames[0].name])
          }
        }
      }
      setLoadingConfig(false)
    }
    loadConfig()
  }, [user, supabase])

  const handleTeamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo mayúsculas, sin caracteres especiales
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, '')
    setTeamName(val)
  }

  const handleTeamNamePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text')
    const val = text.toUpperCase().replace(/[^A-Z0-9\s]/g, '')
    setTeamName(val)
  }

  const handleTeamTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    setTeamTag(val)
  }

  // Auto-scroll al inicio cuando el registro se completa con éxito
  useEffect(() => {
    if (formStatus === 'success') {
      if (typeof window !== 'undefined') {
        if (window.__lenis) {
          window.__lenis.scrollTo(0, { immediate: false })
        }
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }, [formStatus])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (formStatus === 'loading') return

    const cleanTeamName = teamName.trim().toUpperCase()
    const cleanTag = teamTag.trim().toUpperCase()

    if (!cleanTeamName) {
      alert('Por favor ingresa el nombre del equipo.')
      return
    }

    if (!cleanTag) {
      alert('Por favor ingresa el tag del equipo.')
      return
    }

    if (teamNameError || teamTagError) {
      alert('Por favor corrige los errores antes de enviar el formulario.')
      return
    }

    setFormStatus('loading')

    // Verificación síncrona de duplicados antes de procesar archivos o insertar
    try {
      // 1. Verificar nombre de equipo
      const { data: dupTeams } = await supabase
        .from('teams')
        .select('id, name')
        .ilike('name', cleanTeamName)

      const nameMatch = dupTeams?.some(t => t.name?.trim().toUpperCase() === cleanTeamName)
      if (nameMatch) {
        setTeamNameError('Ya existe un equipo registrado con este nombre.')
        alert(`El equipo "${cleanTeamName}" ya se encuentra registrado. No se puede registrar el mismo equipo dos veces.`)
        setFormStatus('idle')
        return
      }

      // 2. Verificar tag de equipo
      const { data: dupTags } = await supabase
        .from('teams')
        .select('id, tag')
        .ilike('tag', cleanTag)

      const tagMatch = dupTags?.some(t => t.tag?.trim().toUpperCase() === cleanTag)
      if (tagMatch) {
        setTeamTagError('Este tag ya se encuentra en uso por otro equipo.')
        alert(`El tag "${cleanTag}" ya se encuentra registrado por otro equipo.`)
        setFormStatus('idle')
        return
      }

      // 3. Verificar si el usuario ya tiene un equipo (si no es admin)
      if (user?.id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (prof?.role !== 'admin') {
          const { data: userTeams } = await supabase
            .from('teams')
            .select('id, name, status')
            .eq('manager_id', user.id)
            .in('status', ['pending', 'active', 'approved'])

          if (userTeams && userTeams.length > 0) {
            alert(`Ya cuentas con un equipo registrado o en proceso de revisión (${userTeams[0].name}). No se permite registrar otro equipo.`)
            setFormStatus('idle')
            return
          }
        }
      }
    } catch (verifErr) {
      console.error('Error verificando duplicados del equipo:', verifErr)
    }

    const form = e.currentTarget
    const formData = new FormData(form)

    let urlLogo = 'https://placehold.co/400x400/png?text=LOGO+EQUIPO'
    let urlJersey = 'https://placehold.co/400x400/png?text=JERSEY'

    try {
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${Date.now()}_logo_${cleanTeamName.replace(/\s+/g, '_')}.${fileExt}`
        const { error: uploadError, data } = await supabase.storage.from('teams').upload(fileName, logoFile)
        if (!uploadError && data) {
          const { data: publicUrlData } = supabase.storage.from('teams').getPublicUrl(data.path)
          urlLogo = publicUrlData.publicUrl
        }
      }

      if (jerseyFile) {
        const fileExt = jerseyFile.name.split('.').pop()
        const fileName = `${Date.now()}_jersey_${cleanTeamName.replace(/\s+/g, '_')}.${fileExt}`
        const { error: uploadError, data } = await supabase.storage.from('teams').upload(fileName, jerseyFile)
        if (!uploadError && data) {
          const { data: publicUrlData } = supabase.storage.from('teams').getPublicUrl(data.path)
          urlJersey = publicUrlData.publicUrl
        }
      }
    } catch (err) {
      console.error('Error uploading team files:', err)
    }

    const payload = {
      manager_id: user?.id,
      name: cleanTeamName,
      tag: cleanTag,
      hashtag: formData.get('item_meta[hashtag]'),
      country: formData.get('item_meta[623]'),
      logo_url: urlLogo,
      jersey_url: urlJersey,
      games: formData.getAll('item_meta[633][]'),
      social_ig: formData.get('social_instagram'),
      social_tiktok: formData.get('social_tiktok'),
      social_yt: formData.get('social_youtube'),
      social_fb: formData.get('social_facebook'),
      social_twitch: formData.get('social_twitch'),
      social_kick: formData.get('social_kick'),
      social_x: formData.get('social_x'),
      status: 'pending' // Admin must approve
    }
    
    const { data: insertedTeam, error: teamError } = await supabase
      .from('teams')
      .insert(payload)
      .select('id')
      .single()

    if (!teamError && insertedTeam?.id) {
      try {
        await supabase.from('validations').insert({
          type: 'equipo',
          target_name: cleanTeamName,
          submitted_by: user?.id,
          status: 'pending',
          details: {
            ...payload,
            tipoEquipo: (formData.get('item_meta[782]') as string) || 'Varonil / Mixto',
            'item_meta[782]': (formData.get('item_meta[782]') as string) || 'Varonil / Mixto',
            id: insertedTeam.id,
            team_id: insertedTeam.id
          }
        })
      } catch (valErr) {
        console.warn('Error al registrar validación de equipo:', valErr)
      }
    }

    const fullName = `${managerFirstName.trim()} ${managerLastName.trim()}`.trim().toUpperCase()
    const cleanNick = managerNickname.trim().toUpperCase()

    // Also update the manager's profile with their Discord and WhatsApp if they provided it
    if (user?.id) {
      await supabase.from('profiles').update({
        discord_handle: formData.get('item_meta[627]'),
        name: fullName || ((formData.get('item_meta[625][first]') || '') + ' ' + (formData.get('item_meta[625][last]') || '')).trim().toUpperCase(),
        nickname: cleanNick || (formData.get('item_meta[626]') as string || '').trim().toUpperCase()
      }).eq('id', user.id)
    }

    if (!teamError) {
      setFormStatus('success')
      // Desplazar al inicio para que el usuario vea la pantalla de éxito
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } else {
      setFormStatus('idle')
      alert('Error al enviar el registro del equipo. Por favor intenta de nuevo.')
    }
  }
  
  if (loadingConfig) {
    return <div className="h-96 w-full animate-pulse rounded-xl border border-border bg-surface" />
  }

  if (blockMessage) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-surface p-8 sm:p-12 text-center shadow-2xl space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-700 uppercase tracking-tight text-white">
            Iniciar Sesión Requerido
          </h2>
          <p className="mt-3 text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            {blockMessage}
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <GmxButton href="/login" className="px-8">
            INICIAR SESIÓN
          </GmxButton>
        </div>
      </div>
    )
  }

  if (existingTeamInfo) {
    const isPending = existingTeamInfo.type === 'pending'
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-surface p-8 sm:p-12 text-center shadow-2xl space-y-6">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
          isPending ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-primary/10 text-primary border border-primary/20'
        }`}>
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-700 uppercase tracking-tight text-white">
            {isPending ? 'Solicitud de Equipo en Revisión' : 'Ya Tienes un Equipo Registrado'}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            {isPending ? (
              <>
                Tu solicitud de registro para el equipo <span className="font-600 text-white">&quot;{existingTeamInfo.teamName}&quot;</span> ya se encuentra en proceso de revisión por los administradores de GMX Gaming.
              </>
            ) : (
              <>
                Ya eres el manager de <span className="font-600 text-white">&quot;{existingTeamInfo.teamName}&quot;</span>. Puedes gestionar tus jugadores, contratos y detalles desde tu panel en Mi Cuenta.
              </>
            )}
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <GmxButton href="/micuenta" className="w-full sm:w-auto px-8">
            IR A MI CUENTA
          </GmxButton>
          <GmxButton href="/" variant="secondary" className="w-full sm:w-auto px-8">
            VOLVER AL INICIO
          </GmxButton>
        </div>
      </div>
    )
  }

  if (formStatus === 'success') {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-surface p-8 sm:p-12 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="font-display text-3xl font-700 uppercase tracking-tight text-white mb-3">
          REGISTRO ENVIADO EXITOSAMENTE
        </h2>
        <p className="text-muted-foreground text-center max-w-md mx-auto mb-8 leading-relaxed">
          Tu información ha sido recibida correctamente. Nuestro equipo revisará la solicitud de tu equipo y se pondrá en contacto contigo a través de Discord o correo electrónico.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <GmxButton href="/micuenta" className="w-full sm:w-auto px-8">
            IR A MI CUENTA
          </GmxButton>
          <GmxButton href="/" variant="secondary" className="w-full sm:w-auto px-8">
            VOLVER AL INICIO
          </GmxButton>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-4xl space-y-12 rounded-xl border border-border bg-surface p-8 shadow-2xl lg:p-12 relative overflow-hidden"
    >
      {formStatus === 'loading' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-surface/95 backdrop-blur-sm animate-in fade-in duration-300">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 font-display text-lg font-600 uppercase tracking-widest text-white">
            ENVIANDO REGISTRO...
          </p>
        </div>
      )}

      <div className="text-center">
        <h2 className="font-display text-4xl font-700 uppercase tracking-tight text-white sm:text-5xl">
          ALTA DE EQUIPO
        </h2>
        <p className="mt-3 text-muted-foreground">
          Registra a tu equipo en la plataforma oficial de GMX Gaming.
        </p>
      </div>

      {/* Section 1: DATOS DEL EQUIPO */}
      <div className="space-y-6">
        <div className="border-b border-border pb-3">
          <h3 className="font-display text-xl font-600 uppercase tracking-widest text-primary">
            DATOS DEL EQUIPO
          </h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="field_5d5a2" className="text-sm font-500 text-white">
              Nombre del Equipo <span className="text-primary">*</span>
              <FieldTooltip text="Ej: GMX GAMING. Solo mayúsculas, sin caracteres especiales." />
            </label>
            <input
              type="text"
              id="field_5d5a2"
              name="item_meta[622]"
              required
              value={teamName}
              onChange={handleTeamNameChange}
              onPaste={handleTeamNamePaste}
              className={cn(
                "w-full rounded-md border bg-background px-4 py-3 text-white transition-colors focus:outline-none focus:ring-1 uppercase",
                teamNameError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-border focus:border-primary focus:ring-primary"
              )}
              placeholder="Ej. GMX GAMING"
            />
            {teamNameError && (
              <p className="text-xs font-500 text-red-400 mt-1">{teamNameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="item_meta_tag" className="text-sm font-500 text-white">
              Tag del Equipo <span className="text-primary">*</span>
              <FieldTooltip text="Las siglas que abrevian el nombre. Ej: GMX" />
            </label>
            <input
              type="text"
              id="item_meta_tag"
              name="item_meta[tag]"
              required
              value={teamTag}
              onChange={handleTeamTagChange}
              className={cn(
                "w-full rounded-md border bg-background px-4 py-3 text-white transition-colors focus:outline-none focus:ring-1 uppercase",
                teamTagError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-border focus:border-primary focus:ring-primary"
              )}
              placeholder="Ej. GMX"
            />
            {teamTagError && (
              <p className="text-xs font-500 text-red-400 mt-1">{teamTagError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="item_meta_hashtag" className="text-sm font-500 text-white">
              Hashtag del Equipo <span className="text-primary">*</span>
              <FieldTooltip text="Una frase que representa al equipo. Ej: #GMXWIN" />
            </label>
            <input
              type="text"
              id="item_meta_hashtag"
              name="item_meta[hashtag]"
              required
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Ej. #GMXWIN"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="field_s3a0m2" className="text-sm font-500 text-white">
              País del Equipo <span className="text-primary">*</span>
              <FieldTooltip text="País principal al que representa el equipo." />
            </label>
            <div className="relative">
              <select
                id="field_s3a0m2"
                name="item_meta[623]"
                required
                defaultValue=""
                className="w-full appearance-none rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="" disabled>Selecciona un país</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-500 text-white">
              Tipo de Equipo <span className="text-primary">*</span>
              <FieldTooltip text="Categoría competitiva del equipo." />
            </label>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-md border border-border bg-background px-4 py-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white transition-colors hover:text-primary">
                <input
                  type="radio"
                  name="item_meta[782]"
                  value="Varonil / Mixto"
                  required
                  className="h-4 w-4 shrink-0 border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background"
                />
                Varonil / Mixto
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white transition-colors hover:text-primary">
                <input
                  type="radio"
                  name="item_meta[782]"
                  value="Femenil"
                  required
                  className="h-4 w-4 shrink-0 border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background"
                />
                Femenil
              </label>
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-500 text-white">
              Logo del Equipo <span className="text-primary">*</span>
              <FieldTooltip text="Formatos permitidos: PNG, JPG. Máximo 1 archivo." />
            </label>
            <FileUpload name="item_meta[624]" required accept="image/jpeg,image/png,.jpg,.jpeg,.png" onFileSelect={setLogoFile} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-500 text-white">
              Jersey del Equipo (Opcional)
              <FieldTooltip text="Imagen del uniforme del equipo. Format: PNG, JPG." />
            </label>
            <FileUpload name="item_meta_jersey" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onFileSelect={setJerseyFile} />
          </div>
        </div>

        {games.length > 1 ? (
          <div className="space-y-4 pt-4">
            <label className="text-sm font-500 text-white">
              Juegos en los que participa su Equipo <span className="text-primary">*</span>
              <FieldTooltip text="Debe seleccionar al menos un juego de la lista." />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {games.map(game => (
                <label key={game.name} className="group relative flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-background p-4 transition-all hover:border-primary">
                  <input
                    type="checkbox"
                    name="item_meta[633][]"
                    value={game.name}
                    checked={selectedGames.includes(game.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGames([...selectedGames, game.name])
                      } else {
                        if (selectedGames.length > 1) {
                          setSelectedGames(selectedGames.filter(g => g !== game.name))
                        }
                      }
                    }}
                    className="h-5 w-5 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background"
                  />
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-surface p-1 border border-border">
                    {game.image ? (
                      <img src={game.image} alt={game.name} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">{game.name.substring(0,3).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="font-display font-600 tracking-wider text-white">{game.name}</span>
                </label>
              ))}
            </div>
          </div>
        ) : games.length === 1 ? (
          <input type="hidden" name="item_meta[633][]" value={games[0].name} />
        ) : null}

        {/* Redes Sociales */}
        <div className="space-y-4 pt-4">
          <label className="text-sm font-500 text-white">
            Redes Sociales del Equipo
            <FieldTooltip text="Pega los enlaces completos (Ej: https://instagram.com/tu-equipo). Déjalo vacío si no aplica." />
          </label>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {['Instagram', 'TikTok', 'YouTube', 'Facebook', 'Twitch', 'Kick', 'X'].map(social => (
              <div key={social} className="space-y-1.5">
                <label className="text-xs font-500 text-muted-foreground">{social}</label>
                <input
                  type="url"
                  name={`social_${social.toLowerCase()}`}
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder={`https://${social.toLowerCase()}.com/...`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: DATOS DEL GERENTE */}
      <div className="space-y-6 pt-6">
        <div className="border-b border-border pb-3">
          <h3 className="font-display text-xl font-600 uppercase tracking-widest text-primary">
            DATOS DEL GERENTE GENERAL, MANAGER, LÍDER O REPRESENTANTE
          </h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="field_p8e5q2_first" className="text-sm font-500 text-white">
              Nombre(s) <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              id="field_p8e5q2_first"
              name="item_meta[625][first]"
              autoComplete="given-name"
              required
              value={managerFirstName}
              onChange={(e) => setManagerFirstName(formatPersonName(e.target.value))}
              placeholder="EJ. JUAN CARLOS"
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase"
            />
            <p className="text-[11px] text-muted-foreground">Solo letras en mayúsculas, sin números ni caracteres especiales.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="field_p8e5q2_last" className="text-sm font-500 text-white">
              Apellidos <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              id="field_p8e5q2_last"
              name="item_meta[625][last]"
              autoComplete="family-name"
              required
              value={managerLastName}
              onChange={(e) => setManagerLastName(formatPersonName(e.target.value))}
              placeholder="EJ. PEREZ GOMEZ"
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase"
            />
            <p className="text-[11px] text-muted-foreground">Solo letras en mayúsculas, sin números ni caracteres especiales.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="field_xi2ck2" className="text-sm font-500 text-white">
              Nickname <span className="text-primary">*</span>
              <FieldTooltip text="Seudónimo o nombre en el juego del Manager. En mayúsculas y sin caracteres especiales." />
            </label>
            <input
              type="text"
              id="field_xi2ck2"
              name="item_meta[626]"
              required
              value={managerNickname}
              onChange={(e) => setManagerNickname(formatNickname(e.target.value))}
              placeholder="EJ. MORDON99"
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase"
            />
            <p className="text-[11px] text-muted-foreground">En mayúsculas, sin caracteres especiales.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="field_j8tvb2" className="text-sm font-500 text-white">
              Handle de Discord <span className="text-primary">*</span>
              <FieldTooltip text="Usuario de Discord actual (sin el #, ej: mordongmx)." />
            </label>
            <input
              type="text"
              id="field_j8tvb2"
              name="item_meta[627]"
              required
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Ej. mordongmx"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="field_4qz1w2" className="text-sm font-500 text-white">
              WhatsApp <span className="text-primary">*</span>
            </label>
            <PhoneInput id="field_4qz1w2" name="item_meta[628]" required />
          </div>

          <div className="space-y-2">
            <label htmlFor="field_dz2202" className="text-sm font-500 text-white">
              Correo Electrónico <span className="text-primary">*</span>
            </label>
            <input
              type="email"
              id="field_dz2202"
              name="item_meta[629]"
              autoComplete="email"
              required
              defaultValue={user?.email || ''}
              readOnly={!!user?.email}
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            {user?.email && (
              <p className="text-xs text-muted-foreground mt-1">Este es el correo asociado a tu cuenta.</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: ACUERDO DE EXCLUSIVIDAD Y CONFIRMACIONES */}
      <div className="space-y-6 pt-6">
        <div className="border-b border-border pb-3">
          <h3 className="font-display text-xl font-600 uppercase tracking-widest text-primary">
            ACUERDO DE EXCLUSIVIDAD Y REGLAMENTO
          </h3>
        </div>

        <div className="rounded-lg border border-border bg-background p-6 space-y-6">
          <div>
            <p className="mb-4 text-sm text-white">
              Antes de Registrar a tu Equipo, o a ti mismo como Jugador Competitivo, asegúrate de leer los siguientes documentos:
            </p>
            <ul className="mb-6 list-inside list-disc space-y-2 text-sm">
              <li>
                <a
                  href="https://csgog5wux9xz.sg.larksuite.com/wiki/DwS6wIadKiYB9ikNbjNlrOrXg2f?from=from_copylink"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#ffff00] hover:underline"
                >
                  Acuerdo de Exclusividad con GMX Gaming
                </a>
              </li>
              <li>
                <a
                  href="https://csgog5wux9xz.sg.larksuite.com/wiki/ElYlwabD7iDF8lkI9bOlPccsgpc?from=from_copylink"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#ffff00] hover:underline"
                >
                  Reglamento General Vigente del Competitivo Varonil, Mixto y Femenil de GMX Gaming
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4 border-t border-border/50 pt-4">
            <label className="flex cursor-pointer items-start gap-4 text-sm leading-relaxed text-muted-foreground transition-colors hover:text-white">
              <div className="pt-1">
                <input
                  type="checkbox"
                  name="item_meta[638][]"
                  required
                  className="h-5 w-5 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background"
                />
              </div>
              <span>
                Confirmo que he leído y estoy de acuerdo con los Términos y Condiciones del Acuerdo de Exclusividad de GMX Gaming, así como el Reglamento General Vigente. <span className="text-primary">*</span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-4 text-sm leading-relaxed text-muted-foreground transition-colors hover:text-white">
              <div className="pt-1">
                <input
                  type="checkbox"
                  name="confirm_age"
                  required
                  className="h-5 w-5 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background"
                />
              </div>
              <span>
                Confirmo que soy mayor de edad según las leyes de mi país de residencia. <span className="text-primary">*</span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-4 text-sm leading-relaxed text-muted-foreground transition-colors hover:text-white">
              <div className="pt-1">
                <input
                  type="checkbox"
                  name="confirm_truth"
                  required
                  className="h-5 w-5 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background"
                />
              </div>
              <span>
                Declaro bajo protesta de decir verdad que toda la información proporcionada en este formulario es verídica y correcta. <span className="text-primary">*</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="pt-8 text-center sm:text-left">
        <button
          type="submit"
          disabled={formStatus === 'loading' || !!teamNameError || !!teamTagError}
          className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden bg-primary px-8 py-5 font-display text-[15px] font-600 uppercase tracking-[0.18em] text-white transition-colors duration-300 clip-corner hover:bg-primary-dark sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center gap-2">
            {formStatus === 'loading' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                ENVIANDO REGISTRO...
              </>
            ) : (
              'ENVIAR REGISTRO'
            )}
          </span>
        </button>
      </div>
    </form>
  )
}
