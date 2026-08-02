'use client'

import { useState, useEffect } from 'react'
import { Upload, Image as ImageIcon, Loader2, CheckCircle2, HelpCircle } from 'lucide-react'
import { GmxButton } from '@/components/gmx-button'
import { PhoneInput } from '@/components/forms/phone-input'
import { FileUpload } from '@/components/forms/file-upload'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

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
  const [games, setGames] = useState<string[]>(['Mobile Legends'])
  const [loadingConfig, setLoadingConfig] = useState(true)

  // Validation state
  const [teamName, setTeamName] = useState('')
  
  // Files
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [jerseyFile, setJerseyFile] = useState<File | null>(null)

  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase.from('app_settings').select('*')
      if (data && data.length > 0) {
        const countryConfig = data.find(c => c.id === 'enabled_countries')
        const gameConfig = data.find(c => c.id === 'enabled_games')
        
        if (countryConfig && Array.isArray(countryConfig.value) && countryConfig.value.length > 0) {
          setCountries(countryConfig.value as string[])
        }
        if (gameConfig && Array.isArray(gameConfig.value) && gameConfig.value.length > 0) {
          setGames(gameConfig.value as string[])
        }
      }
      setLoadingConfig(false)
    }
    loadConfig()
  }, [])

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormStatus('loading')
    
    const form = e.currentTarget
    const formData = new FormData(form)

    let urlLogo = 'https://placehold.co/400x400/png?text=LOGO+EQUIPO'
    let urlJersey = 'https://placehold.co/400x400/png?text=JERSEY'

    try {
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${Date.now()}_logo_${teamName.replace(/\s+/g, '_')}.${fileExt}`
        const { error: uploadError, data } = await supabase.storage.from('teams').upload(fileName, logoFile)
        if (!uploadError && data) {
          const { data: publicUrlData } = supabase.storage.from('teams').getPublicUrl(data.path)
          urlLogo = publicUrlData.publicUrl
        }
      }

      if (jerseyFile) {
        const fileExt = jerseyFile.name.split('.').pop()
        const fileName = `${Date.now()}_jersey_${teamName.replace(/\s+/g, '_')}.${fileExt}`
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
      nombreEquipo: teamName,
      tag: formData.get('item_meta[tag]'),
      hashtag: formData.get('item_meta[hashtag]'),
      pais: formData.get('item_meta[623]'),
      tipoEquipo: formData.get('item_meta[782]'),
      logo: urlLogo,
      jersey: urlJersey,
      juegos: formData.getAll('item_meta[633][]'),
      redes: {
        instagram: formData.get('social_instagram'),
        tiktok: formData.get('social_tiktok'),
        youtube: formData.get('social_youtube'),
        facebook: formData.get('social_facebook'),
        twitch: formData.get('social_twitch'),
        kick: formData.get('social_kick'),
        x: formData.get('social_x'),
      },
      managerNombre: formData.get('item_meta[625][first]') + ' ' + formData.get('item_meta[625][last]'),
      managerSeudonimo: formData.get('item_meta[626]'),
      managerDiscord: formData.get('item_meta[627]'),
      managerWhatsApp: formData.get('item_meta[628]'),
      managerCorreo: formData.get('item_meta[629]'),
      confirmacionEdad: formData.get('confirm_age') === 'on',
      confirmacionVeracidad: formData.get('confirm_truth') === 'on'
    }
    
    const { error } = await supabase.from('validations').insert({
      type: 'equipo',
      target_name: payload.nombreEquipo as string,
      submitted_by: user?.name || payload.managerCorreo,
      status: 'pending',
      details: payload
    })

    if (!error) {
      setFormStatus('success')
    } else {
      setFormStatus('idle')
      alert('Error al enviar el registro del equipo.')
    }
  }
  
  if (loadingConfig) {
    return <div className="h-96 w-full animate-pulse rounded-xl border border-border bg-surface" />
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

      {formStatus === 'success' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-surface animate-in fade-in duration-500">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="font-display text-3xl font-700 uppercase tracking-tight text-white mb-2 text-center">
            REGISTRO ENVIADO EXITOSAMENTE
          </h2>
          <p className="text-muted-foreground text-center max-w-md px-4 mb-8">
            Tu información ha sido recibida correctamente. Nuestro equipo revisará la solicitud de tu equipo y se pondrá en contacto contigo a través de Discord o correo electrónico.
          </p>
          <GmxButton href="/micuenta" className="px-8">
            IR A MI CUENTA
          </GmxButton>
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
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase"
              placeholder="Ej. GMX GAMING"
            />
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
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase"
              placeholder="Ej. GMX"
            />
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
            <div className="flex h-[50px] items-center gap-6 rounded-md border border-border bg-background px-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white transition-colors hover:text-primary">
                <input
                  type="radio"
                  name="item_meta[782]"
                  value="Varonil / Mixto"
                  required
                  className="h-4 w-4 border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background"
                />
                Varonil / Mixto
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white transition-colors hover:text-primary">
                <input
                  type="radio"
                  name="item_meta[782]"
                  value="Femenil"
                  required
                  className="h-4 w-4 border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background"
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

        <div className="space-y-4 pt-4">
          <label className="text-sm font-500 text-white">
            Juegos en los que participa su Equipo <span className="text-primary">*</span>
            <FieldTooltip text="Debe seleccionar al menos un juego de la lista." />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            {games.includes('Mobile Legends') && (
              <label className="group relative flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-background p-4 transition-all hover:border-primary">
                <input
                  type="checkbox"
                  name="item_meta[633][]"
                  value="MLBB"
                  defaultChecked
                  className="h-5 w-5 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background"
                />
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-surface p-1">
                  <img
                    src="https://i0.wp.com/gmxgaming.com/wp-content/uploads/2024/07/Mobile-Legends-Logo-Icono.png?w=640&ssl=1"
                    alt="MLBB"
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="font-display font-600 tracking-wider text-white">Mobile Legends</span>
              </label>
            )}

            {games.filter(g => g !== 'Mobile Legends').map(game => (
              <label key={game} className="group relative flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-background p-4 transition-all hover:border-primary">
                <input
                  type="checkbox"
                  name="item_meta[633][]"
                  value={game}
                  className="h-5 w-5 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background"
                />
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-surface border border-border">
                  <span className="text-xs font-bold text-muted-foreground">{game.substring(0,3).toUpperCase()}</span>
                </div>
                <span className="font-display font-600 tracking-wider text-white">{game}</span>
              </label>
            ))}
          </div>
        </div>

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
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
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
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="field_xi2ck2" className="text-sm font-500 text-white">
              Nickname <span className="text-primary">*</span>
              <FieldTooltip text="Seudónimo o nombre en el juego del Manager." />
            </label>
            <input
              type="text"
              id="field_xi2ck2"
              name="item_meta[626]"
              required
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
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
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
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
          className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden bg-primary px-8 py-5 font-display text-[15px] font-600 uppercase tracking-[0.18em] text-white transition-colors duration-300 clip-corner hover:bg-primary-dark sm:w-auto"
        >
          <span className="relative z-10 flex items-center gap-2">
            ENVIAR REGISTRO
          </span>
        </button>
      </div>
    </form>
  )
}
