'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { GmxButton } from '@/components/gmx-button'

export function AltaContratoForm() {
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const TEAMS = [
    '- NINGUNO -', 'Aftur Bellum', 'Artaud', 'Døpamine', 'EVEN FLOW', 
    'EXCIDIUM', 'FIMTHYAR AGRAVVE', 'GMX ESPORTS', 'Los Zoldycks', 
    'meta Foreigner', 'NAVY SEALS', 'NECTAR E-SPORTS', 'NEGATIVE ESPORTS', 
    'O7EN E-sport', 'Otsutsüki', 'Requiem E-Sports', 'Sinergy', 
    'TEAM QUETZAL KING', 'THE HUNGRY KINGS', 'U2 eSPORT', 'U2 STAR', 'VOID ESPORTS MX'
  ]

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormStatus('loading')
    
    // Simulate API call
    setTimeout(() => {
      setFormStatus('success')
    }, 2000)
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
            ACUERDO ENVIADO EXITOSAMENTE
          </h2>
          <p className="text-muted-foreground text-center max-w-md px-4 mb-8">
            Tu contrato ha sido registrado correctamente. Nuestro equipo revisará la solicitud y se pondrá en contacto contigo a través de Discord o correo electrónico.
          </p>
          <GmxButton href="/micuenta" className="px-8">
            IR A MI CUENTA
          </GmxButton>
        </div>
      )}


      {/* Hidden Fields */}
      <input type="hidden" name="frm_action" value="create" />
      <input type="hidden" name="form_id" value="27" />
      <input type="hidden" name="frm_hide_fields_27" id="frm_hide_fields_27" value="" />
      <input type="hidden" name="form_key" value="altacontrato" />
      <input type="hidden" name="item_meta[0]" value="" />
      <input type="hidden" id="frm_submit_entry_27" name="frm_submit_entry_27" value="059eb65444" />
      <input type="hidden" name="_wp_http_referer" value="/altadecontrato/" />
      <input type="hidden" name="item_meta[877]" value="1131" />
      <input type="hidden" name="item_key" value="" />
      <input type="text" name="item_meta[903]" value="" className="sr-only" tabIndex={-1} autoComplete="off" />
      <input name="frm_state" type="hidden" value="JoJeEFk1PyCCMVFC40ijfDzSooa+d1TxigOeFixwCzW2iTH89KIwPLUTuHzoxVch" />

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
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
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
              Fecha de Término del Contrato <span className="text-primary">*</span>
            </label>
            <input
              type="date"
              id="field_bgj19"
              name="item_meta[882]"
              required
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Jugador */}
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="field_vk1mg" className="text-sm font-500 text-white">
              Jugador <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <select
                id="field_vk1mg"
                name="item_meta[888][]"
                required
                defaultValue=""
                className="w-full appearance-none rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="" disabled>Selecciona tu Nombre de Jugador</option>
                {/* Dynamically populated by WP usually, we provide a fallback option or leave it empty so they have to be logged in */}
                <option value="ID_JUGADOR_TEMP">Mi Jugador (Demo)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Selecciona tu Nombre de Jugador para validar tu acuerdo. Si tu nombre de Jugador no aparece aquí, significa que no te has dado de alta aún como Jugador, y no podrás registrar tu contrato hasta que realices ese paso.
            </p>
          </div>

          {/* Roles en el Equipo */}
          <div className="space-y-4 sm:col-span-2">
            <label className="text-sm font-500 text-white">
              Roles en el Equipo <span className="text-primary">*</span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {['JUGADOR(A)', 'COACH', 'ANALISTA', 'PSICOLOGO DEPORTIVO'].map((rol, i) => (
                <label key={rol} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary">
                  <input
                    type="checkbox"
                    name="item_meta[902][]"
                    value={rol}
                    defaultChecked={i === 0}
                    className="h-5 w-5 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background"
                  />
                  <span className="text-sm font-600 text-white">{rol}</span>
                </label>
              ))}
            </div>
          </div>
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
            ACEPTAR ACUERDO Y ENVIAR
          </span>
        </button>
      </div>
    </form>
  )
}
