'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Upload, Image as ImageIcon, FileText, Loader2, CheckCircle2, HelpCircle, AlertTriangle } from 'lucide-react'
import { GmxButton } from '@/components/gmx-button'
import { PhoneInput } from '@/components/forms/phone-input'
import { FileUpload } from '@/components/forms/file-upload'
import { cn, formatNickname, formatPersonName } from '@/lib/utils'
import { compressImage, IMAGE_PRESETS, SUPABASE_STORAGE_CACHE_OPTIONS } from '@/lib/image-compression'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { useDebounce } from '@/hooks/use-debounce'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/language-context'

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
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'already_registered' | 'pending_review'>('idle')
  const searchParams = useSearchParams()
  const defaultEmail = searchParams.get('email') || ''
  const { user } = useAuth()
  const supabase = createClient()
  const { t } = useLanguage()

  const [countries, setCountries] = useState<string[]>(DEFAULT_COUNTRIES)
  const [games, setGames] = useState<string[]>(['Mobile Legends'])
  const [selectedGame, setSelectedGame] = useState<string>('Mobile Legends')
  const [loadingConfig, setLoadingConfig] = useState(true)

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

      if (user) {
        const { data: profile } = await supabase.from('profiles')
          .select('is_player, player_status')
          .eq('id', user.id)
          .single()

        const { data: userVal } = await supabase.from('validations')
          .select('status')
          .eq('type', 'jugador')
          .or(`details->>user_id.eq.${user.id},submitted_by.eq.${user.id},submitted_by.eq.${user.email}`)
          .order('created_at', { ascending: false })
          .limit(1)

        const valStatus = userVal?.[0]?.status

        if ((profile?.is_player && (profile.player_status === 'active' || profile.player_status === 'approved')) || valStatus === 'active' || valStatus === 'approved') {
          if (!profile?.is_player || profile?.player_status !== 'active') {
            supabase.from('profiles').update({ is_player: true, player_status: 'active' }).eq('id', user.id)
          }
          setFormStatus('already_registered')
          setLoadingConfig(false)
          return
        } else if ((profile?.is_player && profile.player_status === 'pending') || valStatus === 'pending') {
          setFormStatus('pending_review')
          setLoadingConfig(false)
          return
        }
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
        .ilike('nickname', cleanNick)
        .neq('id', user?.id || '')
        .limit(1)
      
      const { data: gameWithNick } = await supabase.from('player_game_info')
        .select('id, profile_id')
        .ilike('game_nickname', cleanNick)
        .neq('profile_id', user?.id || '')
        .limit(1)

      if ((profileWithNick && profileWithNick.length > 0) || (gameWithNick && gameWithNick.length > 0)) {
        setNicknameError(t.altaJugador.nicknameInUse)
      } else {
        setNicknameError('')
      }
    }
    validateNickname()
  }, [debouncedNickname, user?.id, t])

  // Auto-scroll on success
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
    const form = e.currentTarget
    const formData = new FormData(form)

    if (formStatus === 'loading') return

    const cleanNick = nickname.trim().toUpperCase()

    if (nicknameError) {
      toast.error(t.altaJugador.nicknameInUse)
      return
    }

    if (!cleanNick) {
      toast.error(t.altaJugador.nicknameLabel + ' is required.')
      return
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast.error(t.altaJugador.firstName + ' & ' + t.altaJugador.lastName + ' are required.')
      return
    }

    setFormStatus('loading')

    try {
      if (user?.id) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('is_player, player_status')
          .eq('id', user.id)
          .maybeSingle()

        if (currentProfile?.is_player && (currentProfile.player_status === 'active' || currentProfile.player_status === 'approved' || currentProfile.player_status === 'pending')) {
          toast.error(t.altaJugador.alreadyDesc)
          setFormStatus('idle')
          return
        }
      }

      if (cleanNick) {
        const { data: profileWithNick } = await supabase
          .from('profiles')
          .select('id')
          .ilike('nickname', cleanNick)
          .neq('id', user?.id || '')
          .limit(1)

        const { data: gameWithNick } = await supabase
          .from('player_game_info')
          .select('id')
          .ilike('game_nickname', cleanNick)
          .neq('profile_id', user?.id || '')
          .limit(1)

        if ((profileWithNick && profileWithNick.length > 0) || (gameWithNick && gameWithNick.length > 0)) {
          toast.error(t.altaJugador.nicknameInUse)
          setFormStatus('idle')
          return
        }
      }

      const emailValue = (formData.get('item_meta[676]') as string || '').trim()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailValue || !emailRegex.test(emailValue)) {
        toast.error('Please enter a valid email address.')
        setFormStatus('idle')
        return
      }

      const birthDateValue = formData.get('item_meta[675]') as string
      if (birthDateValue) {
        const birthDate = new Date(birthDateValue)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (birthDate > today) {
          toast.error('Date of birth cannot be a future date.')
          setFormStatus('idle')
          return
        }
      }

      let urlFoto: string | null = (user?.avatar && !user.avatar.includes('placehold.co')) ? user.avatar : null
      let urlIdentidad: string | null = null
      let urlPasaporte: string | null = null
      const safeNick = cleanNick.replace(/[^a-zA-Z0-9_-]/g, '') || 'jugador'

      try {
        if (fotoFile) {
          const compressedFoto = await compressImage(fotoFile, IMAGE_PRESETS.AVATAR)
          const fileExt = compressedFoto.name.split('.').pop()?.toLowerCase() || 'webp'
          const fileName = `${Date.now()}_foto_${safeNick}.${fileExt}`
          const { error: uploadError, data } = await supabase.storage.from('avatars').upload(fileName, compressedFoto, SUPABASE_STORAGE_CACHE_OPTIONS)
          if (!uploadError && data) {
            const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
            urlFoto = publicUrlData.publicUrl
          } else if (uploadError) {
            console.warn('Warning uploading photo:', uploadError)
          }
        }

        if (identidadFile) {
          const compressedId = await compressImage(identidadFile, IMAGE_PRESETS.DOCUMENT)
          const fileExt = compressedId.name.split('.').pop()?.toLowerCase() || 'webp'
          const fileName = `${Date.now()}_ine_${safeNick}.${fileExt}`
          const { error: uploadError, data } = await supabase.storage.from('documents').upload(fileName, compressedId, SUPABASE_STORAGE_CACHE_OPTIONS)
          if (!uploadError && data) {
            const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(data.path)
            urlIdentidad = publicUrlData.publicUrl
          } else if (uploadError) {
            console.warn('Warning uploading ID:', uploadError)
          }
        }

        if (pasaporteFile) {
          const compressedPassport = await compressImage(pasaporteFile, IMAGE_PRESETS.DOCUMENT)
          const fileExt = compressedPassport.name.split('.').pop()?.toLowerCase() || 'webp'
          const fileName = `${Date.now()}_pasaporte_${safeNick}.${fileExt}`
          const { error: uploadError, data } = await supabase.storage.from('documents').upload(fileName, compressedPassport, SUPABASE_STORAGE_CACHE_OPTIONS)
          if (!uploadError && data) {
            const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(data.path)
            urlPasaporte = publicUrlData.publicUrl
          } else if (uploadError) {
            console.warn('Warning uploading passport:', uploadError)
          }
        }
      } catch (err) {
        console.error('Error processing player files:', err)
      }
      
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim().toUpperCase()

      const countryValue = (formData.get('item_meta[722]') as string) || (formData.get('item_meta[677]') as string) || 'México'
      const corePayload: Record<string, any> = {
        name: fullName,
        nickname: cleanNick,
        discord_handle: formData.get('item_meta[684]') || null,
        closest_airport: countryValue,
        is_player: true,
        player_status: 'pending',
      }

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

      if (urlFoto && !urlFoto.includes('placehold.co')) {
        corePayload.avatar_url = urlFoto
        corePayload.avatar = urlFoto
      }
      if (urlIdentidad && !urlIdentidad.includes('placehold.co')) {
        corePayload.id_photo_url = urlIdentidad
      }
      if (urlPasaporte) corePayload.passport_photo_url = urlPasaporte

      const fullPayload = { ...corePayload, ...socialLinks }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(fullPayload)
        .eq('id', user?.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
        if (profileError.code === '42703' || profileError.message?.includes('column')) {
          const { error: coreErr } = await supabase
            .from('profiles')
            .update(corePayload)
            .eq('id', user?.id)
          if (coreErr) {
            setFormStatus('idle')
            toast.error('Error saving profile: ' + coreErr.message)
            return
          }
        } else {
          setFormStatus('idle')
          toast.error('Error submitting request: ' + profileError.message)
          return
        }
      }

      if (formData.get('item_meta[697]')) {
        try {
          const gamePayload = {
            profile_id: user?.id,
            game: (formData.get('selected_game') as string) || selectedGame || 'Mobile Legends',
            game_id: formData.get('item_meta[697]'),
            server: formData.get('item_meta[784]'),
            game_nickname: cleanNick,
            country_account: formData.get('item_meta[722]')
          }
          await supabase.from('player_game_info').insert(gamePayload)
        } catch (gErr) {
          console.warn('Error saving game info (non-blocking):', gErr)
        }
      }

      try {
        const { data: existingVal } = await supabase
          .from('validations')
          .select('id, status')
          .eq('type', 'jugador')
          .or(`details->>user_id.eq.${user?.id},submitted_by.eq.${user?.id},submitted_by.eq.${user?.email}`)
          .order('created_at', { ascending: false })
          .limit(1)

        const isAlreadyApproved = existingVal?.[0]?.status === 'active' || existingVal?.[0]?.status === 'approved'

        const finalAvatar = (urlFoto && !urlFoto.includes('placehold.co')) ? urlFoto : (user?.avatar || null)
        const validationDetails = {
          user_id: user?.id,
          name: fullName,
          nickname: cleanNick,
          email: emailValue,
          birth_date: birthDateValue || null,
          gender: (formData.get('item_meta[783]') as string) || null,
          country: (formData.get('item_meta[677]') as string) || null,
          discord: (formData.get('item_meta[684]') as string) || null,
          phone: (formData.get('item_meta[685]') as string) || null,
          avatar_url: finalAvatar,
          avatar: finalAvatar,
          id_photo_url: urlIdentidad,
          passport_photo_url: urlPasaporte || null,
          game: (formData.get('selected_game') as string) || selectedGame || null,
          game_id: (formData.get('item_meta[697]') as string) || null,
          ...socialLinks,
        }

        if (existingVal && existingVal.length > 0) {
          await supabase.from('validations').update({
            status: isAlreadyApproved ? existingVal[0].status : 'pending',
            target_name: cleanNick,
            submitted_by: fullName,
            details: validationDetails,
          }).eq('id', existingVal[0].id)
        } else {
          await supabase.from('validations').insert({
            type: 'jugador',
            target_name: cleanNick,
            submitted_by: fullName,
            status: 'pending',
            details: validationDetails,
          })
        }
      } catch (valErr) {
        console.warn('Warning registering in validations (non-blocking):', valErr)
      }

      toast.success(t.altaJugador.successTitle)
      setFormStatus('success')
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (err: any) {
      console.error('Unexpected error submitting player registration:', err)
      toast.error('Unexpected error: ' + (err?.message || 'Please try again.'))
      setFormStatus('idle')
    }
  }

  if (loadingConfig && formStatus !== 'already_registered') {
    return <div className="h-96 w-full animate-pulse rounded-xl border border-border bg-surface" />
  }

  if (formStatus === 'pending_review') {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-surface p-12 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10">
          <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
        </div>
        <h2 className="font-display text-3xl font-700 uppercase tracking-tight text-white mb-4">
          {t.altaJugador.pendingTitle}
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          {t.altaJugador.pendingDesc}
        </p>
        <GmxButton href="/micuenta" className="px-8">
          {t.altaJugador.goToAccount}
        </GmxButton>
      </div>
    )
  }

  if (formStatus === 'already_registered') {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-surface p-12 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="font-display text-3xl font-700 uppercase tracking-tight text-white mb-4">
          {t.altaJugador.alreadyTitle}
        </h2>
        <p className="text-muted-foreground mb-8">
          {t.altaJugador.alreadyDesc}
        </p>
        <GmxButton href="/micuenta" className="px-8">
          {t.altaJugador.goToAccount}
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
          {t.altaJugador.successTitle}
        </h2>
        <p className="text-muted-foreground text-center max-w-md mx-auto mb-8 leading-relaxed">
          {t.altaJugador.successDesc}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <GmxButton href="/micuenta" className="w-full sm:w-auto px-8">
            {t.altaJugador.goToAccount}
          </GmxButton>
          <GmxButton href="/" variant="secondary" className="w-full sm:w-auto px-8">
            {t.altaJugador.backToHome}
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
            {t.altaJugador.submitting}
          </p>
        </div>
      )}

      <div className="text-center">
        <h2 className="font-display text-4xl font-700 uppercase tracking-tight text-white sm:text-5xl">
          {t.altaJugador.formTitle}
        </h2>
        <p className="mt-3 text-muted-foreground">
          {t.altaJugador.formSubtitle}
        </p>
      </div>

      {/* Section 1: PLAYER INFORMATION */}
      <div className="space-y-6">
        <div className="border-b border-border pb-3">
          <h3 className="font-display text-xl font-600 uppercase tracking-widest text-primary">
            {t.altaJugador.sectionPlayer}
          </h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="field_k57zx_first" className="text-sm font-500 text-white">
              {t.altaJugador.firstName} <span className="text-primary">*</span>
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
            <p className="text-[11px] text-muted-foreground">{t.altaJugador.uppercaseHint}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="field_k57zx_last" className="text-sm font-500 text-white">
              {t.altaJugador.lastName} <span className="text-primary">*</span>
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
            <p className="text-[11px] text-muted-foreground">{t.altaJugador.uppercaseHint}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="field_hs7a9" className="text-sm font-500 text-white">
              {t.altaJugador.nicknameLabel} <span className="text-primary">*</span>
              <FieldTooltip text={t.altaJugador.nicknameTooltip} />
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
            <p className="text-[11px] text-muted-foreground">{t.altaJugador.nicknameHint}</p>
            {nicknameError && (
              <p className="text-xs text-red-500 mt-1">{nicknameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="field_3vhsb" className="text-sm font-500 text-white">
              {t.altaJugador.gender} <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <select
                id="field_3vhsb"
                name="item_meta[783]"
                required
                className="w-full appearance-none rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Masculino">{t.altaJugador.genderMale}</option>
                <option value="Femenino">{t.altaJugador.genderFemale}</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t.altaJugador.genderNote}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="field_7jhiv" className="text-sm font-500 text-white">
              {t.altaJugador.birthDate} <span className="text-primary">*</span>
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
              {t.altaJugador.birthCountry} <span className="text-primary">*</span>
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
              {t.altaJugador.residenceCountry} <span className="text-primary">*</span>
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
              {t.altaJugador.discordHandle} <span className="text-primary">*</span>
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
              {t.altaJugador.email} <span className="text-primary">*</span>
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
              {t.altaJugador.phone} <span className="text-primary">*</span>
            </label>
            <PhoneInput id="field_6if8l" name="item_meta[685]" required />
          </div>
        </div>

        {/* Social Media */}
        <div className="space-y-4 pt-4">
          <label className="text-sm font-500 text-white">
            {t.altaJugador.socialNetworks}
            <FieldTooltip text={t.altaJugador.socialTooltip} />
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

      {/* Section 2: PHOTO & DOCUMENTS */}
      <div className="grid gap-12 lg:grid-cols-2 pt-6">
        <div className="space-y-6">
          <div className="border-b border-border pb-3">
            <h3 className="font-display text-xl font-600 uppercase tracking-widest text-primary">
              {t.altaJugador.sectionPhoto}
            </h3>
          </div>
          
          <div className="space-y-4">
            <label className="text-sm font-500 text-white">
              {t.altaJugador.photoLabel} <span className="text-primary">*</span>
            </label>
            <p className="text-xs text-muted-foreground">
              {t.altaJugador.photoDesc}
            </p>
            <FileUpload name="item_meta[687]" required onFileSelect={setFotoFile} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="border-b border-border pb-3">
            <h3 className="font-display text-xl font-600 uppercase tracking-widest text-primary">
              {t.altaJugador.sectionDocuments}
            </h3>
          </div>
          
          <div className="space-y-4">
            <label className="text-sm font-500 text-white">
              {t.altaJugador.idLabel}
            </label>
            <p className="text-xs text-muted-foreground">
              {t.altaJugador.idDesc}
            </p>
            <FileUpload name="item_meta[750]" icon={<FileText className="h-10 w-10" />} onFileSelect={setIdentidadFile} />
          </div>
        </div>
      </div>

      {/* Section 3: GAME INFORMATION */}
      <div className="space-y-6 pt-6">
        <div className="border-b border-border pb-3">
          <h3 className="font-display text-xl font-600 uppercase tracking-widest text-primary">
            {t.altaJugador.sectionGame}
          </h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {games.length > 1 && (
            <div className="space-y-2">
              <label htmlFor="field_selected_game" className="text-sm font-500 text-white">
                {t.altaJugador.mainGame} <span className="text-primary">*</span>
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

      {/* Section 4: PASSPORT */}
      <div className="space-y-6 pt-6">
        <div className="border-b border-border pb-3">
          <h3 className="font-display text-xl font-600 uppercase tracking-widest text-primary">
            {t.altaJugador.sectionPassport}
          </h3>
        </div>

        <div className="max-w-xl space-y-4">
          <label className="text-sm font-500 text-white">
            {t.altaJugador.passportLabel}
          </label>
          <p className="text-xs text-muted-foreground">
            {t.altaJugador.passportDesc}
          </p>
          <FileUpload name="item_meta[678]" onFileSelect={setPasaporteFile} />
        </div>
      </div>

      <div className="pt-8 text-center sm:text-left border-t border-border mt-8">
        <button
          type="submit"
          disabled={formStatus === 'loading' || !!nicknameError}
          className={cn(
            "group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden px-8 py-5 font-display text-[15px] font-600 uppercase tracking-[0.18em] text-white transition-colors duration-300 clip-corner sm:w-auto mt-4 disabled:opacity-50 disabled:cursor-not-allowed",
            nicknameError ? "bg-muted" : "bg-primary hover:bg-primary-dark"
          )}
        >
          <span className="relative z-10 flex items-center gap-2">
            {formStatus === 'loading' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t.altaJugador.submitting}
              </>
            ) : (
              t.altaJugador.submit
            )}
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
