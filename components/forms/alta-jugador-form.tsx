'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Upload, Image as ImageIcon, FileText } from 'lucide-react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { GmxButton } from '@/components/gmx-button'
import { PhoneInput } from '@/components/forms/phone-input'
import { FileUpload } from '@/components/forms/file-upload'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'

function FormContent() {
  const [isStaff, setIsStaff] = useState(false)
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const searchParams = useSearchParams()
  const defaultEmail = searchParams.get('email') || ''
  const { user } = useAuth()
  const supabase = createClient()

  const COUNTRIES = [
    'México', 'Colombia', 'Argentina', 'Perú', 'Venezuela', 'Chile', 
    'Ecuador', 'Guatemala', 'Cuba', 'Bolivia', 'República Dominicana',
    'Honduras', 'El Salvador', 'Paraguay', 'Nicaragua', 'Costa Rica',
    'Panamá', 'Puerto Rico', 'Uruguay', 'España', 'Estados Unidos'
  ]

  const TEAMS = [
    '- NINGUNO -', 'Aftur Bellum', 'Artaud', 'Døpamine', 'EVEN FLOW', 
    'EXCIDIUM', 'FIMTHYAR AGRAVVE', 'GMX ESPORTS', 'Los Zoldycks', 
    'meta Foreigner', 'NAVY SEALS', 'NECTAR E-SPORTS', 'NEGATIVE ESPORTS', 
    'O7EN E-sport', 'Otsutsüki', 'Requiem E-Sports', 'Sinergy', 
    'TEAM QUETZAL KING', 'THE HUNGRY KINGS', 'U2 eSPORT', 'U2 STAR', 'VOID ESPORTS MX'
  ]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormStatus('loading')
    
    const form = e.currentTarget
    const formData = new FormData(form)
    
    const payload = {
      nombreCompleto: formData.get('item_meta[674][first]') + ' ' + formData.get('item_meta[674][last]'),
      genero: formData.get('item_meta[783]'),
      seudonimo: formData.get('item_meta[679]'),
      fechaNacimiento: formData.get('item_meta[675]'),
      paisNacimiento: formData.get('item_meta[677]'),
      paisResidencia: formData.get('item_meta[722]'),
      discord: formData.get('item_meta[684]'),
      correo: formData.get('item_meta[676]'),
      telefono: formData.get('item_meta[685]'),
      uid: formData.get('item_meta[698]'),
      idJuego: formData.get('item_meta[697]'),
      serverJuego: formData.get('item_meta[784]'),
      equipo: formData.get('item_meta[672]'),
      rol: formData.get('item_meta[700]'),
      esStaff: isStaff ? 'SÍ' : 'NO',
      actividades: formData.getAll('item_meta[739][]'),
      aeropuerto: formData.get('item_meta[781]'),
      fotografia: 'https://placehold.co/400x400/png?text=FOTO+JUGADOR',
      documentoIdentidad: 'https://placehold.co/600x400/png?text=INE',
    }

    const { error } = await supabase.from('validations').insert({
      type: 'jugador',
      target_name: `${payload.seudonimo} - ${payload.equipo}`,
      submitted_by: user?.name || payload.correo,
      status: 'pending',
      details: payload
    })
    
    if (!error) {
      setFormStatus('success')
    } else {
      setFormStatus('idle')
      alert('Hubo un error al enviar tu solicitud. Intenta de nuevo.')
    }
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
              El género que elijas debe estar avalado por un documento oficial expedido por tu país.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="field_hs7a9" className="text-sm font-500 text-white">
              Seudónimo (En competitivo) <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              id="field_hs7a9"
              name="item_meta[679]"
              required
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
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
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
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
                {COUNTRIES.map(c => <option key={`res-${c}`} value={c}>{c}</option>)}
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
              Discord ID <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              id="field_dznon"
              name="item_meta[684]"
              required
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="usuario#1234"
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
              Si no cuentas con una fotografia con uniforme de Esports de tu equipo Profesional, puedes subir tu foto utilizando una playera de color negra.
            </p>
            <FileUpload name="item_meta[687]" required />
            
            <div className="overflow-hidden rounded-lg border border-border">
              <img src="https://i0.wp.com/i.postimg.cc/kGVR06Qk/Ejemplo-Fotografia.png?w=640&ssl=1" alt="Ejemplo Fotografia" className="w-full object-cover" />
            </div>
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
              Toma una foto clara de la parte frontal de tu INE o sube un escaneo. Debe estar vigente.
            </p>
            <FileUpload name="item_meta[750]" icon={<FileText className="h-10 w-10" />} />

            <div className="overflow-hidden rounded-lg border border-border">
              <img src="https://i0.wp.com/i.postimg.cc/x8pngz3W/Ejemplo-INE.png?w=640&ssl=1" alt="Ejemplo INE" className="w-full object-cover" />
            </div>
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
          <div className="space-y-2">
            <label htmlFor="field_yg8sn" className="text-sm font-500 text-white">
              UID Honor of Kings
            </label>
            <input
              type="text"
              id="field_yg8sn"
              name="item_meta[698]"
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

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
        </div>
      </div>

      {/* Section 4: INFORMACION ESPORTS */}
      <div className="space-y-6 pt-6">
        <div className="border-b border-border pb-3">
          <h3 className="font-display text-xl font-600 uppercase tracking-widest text-primary">
            INFORMACIÓN ESPORTS
          </h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="field_sjjsv" className="text-sm font-500 text-white">
              Equipo <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <select
                id="field_sjjsv"
                name="item_meta[672]"
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

          <div className="space-y-2">
            <label htmlFor="field_oac08" className="text-sm font-500 text-white">
              Rol Jugado <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <select
                id="field_oac08"
                name="item_meta[700]"
                required
                defaultValue="LINEA DE ORO / TIRADOR"
                className="w-full appearance-none rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="LINEA DE ORO / TIRADOR">LÍNEA DE ORO / TIRADOR</option>
                <option value="LINEA DE EXPERIENCIA / COMBATIENTE">LÍNEA DE EXPERIENCIA / COMBATIENTE</option>
                <option value="LINEA MEDIA / MAGO">LÍNEA MEDIA / MAGO</option>
                <option value="JUNGLA / ASESINO">JUNGLA / ASESINO</option>
                <option value="TANQUE / SOPORTE">TANQUE / SOPORTE</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:col-span-2">
            <label className="text-sm font-500 text-white">
              ¿Eres Staff del Equipo también?
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isStaff}
                onClick={() => setIsStaff(!isStaff)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  isStaff ? "bg-primary" : "bg-surface border border-border"
                )}
              >
                <span className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  isStaff ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
              <span className="text-sm font-600 text-white">{isStaff ? 'SÍ' : 'NO'}</span>
              <input type="checkbox" name="item_meta[737][]" value="SI" checked={isStaff} className="sr-only" readOnly />
            </div>
          </div>

          {isStaff && (
            <div className="space-y-4 sm:col-span-2 rounded-lg border border-border bg-background p-6">
              <label className="text-sm font-500 text-white">
                Actividades desempeñadas en el Equipo
              </label>
              <div className="flex flex-wrap gap-4">
                {['JUGADOR', 'MANAGER', 'COACH', 'ANALISTA', 'PSICOLOGO DEPORTIVO'].map(act => (
                  <label key={act} className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      name="item_meta[739][]"
                      value={act}
                      defaultChecked={act === 'JUGADOR'}
                      className="h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background"
                    />
                    {act}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 5: PASAPORTE E INFORMACION DE VIAJE */}
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
              Sube una imagen de tu pasaporte en caso de clasificar a un evento internacional. Si no tienes uno, sube la cita generada.
            </p>
            <FileUpload name="item_meta[678]" />
            <div className="overflow-hidden rounded-lg border border-border">
              <img src="https://i0.wp.com/i.postimg.cc/g0pQS3VB/Ejemplos-Pasaporte.png?w=640&ssl=1" alt="Ejemplos Pasaporte" className="w-full object-cover" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="field_xbhly" className="text-sm font-500 text-white">
                Aeropuerto más cercano
              </label>
              <div className="relative">
                <select
                  id="field_xbhly"
                  name="item_meta[781]"
                  defaultValue="MÉXICO - CIUDAD DE MEXICO - AEROPUERTO INTERNACIONAL DE LA CIUDAD DE MÉXICO, S.A. DE C.V. (AICM)"
                  className="w-full appearance-none rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="MÉXICO - CIUDAD DE MEXICO - AEROPUERTO INTERNACIONAL DE LA CIUDAD DE MÉXICO, S.A. DE C.V. (AICM)">AICM (CDMX) - México</option>
                  <option value="CANCÚN - QUINTANA ROO - AEROPUERTO DE CANCÚN, S.A. DE C.V.">Cancún - México</option>
                  <option value="MONTERREY - NUEVO LEÓN - AEROPUERTO DE MONTERREY">Monterrey - México</option>
                  <option value="GUADALAJARA - JALISCO - AEROPUERTO DE GUADALAJARA">Guadalajara - México</option>
                  <option value="BOGOTÁ - EL DORADO">El Dorado (Bogotá) - Colombia</option>
                  <option value="MEDELLÍN - JOSÉ MARÍA CÓRDOVA">José María Córdova (Medellín) - Colombia</option>
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
          className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden bg-primary px-8 py-5 font-display text-[15px] font-600 uppercase tracking-[0.18em] text-white transition-colors duration-300 clip-corner hover:bg-primary-dark sm:w-auto mt-4"
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
