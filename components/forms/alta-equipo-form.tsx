'use client'

import { useState } from 'react'
import { Upload, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react'
import { GmxButton } from '@/components/gmx-button'
import { PhoneInput } from '@/components/forms/phone-input'

export function AltaEquipoForm() {
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success'>('idle')

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

      {/* Hidden Fields for formidable form compatibility */}
      <input type="hidden" name="frm_action" value="create" />
      <input type="hidden" name="form_id" value="13" />
      <input type="hidden" name="frm_hide_fields_13" id="frm_hide_fields_13" value="" />
      <input type="hidden" name="form_key" value="altadeequipo" />
      <input type="hidden" name="item_meta[0]" value="" />
      <input type="hidden" id="frm_submit_entry_13" name="frm_submit_entry_13" value="059eb65444" />
      <input type="hidden" name="_wp_http_referer" value="/altadeequipo/" />
      <input type="hidden" name="item_meta[639]" value="1131" />
      <input
        type="hidden"
        name="frm_state"
        value="JoJeEFk1PyCCMVFC40ijfPfSyJ2zqkdASvTp2AO9sNW2iTH89KIwPLUTuHzoxVch"
      />
      <input
        type="hidden"
        name="item_key"
        value=""
      />

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
            </label>
            <input
              type="text"
              id="field_5d5a2"
              name="item_meta[622]"
              required
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Ej. Artaud Esports"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="field_s3a0m2" className="text-sm font-500 text-white">
              País del Equipo <span className="text-primary">*</span>
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
                <option value="Mexico">México</option>
                <option value="Colombia">Colombia</option>
                <option value="Estados Unidos">Estados Unidos</option>
                <option value="Ecuador">Ecuador</option>
                <option value="Venezuela">Venezuela</option>
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

        <div className="space-y-2">
          <label className="text-sm font-500 text-white">
            Logo del Equipo <span className="text-primary">*</span>
          </label>
          <div className="group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background px-6 py-10 transition-colors hover:border-primary hover:bg-primary/5">
            <Upload className="mb-4 h-10 w-10 text-muted-foreground transition-colors group-hover:text-primary" />
            <p className="text-center text-sm text-white">
              <span className="font-600 text-primary">Haz clic para cargar</span> o arrastra un archivo aquí
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Tamaño máximo del archivo: 268MB (JPG, PNG, GIF)</p>
            <input
              type="file"
              name="item_meta[624]"
              required
              accept="image/jpeg,image/png,image/gif,.jpg,.jpeg,.jpe,.png,.gif"
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <label className="text-sm font-500 text-white">
            Juegos en los que participa su Equipo (seleccione uno o ambos)
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="group relative flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-background p-4 transition-all hover:border-primary">
              <input
                type="checkbox"
                name="item_meta[633][]"
                value="HOK"
                className="h-5 w-5 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background"
              />
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-surface p-1">
                <img
                  src="https://i0.wp.com/gmxgaming.com/wp-content/uploads/2024/07/Honor-of-Kings-Icono-1.png?w=640&ssl=1"
                  alt="HOK"
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="font-display font-600 tracking-wider text-white">HOK</span>
            </label>

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
              <span className="font-display font-600 tracking-wider text-white">MLBB</span>
            </label>
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
              Seudónimo <span className="text-primary">*</span>
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
              Usuario de Discord <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              id="field_j8tvb2"
              name="item_meta[627]"
              required
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="usuario#1234"
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

      {/* Section 3: ACUERDO DE EXCLUSIVIDAD */}
      <div className="space-y-6 pt-6">
        <div className="border-b border-border pb-3">
          <h3 className="font-display text-xl font-600 uppercase tracking-widest text-primary">
            ACUERDO DE EXCLUSIVIDAD Y REGLAMENTO
          </h3>
        </div>

        <div className="rounded-lg border border-border bg-background p-6">
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

          <label className="flex cursor-pointer items-start gap-4 text-sm leading-relaxed text-muted-foreground transition-colors hover:text-white">
            <div className="pt-1">
              <input
                type="checkbox"
                name="item_meta[638][]"
                required
                value="Al marcar esta casilla, confirmo que he leído y estoy de acuerdo con los Términos y Condiciones del Acuerdo de Exclusividad de GMX Gaming, así como el Reglamento General Vigente del Competitivo Varonil, Mixto y Femenil de GMX Gaming, comprometiéndome a que mi organización, equipo(s), jugadores y yo mismo, lo acataremos sin reservas ni excepciones."
                className="h-5 w-5 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background"
              />
            </div>
            <span>
              Al marcar esta casilla, confirmo que he leído y estoy de acuerdo con los Términos y Condiciones del Acuerdo de Exclusividad de GMX Gaming, así como el Reglamento General Vigente del Competitivo Varonil, Mixto y Femenil de GMX Gaming, comprometiéndome a que mi organización, equipo(s), jugadores y yo mismo, lo acataremos sin reservas ni excepciones. <span className="text-primary">*</span>
            </span>
          </label>
        </div>
      </div>

      {/* CAMPOS DE GESTIÓN GMX (Hidden / Pre-filled) */}
      <div className="hidden">
        <select name="item_meta[631]" defaultValue="ACTIVO">
          <option value="ACTIVO">ACTIVO</option>
        </select>
        <input type="url" name="item_meta[632]" defaultValue="https://gmxgaming.com/" />
        <select name="item_meta[715]" defaultValue="NO">
          <option value="NO">NO</option>
        </select>
        {/* Anti-spam / Honeypot */}
        <input type="text" name="item_meta[903]" value="" className="sr-only" tabIndex={-1} autoComplete="off" />
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
