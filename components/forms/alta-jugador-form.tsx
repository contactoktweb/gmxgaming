'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Upload, Image as ImageIcon, FileText, Loader2, CheckCircle2, HelpCircle, AlertTriangle } from 'lucide-react'
import { GmxButton } from '@/components/gmx-button'
import { PhoneInput } from '@/components/forms/phone-input'
import { FileUpload } from '@/components/forms/file-upload'
import { cn, formatNickname, formatPersonName } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { useDebounce } from '@/hooks/use-debounce'

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

function FormContent() {
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'already_registered'>('idle')
  const searchParams = useSearchParams()
  const defaultEmail = searchParams.get('email') || ''
  const { user } = useAuth()
  const supabase = createClient()

  const [countries, setCountries] = useState<string[]>(DEFAULT_COUNTRIES)
  const [games, setGames] = useState<string[]>(['Mobile Legends'])
  const [selectedGame, setSelectedGame] = useState<string>('Mobile Legends')
  const [loadingConfig, setLoadingConfig] = useState(true)

  // Nombre, Apellidos y Nickname (Mayúsculas y sin caracteres especiales)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nickname, setNickname] = useState('')
  const debouncedNickname = useDebounce(nickname, 500)
  const [nicknameError, setNicknameError] = useState('')

  // Files
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [identidadFile, setIdentidadFile] = useState<File | null>(null)
  const [pasaporteFile, setPasaporteFile] = useState<File | null>(null)

  useEffect(() => {
    async function init() {
      if (!user) return

      // Check if already registered
      const { data: profile } = await supabase.from('profiles')
        .select('is_player')
        .eq('id', user.id)
        .single()

      if (profile && profile.is_player) {
        setFormStatus('already_registered')
      }

      const { data: settings } = await supabase.from('app_settings').select('*')
      if (settings && settings.length > 0) {
        const countryConfig = settings.find(c => c.id === 'enabled_countries')
        const gameConfig = settings.find(c => c.id === 'enabled_games')
        
        if (countryConfig && Array.isArray(countryConfig.value) && countryConfig.value.length > 0) {
          setCountries(countryConfig.value as string[])
        }
        if (gameConfig && Array.isArray(gameConfig.value) && gameConfig.value.length > 0) {
          const loadedGames = gameConfig.value
            .map((g: any) => (typeof g === 'string' ? g : g?.name))
            .filter(Boolean) as string[]

          if (loadedGames.length > 0) {
            setGames(loadedGames)
            setSelectedGame(loadedGames[0])
          }
        }
      }
      setLoadingConfig(false)
    }
    init()
  }, [user])

  useEffect(() => {
    async function validateNickname() {
      const cleanNick = debouncedNickname.trim().toUpperCase()
      if (!cleanNick) {
        setNicknameError('')
        return
      }
      
      const { data: profileWithNick } = await supabase.from('profiles')
        .select('id')
        .or(`nickname.ilike.${cleanNick},game_nickname.ilike.${cleanNick}`)
        .neq('id', user?.id || '')
        .limit(1)
      
      const { data: gameWithNick } = await supabase.from('player_game_info')
        .select('id, profile_id')
        .ilike('game_nickname', cleanNick)
        .neq('profile_id', user?.id || '')
        .limit(1)

      if ((profileWithNick && profileWithNick.length > 0) || (gameWithNick && gameWithNick.length > 0)) {
        setNicknameError('Este nickname ya está en uso por otro jugador.')
      } else {
        setNicknameError('')
      }
    }
    validateNickname()
  }, [debouncedNickname, user?.id])

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
    if (nicknameError) {
      alert('Por favor, elige un Nickname diferente.')
      return
    }

    setFormStatus('loading')
    
    const form = e.currentTarget
    const formData = new FormData(form)

    let urlFoto = 'https://placehold.co/400x400/png?text=FOTO+JUGADOR'
    let urlIdentidad = 'https://placehold.co/600x400/png?text=INE'
    let urlPasaporte = null

    try {
      // 1. Upload Fotografía
      if (fotoFile) {
        const fileExt = fotoFile.name.split('.').pop()
        const fileName = `${Date.now()}_foto_${nickname}.${fileExt}`
        const { error: uploadError, data } = await supabase.storage.from('avatars').upload(fileName, fotoFile)
        if (!uploadError && data) {
          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
          urlFoto = publicUrlData.publicUrl
        }
      }

      // 2. Upload Documento Identidad
      if (identidadFile) {
        const fileExt = identidadFile.name.split('.').pop()
        const fileName = `${Date.now()}_ine_${nickname}.${fileExt}`
        const { error: uploadError, data } = await supabase.storage.from('documents').upload(fileName, identidadFile)
        if (!uploadError && data) {
          const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(data.path)
          urlIdentidad = publicUrlData.publicUrl
        }
      }

      // 3. Upload Pasaporte
      if (pasaporteFile) {
        const fileExt = pasaporteFile.name.split('.').pop()
        const fileName = `${Date.now()}_pasaporte_${nickname}.${fileExt}`
        const { error: uploadError, data } = await supabase.storage.from('documents').upload(fileName, pasaporteFile)
        if (!uploadError && data) {
          const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(data.path)
          urlPasaporte = publicUrlData.publicUrl
        }
      }
    } catch (err) {
      console.error('Error uploading files:', err)
      // Continue anyway, or show error? Best to continue with placeholders or fail?
      // Since it's prod, we should continue or show error. We'll proceed with whatever uploaded.
    }
    
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim().toUpperCase()
    const cleanNick = nickname.trim().toUpperCase()

    if (!firstName.trim() || !lastName.trim()) {
      alert('Por favor ingresa tu nombre y apellidos.')
      setFormStatus('idle')
      return
    }

    if (!cleanNick) {
      alert('Por favor ingresa tu nickname.')
      setFormStatus('idle')
      return
    }

    // Validar formato de correo electrónico
    const emailValue = (formData.get('item_meta[676]') as string || '').trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailValue || !emailRegex.test(emailValue)) {
      alert('Por favor ingresa un correo electrónico válido.')
      setFormStatus('idle')
      return
    }

    // Validar fecha de nacimiento (no puede ser en el futuro)
    const birthDateValue = formData.get('item_meta[675]') as string
    if (birthDateValue) {
      const birthDate = new Date(birthDateValue)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (birthDate > today) {
        alert('La fecha de nacimiento no puede ser una fecha futura.')
        setFormStatus('idle')
        return
      }
    }

    // Payload principal — campos garantizados que existen en la tabla profiles
    const corePayload: Record<string, any> = {
      name: fullName,
      nickname: cleanNick,
      game_nickname: cleanNick,
      discord_handle: formData.get('item_meta[684]') || null,
      is_player: true,
      player_status: 'pending',
    }

    // Campos opcionales — se agregan solo si tienen valor
    const socialLinks: Record<string, any> = {}
    const socialMap: Record<string, string> = {
      social_ig: 'social_instagram',
      social_tiktok: 'social_tiktok',
      social_yt: 'social_youtube',
      social_fb: 'social_facebook',
      social_twitch: 'social_twitch',
      social_kick: 'social_kick',
      social_x: 'social_x',
    }
    Object.entries(socialMap).forEach(([dbField, formField]) => {
      const val = formData.get(formField)
      if (val) socialLinks[dbField] = val
    })

    if (urlFoto) corePayload.avatar_url = urlFoto
    if (urlIdentidad) corePayload.id_photo_url = urlIdentidad
    if (urlPasaporte) corePayload.passport_photo_url = urlPasaporte

    // Fusionar con redes sociales
    const fullPayload = { ...corePayload, ...socialLinks }

    const { error: profileError } = await supabase
      .from('profiles')
      .update(fullPayload)
      .eq('id', user?.id)

    if (profileError) {
      console.error('Error al actualizar perfil:', profileError)
      // Si el error es de columna inexistente, intentar solo los campos core
      if (profileError.code === '42703' || profileError.message?.includes('column')) {
        const { error: coreErr } = await supabase
          .from('profiles')
          .update(corePayload)
          .eq('id', user?.id)
        if (coreErr) {
          setFormStatus('idle')
          alert('Error al guardar tu perfil: ' + coreErr.message)
          return
        }
      } else {
        setFormStatus('idle')
        alert('Error al enviar tu solicitud: ' + profileError.message)
        return
      }
    }

    let gameInfoError = null

    // Insert Game Info if applicable (e.g. Mobile Legends)
    if (formData.get('item_meta[697]')) {
      const gamePayload = {
        profile_id: user?.id,
        game: (formData.get('selected_game') as string) || selectedGame || 'Mobile Legends',
        game_id: formData.get('item_meta[697]'),
        server: formData.get('item_meta[784]'),
        game_nickname: cleanNick,
        country_account: formData.get('item_meta[722]')
      }
      const { error: gErr } = await supabase.from('player_game_info').insert(gamePayload)
      if (gErr) {
        console.warn('Error al guardar info de juego (no bloquea el registro):', gErr)
        // No bloqueamos — el perfil ya se actualizó
      }
    }
    
    setFormStatus('success')
  }

  if (loadingConfig && formStatus !== 'already_registered') {
    return <div className="h-96 w-full animate-pulse rounded-xl border border-border bg-surface" />
  }

  if (formStatus === 'already_registered') {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-surface p-12 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="font-display text-3xl font-700 uppercase tracking-tight text-white mb-4">
          YA ESTÁS REGISTRADO
        </h2>
        <p className="text-muted-foreground mb-8">
          Tu cuenta ya tiene un registro de jugador. Un jugador solo puede registrarse una vez por cuenta.
        </p>
        <GmxButton href="/micuenta" className="px-8">
          IR A MI CUENTA
        </GmxButton>
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
          Tu información ha sido recibida correctamente. Nuestro equipo revisará tu solicitud y se pondrá en contacto contigo a través de Discord o correo electrónico.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <GmxButton href="/micuenta" className="w-full sm:w-auto px-8">
            IR A MI CUENTA
          </GmxButton>
          <GmxButton href="/" variant="outline" className="w-full sm:w-auto px-8">
            VOLVER AL INICIO
          </GmxButton>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-5xl space-y-12 rounded-xl border border-border bg-surface p-8 shadow-2xl lg:p-12 relative overflow-hidden"
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
          ALTA DE JUGADOR
        </h2>
        <p className="mt-3 text-muted-foreground">
          Regístrate como jugador competitivo en la plataforma oficial de GMX Gaming.
        </p>
      </div>

      {/* Section 1: INFORMACION DEL JUGADOR */}
      <div className="space-y-6">
        <div className="border-b border-border pb-3">
          <h3 className="font-display text-xl font-600 uppercase tracking-widest text-primary">
            INFORMACIÓN DEL JUGADOR
          </h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="field_k57zx_first" className="text-sm font-500 text-white">
              Nombre <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              id="field_k57zx_first"
              name="item_meta[674][first]"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(formatPersonName(e.target.value))}
              placeholder="EJ. JUAN CARLOS"
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase"
            />
            <p className="text-[11px] text-muted-foreground">Solo letras en mayúsculas, sin números ni caracteres especiales.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="field_k57zx_last" className="text-sm font-500 text-white">
              Apellidos <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              id="field_k57zx_last"
              name="item_meta[674][last]"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(e) => setLastName(formatPersonName(e.target.value))}
              placeholder="EJ. PEREZ GOMEZ"
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase"
            />
            <p className="text-[11px] text-muted-foreground">Solo letras en mayúsculas, sin números ni caracteres especiales.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="field_hs7a9" className="text-sm font-500 text-white">
              Nickname <span className="text-primary">*</span>
              <FieldTooltip text="Tu apodo único en la plataforma. En mayúsculas y sin caracteres especiales." />
            </label>
            <input
              type="text"
              id="field_hs7a9"
              required
              value={nickname}
              onChange={(e) => setNickname(formatNickname(e.target.value))}
              placeholder="EJ. FAKER99"
              className={cn(
                "w-full rounded-md border bg-background px-4 py-3 text-white transition-colors focus:outline-none focus:ring-1 uppercase",
                nicknameError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-border focus:border-primary focus:ring-primary"
              )}
            />
            <p className="text-[11px] text-muted-foreground">En mayúsculas, sin caracteres especiales.</p>
            {nicknameError && (
              <p className="text-xs text-red-500 mt-1">{nicknameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="field_3vhsb" className="text-sm font-500 text-white">
              Género <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <select
                id="field_3vhsb"
                name="item_meta[783]"
                required
                className="w-full appearance-none rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              El género que elijas debe estar avalado por un documento oficial.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="field_7jhiv" className="text-sm font-500 text-white">
              Fecha de Nacimiento <span className="text-primary">*</span>
            </label>
            <input
              type="date"
              id="field_7jhiv"
              name="item_meta[675]"
              required
              max={new Date().toISOString().split('T')[0]}
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="field_vlqx" className="text-sm font-500 text-white">
              País de Nacimiento <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <select
                id="field_vlqx"
                name="item_meta[677]"
                defaultValue="México"
                required
                className="w-full appearance-none rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
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
            <label htmlFor="field_bb4bx" className="text-sm font-500 text-white">
              País de Residencia <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <select
                id="field_bb4bx"
                name="item_meta[722]"
                defaultValue="México"
                required
                className="w-full appearance-none rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {countries.map(c => <option key={`res-${c}`} value={c}>{c}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="field_dznon" className="text-sm font-500 text-white">
              Handle de Discord <span className="text-primary">*</span>
              <FieldTooltip text="Ej: mordongmx" />
            </label>
            <input
              type="text"
              id="field_dznon"
              name="item_meta[684]"
              required
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Ej. mordongmx"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="field_xc8wk" className="text-sm font-500 text-white">
              Correo Electrónico <span className="text-primary">*</span>
            </label>
            <input
              type="email"
              id="field_xc8wk"
              name="item_meta[676]"
              autoComplete="email"
              required
              defaultValue={defaultEmail}
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="field_6if8l" className="text-sm font-500 text-white">
              Teléfono (WhatsApp) <span className="text-primary">*</span>
            </label>
            <PhoneInput id="field_6if8l" name="item_meta[685]" required />
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="space-y-4 pt-4">
          <label className="text-sm font-500 text-white">
            Redes Sociales
            <FieldTooltip text="Pega los enlaces completos (Ej: https://instagram.com/tu-usuario). Déjalo vacío si no aplica." />
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

      {/* Section 2: FOTOGRAFIA & DOCUMENTOS */}
      <div className="grid gap-12 lg:grid-cols-2 pt-6">
        <div className="space-y-6">
          <div className="border-b border-border pb-3">
            <h3 className="font-display text-xl font-600 uppercase tracking-widest text-primary">
              FOTOGRAFÍA
            </h3>
          </div>
          
          <div className="space-y-4">
            <label className="text-sm font-500 text-white">
              Fotografía <span className="text-primary">*</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Sube tu foto utilizando una playera negra o el uniforme de tu equipo profesional.
            </p>
            <FileUpload name="item_meta[687]" required onFileSelect={setFotoFile} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="border-b border-border pb-3">
            <h3 className="font-display text-xl font-600 uppercase tracking-widest text-primary">
              DOCUMENTO DE IDENTIFICACIÓN
            </h3>
          </div>
          
          <div className="space-y-4">
            <label className="text-sm font-500 text-white">
              INE / ACTA DE NACIMIENTO
            </label>
            <p className="text-xs text-muted-foreground">
              Toma una foto clara de la parte frontal de tu documento oficial.
            </p>
            <FileUpload name="item_meta[750]" icon={<FileText className="h-10 w-10" />} onFileSelect={setIdentidadFile} />
          </div>
        </div>
      </div>

      {/* Section 3: INFORMACION VIDEOJUEGOS */}
      <div className="space-y-6 pt-6">
        <div className="border-b border-border pb-3">
          <h3 className="font-display text-xl font-600 uppercase tracking-widest text-primary">
            INFORMACIÓN VIDEOJUEGOS
          </h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {/* Si hay más de 1 juego habilitado en configuración, permitir seleccionar */}
          {games.length > 1 && (
            <div className="space-y-2">
              <label htmlFor="field_selected_game" className="text-sm font-500 text-white">
                Juego Principal <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <select
                  id="field_selected_game"
                  name="selected_game"
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="w-full appearance-none rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {games.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="field_uupyg" className="text-sm font-500 text-white">
              ID {selectedGame || 'Mobile Legends'} <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              id="field_uupyg"
              name="item_meta[697]"
              required
              placeholder="Ej. 12345678"
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="field_p8548" className="text-sm font-500 text-white">
              Server {selectedGame || 'Mobile Legends'} <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              id="field_p8548"
              name="item_meta[784]"
              required
              maxLength={10}
              placeholder="Ej. 1234"
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Section 4: PASAPORTE */}
      <div className="space-y-6 pt-6">
        <div className="border-b border-border pb-3">
          <h3 className="font-display text-xl font-600 uppercase tracking-widest text-primary">
            PASAPORTE
          </h3>
        </div>

        <div className="max-w-xl space-y-4">
          <label className="text-sm font-500 text-white">
            Pasaporte
          </label>
          <p className="text-xs text-muted-foreground">
            Sube una imagen de tu pasaporte. Si no tienes uno, sube la cita generada.
          </p>
          <FileUpload name="item_meta[678]" onFileSelect={setPasaporteFile} />
        </div>
      </div>

      <div className="pt-8 text-center sm:text-left border-t border-border mt-8">
        <button
          type="submit"
          disabled={!!nicknameError}
          className={cn(
            "group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden px-8 py-5 font-display text-[15px] font-600 uppercase tracking-[0.18em] text-white transition-colors duration-300 clip-corner sm:w-auto mt-4",
            nicknameError ? "bg-muted cursor-not-allowed" : "bg-primary hover:bg-primary-dark"
          )}
        >
          <span className="relative z-10 flex items-center gap-2">
            ENVIAR REGISTRO DE JUGADOR
          </span>
        </button>
      </div>
    </form>
  )
}

export function AltaJugadorForm() {
  return (
    <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-xl border border-border bg-surface" />}>
      <FormContent />
    </Suspense>
  )
}
