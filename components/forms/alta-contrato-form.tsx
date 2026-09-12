'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, HelpCircle, AlertTriangle, ShieldCheck, Info } from 'lucide-react'
import { GmxButton } from '@/components/gmx-button'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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

export function AltaContratoForm() {
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'blocked'>('idle')
  const { user } = useAuth()
  const supabase = createClient()
  
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['JUGADOR(A)'])
  const [playerGender, setPlayerGender] = useState<'Masculino' | 'Femenino'>('Masculino')
  const [blockMessage, setBlockMessage] = useState('')
  const [infoNotice, setInfoNotice] = useState('')
  const [teams, setTeams] = useState<any[]>([])
  const [allowedDivision, setAllowedDivision] = useState<'all' | 'Varonil / Mixto' | 'Femenil'>('all')
  const [contractEndDate, setContractEndDate] = useState('')
  const [dateError, setDateError] = useState('')
  const [isInitializing, setIsInitializing] = useState(true)

  const [hasVaronilContract, setHasVaronilContract] = useState(false)
  const [hasFemenilContract, setHasFemenilContract] = useState(false)
  const [countries, setCountries] = useState<any[]>([])

  // Fechas límite: fecha de hoy y fecha mínima permitida (mañana) en formato YYYY-MM-DD
  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0')
  const todayDay = String(today.getDate()).padStart(2, '0')
  const todayStr = `${todayYear}-${todayMonth}-${todayDay}`

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minYear = tomorrow.getFullYear()
  const minMonth = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const minDay = String(tomorrow.getDate()).padStart(2, '0')
  const minDateStr = `${minYear}-${minMonth}-${minDay}`

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value
    setContractEndDate(selected)
    if (!selected) {
      setDateError('Por favor selecciona una fecha.')
    } else if (selected <= todayStr) {
      setDateError('La fecha debe ser posterior al día de hoy.')
    } else {
      setDateError('')
    }
  }

  useEffect(() => {
    async function init() {
      if (!user) {
        setIsInitializing(false)
        return
      }
      setIsInitializing(true)

      // Cargar configuraciones de países desde app_settings
      try {
        const { data: configData } = await supabase.from('app_settings').select('*')
        if (configData) {
          const countryConfig = configData.find(s => s.id === 'enabled_countries')
          if (countryConfig && Array.isArray(countryConfig.value) && countryConfig.value.length > 0) {
            setCountries(countryConfig.value)
          }
        }
      } catch (err) {
        console.error('Error fetching dynamic country configuration:', err)
      }

      // 1. Validar si el usuario es jugador profesional aprobado
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_player, player_status')
        .eq('id', user.id)
        .single()

      const isApproved = Boolean(profile?.is_player && (profile?.player_status === 'active' || profile?.player_status === 'approved'))
      if (!isApproved) {
        if (!profile?.is_player) {
          setBlockMessage('Debes estar registrado y aprobado como Jugador Profesional para poder registrar contratos con equipos.')
        } else if (profile?.player_status === 'pending') {
          setBlockMessage('Tu registro como Jugador Profesional se encuentra actualmente en revisión por los administradores. Podrás solicitar contratos tan pronto como sea aprobado.')
        } else {
          setBlockMessage('Tu perfil de Jugador Profesional no se encuentra activo.')
        }
        setFormStatus('blocked')
        setIsInitializing(false)
        return
      }

      // 2. Detectar género del jugador desde validaciones
      let detectedGender: 'Masculino' | 'Femenino' = 'Masculino'
      const { data: userValidations } = await supabase
        .from('validations')
        .select('details')
        .or(`submitted_by.eq.${user.id},submitted_by.eq.${user.email || 'none'},details->>user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10)

      if (userValidations && userValidations.length > 0) {
        for (const v of userValidations) {
          const g = v.details?.gender || v.details?.genero || v.details?.['item_meta[783]'] || v.details?.item_meta?.[783]
          if (typeof g === 'string') {
            const lower = g.toLowerCase()
            if (lower.includes('fem') || lower === 'f' || lower.includes('mujer')) {
              detectedGender = 'Femenino'
              break
            }
          }
        }
      }
      setPlayerGender(detectedGender)

      // 3. Obtener equipos y sus divisiones registradas
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name, status, manager_id, gender_category')
        .in('status', ['active', 'approved', 'pending'])

      const { data: teamValidations } = await supabase
        .from('validations')
        .select('details')
        .eq('type', 'equipo')

      const teamCategoryMap = new Map<string, 'Varonil / Mixto' | 'Femenil'>()
      if (teamValidations) {
        teamValidations.forEach((tv: any) => {
          const tId = tv.details?.team_id || tv.details?.id
          const cat = tv.details?.tipoEquipo || tv.details?.['item_meta[782]'] || ''
          if (tId) {
            teamCategoryMap.set(tId, cat.toLowerCase().includes('fem') ? 'Femenil' : 'Varonil / Mixto')
          }
        })
      }

      const parsedTeams = (teamsData || [])
        .map(t => {
          // Prioridad: 1) gender_category en tabla teams, 2) validaciones, 3) nombre del equipo
          let category: 'Varonil / Mixto' | 'Femenil'
          if (t.gender_category === 'female') {
            category = 'Femenil'
          } else if (t.gender_category === 'mixed') {
            category = 'Varonil / Mixto'
          } else {
            category = teamCategoryMap.get(t.id) || (t.name.toLowerCase().includes('fem') ? 'Femenil' : 'Varonil / Mixto')
          }
          return { ...t, category }
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))

      // 4. Obtener únicamente contratos activos o en proceso (excluye completados, cancelados y rechazados)
      const { data: contracts } = await supabase
        .from('contracts')
        .select('*, teams(id, name)')
        .eq('player_id', user.id)
        .in('status', ['active', 'activo', 'pending_manager', 'pendiente', 'pending_player_release', 'pending_manager_release'])

      const activeList = contracts || []

      const getCat = (c: any) => {
        if (c.team_gender_category === 'female') return 'Femenil'
        if (c.team_gender_category === 'mixed') return 'Varonil / Mixto'
        const fromMap = teamCategoryMap.get(c.team_id)
        if (fromMap) return fromMap
        const teamName = c.teams?.name || ''
        return teamName.toLowerCase().includes('fem') ? 'Femenil' : 'Varonil / Mixto'
      }

      const hasVaronil = activeList.some((c: any) => getCat(c) === 'Varonil / Mixto')
      const hasFemenil = activeList.some((c: any) => getCat(c) === 'Femenil')

      setHasVaronilContract(hasVaronil)
      setHasFemenilContract(hasFemenil)

      // 5. Aplicar regla de contratos según género
      if (detectedGender === 'Masculino') {
        // Hombre: Solo 1 contrato activo de equipo varonil/mixto
        if (activeList.length >= 1) {
          setBlockMessage('Ya cuentas con un contrato activo o en proceso. Los jugadores varoniles solo pueden tener 1 contrato a la vez. Cuando tu contrato anterior sea dado de baja, podrás registrar uno nuevo.')
          setFormStatus('blocked')
          setIsInitializing(false)
          return
        }

        // Solo permitir equipos Varonil / Mixto
        setAllowedDivision('Varonil / Mixto')
        setTeams([...parsedTeams.filter(t => t.category === 'Varonil / Mixto')].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })))
        setInfoNotice('Regla de contratos: Como jugador varonil, tienes permitido contar con 1 contrato activo en división Varonil / Mixto.')
      } else {
        // Mujer: Hasta 2 activos (exactamente 1 varonil/mixto y 1 femenil)
        if (hasVaronil && hasFemenil) {
          setBlockMessage('Has alcanzado el límite máximo de contratos permitidos para jugadoras (1 en equipo Femenil y 1 en equipo Varonil / Mixto). Si alguno de tus contratos es dado de baja, podrás registrar uno nuevo en esa división.')
          setFormStatus('blocked')
          setIsInitializing(false)
          return
        }

        if (hasVaronil) {
          setAllowedDivision('Femenil')
          setTeams([...parsedTeams.filter(t => t.category === 'Femenil')].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })))
          setInfoNotice('Cuentas con 1 contrato activo en división Varonil / Mixto. Tu cupo disponible restante es exclusivamente para 1 equipo de división Femenil.')
        } else if (hasFemenil) {
          setAllowedDivision('Varonil / Mixto')
          setTeams([...parsedTeams.filter(t => t.category === 'Varonil / Mixto')].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })))
          setInfoNotice('Cuentas con 1 contrato activo en división Femenil. Tu cupo disponible restante es exclusivamente para 1 equipo de división Varonil / Mixto.')
        } else {
          setAllowedDivision('all')
          setTeams([...parsedTeams].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })))
          setInfoNotice('Regla para jugadoras: Puedes tener hasta 2 contratos activos simultáneos (exclusivamente 1 en división Femenil y 1 en división Varonil / Mixto).')
        }
      }
      setIsInitializing(false)
    }
    init()
  }, [user])

  const handleRoleToggle = (rol: string) => {
    setSelectedRoles(prev => 
      prev.includes(rol) 
        ? prev.filter(r => r !== rol) 
        : [...prev, rol]
    )
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
    // Capturar form y FormData de forma síncrona antes de cualquier proceso asíncrono
    const form = e.currentTarget
    const formData = new FormData(form)

    if (selectedRoles.length === 0) {
      toast.error('Debes seleccionar al menos un rol en el equipo.')
      return
    }

    setFormStatus('loading')
    
    try {
      const teamId = formData.get('item_meta[879]') as string
      const rawEndDate = formData.get('item_meta[882]') as string

      // Validar que la fecha sea mayor al día de hoy
      if (!rawEndDate) {
        setDateError('Por favor selecciona la fecha de duración del contrato.')
        toast.error('Por favor selecciona la fecha de duración del contrato.')
        setFormStatus('idle')
        return
      }

      if (rawEndDate <= todayStr) {
        setDateError('La fecha del contrato debe ser posterior al día de hoy.')
        toast.error('La duración del contrato debe ser una fecha posterior al día de hoy. No se permiten fechas anteriores ni el día actual.')
        setFormStatus('idle')
        return
      }

      // Verificar que el equipo seleccionado exista y esté disponible
      const { data: teamData, error: teamFetchError } = await supabase
        .from('teams')
        .select('id, name, manager_id, status')
        .eq('id', teamId)
        .maybeSingle()

      if (teamFetchError || !teamData) {
        toast.error('El equipo seleccionado no existe o no está disponible.')
        setFormStatus('idle')
        return
      }

      const selectedTeam = teams.find(t => t.id === teamId)

      // Construir roles a guardar
      const rolesToSave = [...selectedRoles]
      const linea = formData.get('item_meta_linea')
      if (selectedRoles.includes('JUGADOR(A)') && linea) {
        rolesToSave.push(`Línea: ${linea}`)
      }

      const isFemenil = selectedTeam?.category === 'Femenil'

      if (playerGender === 'Masculino') {
        if (isFemenil) {
          toast.error('Los jugadores varoniles no pueden registrar contratos en la división Femenil.')
          setFormStatus('idle')
          return
        }
        if (hasVaronilContract) {
          toast.error('Ya cuentas con un contrato activo en la división Varonil / Mixto.')
          setFormStatus('idle')
          return
        }
      } else {
        if (isFemenil && hasFemenilContract) {
          toast.error('Ya cuentas con un contrato activo en la división Femenil.')
          setFormStatus('idle')
          return
        }
        if (!isFemenil && hasVaronilContract) {
          toast.error('Ya cuentas con un contrato activo en la división Varonil / Mixto.')
          setFormStatus('idle')
          return
        }
      }

      const payload = {
        player_id: user?.id,
        team_id: teamId,
        roles: rolesToSave,
        end_date: formData.get('item_meta[882]'),
        status: 'pending_manager',
        team_gender_category: isFemenil ? 'female' : 'mixed'
      }

      let newContractId: string | null = null
      let insertError: any = null

      const firstAttempt = await supabase
        .from('contracts')
        .insert(payload)
        .select('id')

      if (firstAttempt.error) {
        console.warn('Primer intento de contrato falló, probando sin columna team_gender_category:', firstAttempt.error)
        const fallbackPayload = {
          player_id: user?.id,
          team_id: teamId,
          roles: rolesToSave,
          end_date: formData.get('item_meta[882]'),
          status: 'pending_manager'
        }
        const secondAttempt = await supabase
          .from('contracts')
          .insert(fallbackPayload)
          .select('id')

        if (secondAttempt.error) {
          insertError = secondAttempt.error
        } else {
          newContractId = secondAttempt.data?.[0]?.id || null
        }
      } else {
        newContractId = firstAttempt.data?.[0]?.id || null
      }

      if (insertError) {
        console.error('Error insertando contrato:', insertError)
        toast.error('Error al enviar el contrato: ' + insertError.message)
        setFormStatus('idle')
        return
      }

      // Registrar en validations para panel administrativo
      try {
        const { data: playerProfile } = await supabase
          .from('profiles')
          .select('name, nickname')
          .eq('id', user?.id)
          .maybeSingle()

        const pName = playerProfile?.nickname || playerProfile?.name || user?.email || 'Jugador'
        const tName = selectedTeam?.name || teamData?.name || 'Equipo'

        await supabase.from('validations').insert({
          type: 'contrato',
          target_name: `${pName} ➔ ${tName} (Contrato)`,
          submitted_by: pName,
          status: 'pending',
          details: {
            contract_id: newContractId,
            player_id: user?.id,
            player_name: pName,
            team_id: teamId,
            team_name: tName,
            roles: rolesToSave,
            end_date: rawEndDate,
            division: isFemenil ? 'Femenil' : 'Varonil / Mixto',
            team_gender_category: isFemenil ? 'female' : 'mixed',
            status: 'pending'
          }
        })
      } catch (valErr) {
        console.warn('Advertencia registrando validación de contrato (no bloqueante):', valErr)
      }

      toast.success('¡Contrato enviado a revisión exitosamente!')
      setFormStatus('success')
    } catch (err: any) {
      console.error('Error inesperado enviando contrato:', err)
      toast.error('Error inesperado al enviar contrato: ' + (err?.message || 'Por favor intenta de nuevo.'))
      setFormStatus('idle')
    }
  }

  if (isInitializing) {
    return (
      <div className="mx-auto w-full max-w-4xl rounded-xl border border-border bg-surface p-8 shadow-2xl lg:p-12">
        <div className="h-10 w-64 mx-auto rounded-lg bg-white/5 animate-pulse mb-4" />
        <div className="h-4 w-80 mx-auto rounded bg-white/5 animate-pulse mb-12" />
        <div className="space-y-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-14 w-full rounded-md bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (formStatus === 'blocked') {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-surface p-12 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="font-display text-3xl font-700 uppercase tracking-tight text-white mb-4">
          LÍMITE DE CONTRATOS ALCANZADO
        </h2>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
          {blockMessage}
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
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="font-display text-3xl font-700 uppercase tracking-tight text-white mb-3 text-center">
          ACUERDO ENVIADO AL MANAGER
        </h2>
        <p className="text-muted-foreground text-center max-w-md mx-auto mb-8 leading-relaxed">
          Tu contrato ha sido registrado correctamente y se encuentra pendiente de aprobación. El Manager del equipo deberá revisarlo y aceptarlo en su panel de control para que sea válido.
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
            REGISTRANDO CONTRATO...
          </p>
        </div>
      )}

      <div className="text-center">
        <h2 className="font-display text-4xl font-700 uppercase tracking-tight text-white sm:text-5xl">
          REGISTRO DE CONTRATO
        </h2>
        <p className="mt-3 text-muted-foreground">
          Formaliza tu vinculación y acuerdo con tu equipo en la plataforma oficial de GMX Gaming.
        </p>

        {infoNotice && (
          <div className="mt-6 mx-auto max-w-2xl rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-center gap-3 text-left">
            <Info className="h-5 w-5 text-primary shrink-0" />
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              {infoNotice}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-8">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Equipo */}
          <div className="space-y-2">
            <label htmlFor="field_8bh2e" className="text-sm font-500 text-white flex items-center justify-between">
              <span>Equipo <span className="text-primary">*</span></span>
              {allowedDivision !== 'all' && (
                <span className="text-[11px] font-600 text-primary uppercase tracking-wider">
                  División: {allowedDivision}
                </span>
              )}
            </label>
            <div className="relative">
              <select
                id="field_8bh2e"
                name="item_meta[879]"
                required
                defaultValue=""
                className="w-full appearance-none rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="" disabled>Selecciona tu equipo</option>
                {teams.length > 0 ? (
                  teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} [{t.category || 'Varonil / Mixto'}]{t.status === 'pending' ? ' (Pendiente)' : ''}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No hay equipos disponibles en esta división</option>
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Fecha de Termino */}
          <div className="space-y-2">
            <label htmlFor="field_bgj19" className="text-sm font-500 text-white">
              Duración Máxima del Contrato <span className="text-primary">*</span>
              <FieldTooltip text="Fecha límite en la que el contrato expira." />
            </label>
            <input
              type="date"
              id="field_bgj19"
              name="item_meta[882]"
              required
              min={minDateStr}
              value={contractEndDate}
              onChange={handleDateChange}
              className={cn(
                "w-full rounded-md border bg-background px-4 py-3 text-white transition-colors focus:outline-none focus:ring-1",
                dateError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-border focus:border-primary focus:ring-primary"
              )}
            />
            {dateError ? (
              <p className="text-xs text-red-500 font-500 mt-1">
                {dateError}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Solo se permiten fechas futuras posteriores al día de hoy.
              </p>
            )}
          </div>

          {/* Roles en el Equipo */}
          <div className="space-y-4 sm:col-span-2 pt-4 border-t border-border/50">
            <label className="text-sm font-500 text-white">
              Roles en el Equipo <span className="text-primary">*</span>
              <FieldTooltip text="Puedes seleccionar varios roles, pero al menos uno es obligatorio." />
            </label>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {['JUGADOR(A)', 'COACH', 'ANALISTA', 'PSICOLOGO DEPORTIVO'].map((rol) => (
                <label key={rol} className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors min-h-[60px]",
                  selectedRoles.includes(rol) ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/50"
                )}>
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(rol)}
                    onChange={() => handleRoleToggle(rol)}
                    className="h-5 w-5 shrink-0 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background"
                  />
                  <span className="text-sm font-600 text-white leading-tight">{rol}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Linea del jugador si es Jugador */}
          {selectedRoles.includes('JUGADOR(A)') && (
            <div className="space-y-2 sm:col-span-2 animate-in fade-in slide-in-from-top-2">
              <label htmlFor="field_linea" className="text-sm font-500 text-white">
                Línea del Jugador <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <select
                  id="field_linea"
                  name="item_meta_linea"
                  required
                  defaultValue=""
                  className="w-full appearance-none rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="" disabled>Selecciona tu línea principal</option>
                  <option value="Oro">Línea de Oro / Tirador</option>
                  <option value="Experiencia">Línea de Experiencia / Combatiente</option>
                  <option value="Mid">Línea Media / Mago</option>
                  <option value="Jungla">Jungla / Asesino</option>
                  <option value="Roamer">Roamer / Tanque / Soporte</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACUERDO DE COMPROMISO */}
      <div className="space-y-6 pt-6">
        <div className="border-b border-border pb-3">
          <h3 className="font-display text-xl font-600 uppercase tracking-widest text-primary">
            ACUERDOS Y CONDICIONES
          </h3>
        </div>

        <div className="rounded-lg border border-border bg-background p-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p className="font-500 text-white">
            Mediante el envío de este registro, me comprometo formalmente a las siguientes condiciones para participar en los torneo, ligas y eventos de GMX Gaming:
          </p>
          <ul className="list-inside list-disc space-y-3">
            <li>
              Permanecer de manera activa en el equipo para el cual realizo este registro, durante toda la vigencia del acuerdo correspondiente.
            </li>
            <li>
              Entiendo que, en caso de incumplimiento intencional de mis obligaciones, consistente en la negativa a participar en las actividades de los Torneos, Ligas y Eventos organizados por GMX Gaming en los que participe el equipo —con la finalidad de perjudicar la participación del equipo o su estatus dentro de la organización y comunidad de GMX Gaming—, acepto que el Staff de GMX Gaming pueda imponerme, a su exclusiva discreción, un baneo temporal o permanente, según el análisis de mi caso realizado con el Manager del equipo.
            </li>
            <li>
              Entiendo que esta disposición busca garantizar la estabilidad y competitividad del equipo, protegiendo los intereses de GMX Gaming y del competitivo profesional que GMX Gaming representa.
            </li>
            <li>
              Entiendo que la única forma de disolver este acuerdo registrado, es mediante común acuerdo con el representante del equipo, y con el aviso correspondiente al Staff de GMX Gaming.
            </li>
          </ul>
        </div>
      </div>

      <div className="pt-8 text-center sm:text-left border-t border-border mt-8">
        <button
          type="submit"
          disabled={Boolean(dateError || (contractEndDate && contractEndDate <= todayStr))}
          className={cn(
            "group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden px-8 py-5 font-display text-[15px] font-600 uppercase tracking-[0.18em] text-white transition-colors duration-300 clip-corner sm:w-auto mt-4",
            dateError || (contractEndDate && contractEndDate <= todayStr)
              ? "bg-white/10 text-white/40 cursor-not-allowed opacity-60"
              : "bg-primary hover:bg-primary-dark cursor-pointer"
          )}
        >
          <span className="relative z-10 flex items-center gap-2">
            ACEPTAR ACUERDO Y ENVIAR AL MANAGER
          </span>
        </button>
      </div>
    </form>
  )
}
