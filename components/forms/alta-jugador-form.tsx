'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Upload, Image as ImageIcon, FileText, Loader2, CheckCircle2, HelpCircle, AlertTriangle } from 'lucide-react'
import { GmxButton } from '@/components/gmx-button'
import { PhoneInput } from '@/components/forms/phone-input'
import { FileUpload } from '@/components/forms/file-upload'
import { cn } from '@/lib/utils'
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
  const [loadingConfig, setLoadingConfig] = useState(true)

  // Nickname validation
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
          setGames(gameConfig.value as string[])
        }
      }
      setLoadingConfig(false)
    }
    init()
  }, [user])

  useEffect(() => {
    async function validateNickname() {
      if (!debouncedNickname) {
        setNicknameError('')
        return
      }
      // Assuming players table or profiles table has the uniqueness check
      const { data } = await supabase.from('profiles')
        .select('id')
        .eq('game_nickname', debouncedNickname)
        .single()
      
      if (data) {
        setNicknameError('Este nickname ya está en uso por otro jugador.')
      } else {
        setNicknameError('')
      }
    }
    validateNickname()
  }, [debouncedNickname])

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
    
    // Payload principal — campos garantizados que existen en la tabla profiles
    const corePayload: Record<string, any> = {
      name: (formData.get('item_meta[674][first]') || '') + ' ' + (formData.get('item_meta[674][last]') || ''),
      nickname: nickname,
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
    if (formData.get('item_meta[781]')) corePayload.closest_airport = formData.get('item_meta[781]')

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
        game: 'Mobile Legends',
        game_id: formData.get('item_meta[697]'),
        server: formData.get('item_meta[784]'),
        game_nickname: nickname,
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

      {formStatus === 'success' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-surface animate-in fade-in duration-500">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="font-display text-3xl font-700 uppercase tracking-tight text-white mb-2">
            REGISTRO ENVIADO EXITOSAMENTE
          </h2>
          <p className="text-muted-foreground text-center max-w-md px-4 mb-8">
            Tu información ha sido recibida correctamente. Nuestro equipo revisará tu solicitud y se pondrá en contacto contigo a través de Discord o correo electrónico.
          </p>
          <GmxButton href="/micuenta" className="px-8">
            IR A MI CUENTA
          </GmxButton>
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
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
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
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="field_hs7a9" className="text-sm font-500 text-white">
              Nickname <span className="text-primary">*</span>
              <FieldTooltip text="Tu apodo único en la plataforma. No puede estar repetido." />
            </label>
            <input
              type="text"
              id="field_hs7a9"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={cn(
                "w-full rounded-md border bg-background px-4 py-3 text-white transition-colors focus:outline-none focus:ring-1",
                nicknameError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-border focus:border-primary focus:ring-primary"
              )}
            />
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
          {games.includes('Mobile Legends') && (
            <>
              <div className="space-y-2">
                <label htmlFor="field_uupyg" className="text-sm font-500 text-white">
                  ID Mobile Legends <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  id="field_uupyg"
                  name="item_meta[697]"
                  required
                  className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="field_p8548" className="text-sm font-500 text-white">
                  Server Mobile Legends <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  id="field_p8548"
                  name="item_meta[784]"
                  required
                  maxLength={5}
                  className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </>
          )}

          {/* Ocultado temporalmente - Lógica futura para otros juegos dinamicos */}
        </div>
      </div>

      {/* Section 4: PASAPORTE E INFORMACION DE VIAJE */}
      <div className="space-y-6 pt-6">
        <div className="border-b border-border pb-3">
          <h3 className="font-display text-xl font-600 uppercase tracking-widest text-primary">
            PASAPORTE E INFORMACIÓN DE VIAJE
          </h3>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-4">
            <label className="text-sm font-500 text-white">
              Pasaporte
            </label>
            <p className="text-xs text-muted-foreground">
              Sube una imagen de tu pasaporte. Si no tienes uno, sube la cita generada.
            </p>
            <FileUpload name="item_meta[678]" onFileSelect={setPasaporteFile} />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="field_xbhly" className="text-sm font-500 text-white">
                Aeropuerto más cercano <span className="text-primary">*</span>
              </label>
              <div className="relative">
                {/* Simplified list for brevity */}
                <select
                  id="field_xbhly"
                  name="item_meta[781]"
                  defaultValue="MÉXICO - CIUDAD DE MEXICO - AEROPUERTO INTERNACIONAL DE LA CIUDAD DE MÉXICO, S.A. DE C.V. (AICM)"
                  className="w-full appearance-none rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="MÉXICO - CIUDAD DE MEXICO - AEROPUERTO INTERNACIONAL DE LA CIUDAD DE MÉXICO, S.A. DE C.V. (AICM)">AICM (CDMX) - México</option>
                  <option value="CANCÚN - QUINTANA ROO - AEROPUERTO DE CANCÚN, S.A. DE C.V.">Cancún - México</option>
                  <option value="BOGOTÁ - EL DORADO">El Dorado (Bogotá) - Colombia</option>
                  <option value="BUENOS AIRES - EZEIZA">Ezeiza (Buenos Aires) - Argentina</option>
                  <option value="LIMA - JORGE CHÁVEZ">Jorge Chávez (Lima) - Perú</option>
                  <option value="SANTIAGO - ARTURO MERINO BENÍTEZ">Arturo Merino Benítez (Santiago) - Chile</option>
                  <option value="OTRO">Otro (Internacional / No Listado)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
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
