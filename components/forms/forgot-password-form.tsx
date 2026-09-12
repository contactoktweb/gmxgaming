'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, Mail, KeyRound, Lock, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { GmxButton } from '@/components/gmx-button'
import { createClient } from '@/utils/supabase/client'
import { translateAuthError } from '@/lib/utils'
import { toast } from 'sonner'

function ForgotPasswordContent() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [hasActiveSession, setHasActiveSession] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Detectar si el usuario ya llegó con sesión activa (por enlace de correo) o con email en la URL
  useEffect(() => {
    async function checkExistingSession() {
      const emailParam = searchParams.get('email')
      if (emailParam) {
        setEmail(emailParam)
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setHasActiveSession(true)
        if (session.user.email) {
          setEmail(session.user.email)
        }
        setStep(2)
        setInfoMessage('Sesión de recuperación validada. Ingresa tu nueva contraseña a continuación.')
      }
    }
    checkExistingSession()
  }, [searchParams, supabase])

  // Paso 1: Solicitar correo de recuperación a Supabase
  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setInfoMessage('')
    setIsLoading(true)

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      setError('Por favor ingresa tu correo electrónico.')
      setIsLoading(false)
      return
    }

    try {
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const redirectUrl = `${siteUrl}/auth/confirm?next=/login/olvide-password`

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl
      })

      if (resetError) {
        throw resetError
      }

      setStep(2)
      setInfoMessage(`Hemos enviado un enlace y código de recuperación a ${cleanEmail}. Revisa tu bandeja de entrada o spam.`)
      toast.success('Correo de recuperación enviado exitosamente.')
    } catch (err: any) {
      console.error('Error al enviar correo de recuperación:', err)
      setError(translateAuthError(err) || 'No se pudo enviar el correo de recuperación. Verifica el correo e intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  // Paso 2: Verificar código OTP o aplicar nueva contraseña en Supabase
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.')
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifícalas.')
      setIsLoading(false)
      return
    }

    try {
      const cleanEmail = email.trim().toLowerCase()

      // Si no hay sesión activa previa y el usuario ingresó un código de verificación
      if (!hasActiveSession && code.trim()) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: code.trim(),
          type: 'recovery'
        })

        if (otpError) {
          throw new Error('El código de verificación es inválido o ha expirado. Solicita uno nuevo.')
        }
      }

      // Actualizar la contraseña en Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        throw updateError
      }

      setStep(3)
      toast.success('¡Contraseña actualizada exitosamente!')
    } catch (err: any) {
      console.error('Error al restablecer contraseña:', err)
      setError(translateAuthError(err?.message || err) || 'Error al actualizar la contraseña. Por favor intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  // Paso 3: Pantalla de Éxito
  if (step === 3) {
    return (
      <div className="mx-auto w-full max-w-md space-y-8 rounded-xl border border-border bg-surface p-8 shadow-2xl lg:p-10 text-center animate-in fade-in zoom-in duration-500">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 mx-auto mb-6 border border-emerald-500/20">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="font-display text-3xl font-700 uppercase tracking-tight text-white mb-2">
          ¡CONTRASEÑA RESTABLECIDA!
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          Tu contraseña ha sido actualizada con éxito. Ya puedes acceder con tus nuevas credenciales.
        </p>
        <GmxButton href="/login" className="w-full">
          IR A INICIAR SESIÓN
        </GmxButton>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-surface shadow-2xl overflow-hidden relative">
      <div className="p-8 lg:p-10 space-y-6">
        <div className="text-center relative">
          <Link 
            href="/login" 
            className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors p-1"
            title="Volver al Login"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white pl-6">
            RECUPERAR CONTRASEÑA
          </h2>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 flex items-start gap-2.5 text-left">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-400 font-500 leading-relaxed">
              {error}
            </p>
          </div>
        )}

        {infoMessage && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-start gap-2.5 text-left">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-300 font-500 leading-relaxed">
              {infoMessage}
            </p>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Ingresa el correo electrónico asociado a tu cuenta de GMX Gaming. Te enviaremos un enlace y código de verificación para restablecer tu contraseña.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-600 uppercase tracking-wider text-muted-foreground block">
                Correo Electrónico <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ejemplo@correo.com"
                  className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden bg-primary px-8 py-3.5 font-display text-sm font-700 uppercase tracking-wider text-white transition-colors duration-300 rounded-lg hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>ENVIANDO...</span>
                  </>
                ) : (
                  <span>ENVIAR CORREO DE RECUPERACIÓN</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              {hasActiveSession ? (
                <>Sesión de recuperación activa para <strong className="text-white">{email}</strong>. Define tu nueva contraseña.</>
              ) : (
                <>Si recibiste un código de 6 dígitos en tu correo <strong className="text-white">{email}</strong>, ingrésalo abajo junto a tu nueva contraseña. También puedes simplemente hacer clic en el enlace de tu correo.</>
              )}
            </p>

            {!hasActiveSession && (
              <div className="space-y-1.5">
                <label htmlFor="code" className="text-xs font-600 uppercase tracking-wider text-muted-foreground block">
                  Código de 6 dígitos <span className="text-muted-foreground/60">(opcional si abres el enlace)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ej: 123456"
                    className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono tracking-widest"
                  />
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="newPassword" className="text-xs font-600 uppercase tracking-wider text-muted-foreground block">
                Nueva Contraseña <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-10 text-sm text-white placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-600 uppercase tracking-wider text-muted-foreground block">
                Confirmar Nueva Contraseña <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repite la contraseña"
                  className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-10 text-sm text-white placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 text-center space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden bg-primary px-8 py-3.5 font-display text-sm font-700 uppercase tracking-wider text-white transition-colors duration-300 rounded-lg hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>GUARDANDO...</span>
                  </>
                ) : (
                  <span>ACTUALIZAR CONTRASEÑA</span>
                )}
              </button>

              <button 
                type="button" 
                onClick={() => {
                  setStep(1)
                  setError('')
                  setInfoMessage('')
                }}
                className="text-xs text-muted-foreground hover:text-white transition-colors block mx-auto pt-1"
              >
                ¿No te llegó el correo? Reintentar con otro email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export function ForgotPasswordForm() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  )
}
