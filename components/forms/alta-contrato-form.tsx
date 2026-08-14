'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, HelpCircle, AlertTriangle } from 'lucide-react'
import { GmxButton } from '@/components/gmx-button'
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

export function AltaContratoForm() {
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'blocked'>('idle')
  const { user } = useAuth()
  const supabase = createClient()
  
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['JUGADOR(A)'])
  const [playerGender, setPlayerGender] = useState<string>('Masculino')
  const [blockMessage, setBlockMessage] = useState('')
  const [teams, setTeams] = useState<any[]>([])

  useEffect(() => {
    async function init() {
      if (!user) {
        setBlockMessage('Debes iniciar sesión para poder registrar un contrato.')
        setFormStatus('blocked')
        return
      }

      // Validar si el usuario es jugador profesional aprobado
      const { data: profile } = await supabase
        .from('profiles')
        .select('gender, is_player, player_status')
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
        return
      }

      if (profile && profile.gender) {
        setPlayerGender(profile.gender)
      }

      // Obtener equipos activos y aprobados (excluyendo los que el usuario lidera)
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name, status, manager_id')
        .in('status', ['active', 'approved', 'pending'])

      if (teamsData) {
        // Un líder de equipo no puede solicitar contrato a su propio equipo
        const availableTeams = teamsData.filter(t => t.manager_id !== user.id)
        setTeams(availableTeams)
      }

      // Obtener contratos activos o pendientes
      const { data: contracts } = await supabase.from('contracts').select('*, teams(name)').eq('player_id', user.id).in('status', ['active', 'pending_manager'])
      
      if (contracts && contracts.length > 0) {
        if (profile?.gender === 'Masculino' || !profile?.gender) {
          setBlockMessage('Ya tienes un contrato activo o en proceso. Los jugadores de la división varonil/mixta solo pueden tener 1 contrato activo a la vez.')
          setFormStatus('blocked')
        } else if (profile?.gender === 'Femenino') {
          // Check divisiones
          const hasVaronil = contracts.some((c: any) => c.teams?.type === 'Varonil / Mixto')
          const hasFemenil = contracts.some((c: any) => c.teams?.type === 'Femenil')
          
          if (hasVaronil && hasFemenil) {
            setBlockMessage('Has alcanzado el límite máximo de contratos (1 Femenil y 1 Varonil/Mixto).')
            setFormStatus('blocked')
          }
        }
      }
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selectedRoles.length === 0) {
      alert('Debes seleccionar al menos un rol en el equipo.')
      return
    }

    setFormStatus('loading')
    
    const form = e.currentTarget
    const formData = new FormData(form)

    const teamId = formData.get('item_meta[879]') as string
    
    // Validar que no sea el líder del equipo
    const selectedTeam = teams.find(t => t.id === teamId)
    if (selectedTeam && selectedTeam.manager_id === user?.id) {
      setFormStatus('idle')
      alert('No puedes solicitar un contrato hacia tu propio equipo siendo el líder.')
      return
    }

    // Add the specific lane role if they selected player
    const rolesToSave = [...selectedRoles]
    const linea = formData.get('item_meta_linea')
    if (selectedRoles.includes('JUGADOR(A)') && linea) {
      rolesToSave.push(`Línea: ${linea}`)
    }

    const payload = {
      player_id: user?.id,
      team_id: teamId,
      roles: rolesToSave,
      end_date: formData.get('item_meta[882]'),
      status: 'pending_manager'
    }

    const { error } = await supabase.from('contracts').insert(payload)

    if (!error) {
      setFormStatus('success')
    } else {
      setFormStatus('idle')
      alert('Error al enviar el contrato.')
      console.error(error)
    }
  }

  if (formStatus === 'blocked') {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-surface p-12 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="font-display text-3xl font-700 uppercase tracking-tight text-white mb-4">
          LÍMITE DE CONTRATOS ALCANZADO
        </h2>
        <p className="text-muted-foreground mb-8">
          {blockMessage}
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
      className="mx-auto w-full max-w-4xl space-y-12 rounded-xl border border-border bg-surface p-8 shadow-2xl lg:p-12 relative overflow-hidden"
    >
      {formStatus === 'loading' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-surface/95 backdrop-blur-sm animate-in fade-in duration-300">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 font-display text-lg font-600 uppercase tracking-widest text-white">
            ENVIANDO ACUERDO...
          </p>
        </div>
      )}

      {formStatus === 'success' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-surface animate-in fade-in duration-500">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="font-display text-3xl font-700 uppercase tracking-tight text-white mb-2 text-center">
            ACUERDO ENVIADO AL MANAGER
          </h2>
          <p className="text-muted-foreground text-center max-w-md px-4 mb-8">
            Tu contrato ha sido registrado correctamente y se encuentra pendiente de aprobación. El Manager del equipo deberá revisarlo y aceptarlo en su panel de control para que sea válido.
          </p>
          <GmxButton href="/micuenta" className="px-8">
            IR A MI CUENTA
          </GmxButton>
        </div>
      )}

      <div className="text-center">
        <h2 className="font-display text-4xl font-700 uppercase tracking-tight text-white sm:text-5xl">
          REGISTRO DE CONTRATO
        </h2>
        <p className="mt-3 text-muted-foreground">
          Formaliza tu vinculación y acuerdo con tu equipo en la plataforma oficial de GMX Gaming.
        </p>
      </div>

      <div className="space-y-8">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Equipo */}
          <div className="space-y-2">
            <label htmlFor="field_8bh2e" className="text-sm font-500 text-white">
              Equipo <span className="text-primary">*</span>
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
                      {t.name}{t.status === 'pending' ? ' (Pendiente de aprobación)' : t.status === 'active' ? ' (Activo)' : ''}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No hay equipos disponibles</option>
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
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
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
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
                  selectedRoles.includes(rol) ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/50"
                )}>
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(rol)}
                    onChange={() => handleRoleToggle(rol)}
                    className="h-5 w-5 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background"
                  />
                  <span className="text-sm font-600 text-white">{rol}</span>
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
          className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden bg-primary px-8 py-5 font-display text-[15px] font-600 uppercase tracking-[0.18em] text-white transition-colors duration-300 clip-corner hover:bg-primary-dark sm:w-auto mt-4"
        >
          <span className="relative z-10 flex items-center gap-2">
            ACEPTAR ACUERDO Y ENVIAR AL MANAGER
          </span>
        </button>
      </div>
    </form>
  )
}
