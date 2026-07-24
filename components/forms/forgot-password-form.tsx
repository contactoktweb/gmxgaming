'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, Mail, KeyRound, Lock, CheckCircle2 } from 'lucide-react'
import { GmxButton } from '@/components/gmx-button'

export function ForgotPasswordForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSendCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate sending code
    setTimeout(() => {
      setIsLoading(false)
      setStep(2)
    }, 1500)
  }

  const handleResetPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate verifying code and changing password
    setTimeout(() => {
      setIsLoading(false)
      setStep(3)
    }, 1500)
  }

  if (step === 3) {
    return (
      <div className="mx-auto w-full max-w-md space-y-8 rounded-xl border border-border bg-surface p-8 shadow-2xl lg:p-10 text-center animate-in fade-in zoom-in duration-500">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="font-display text-3xl font-700 uppercase tracking-tight text-white mb-2">
          ¡CONTRASEÑA RESTABLECIDA!
        </h2>
        <p className="text-muted-foreground mb-8">
          Tu contraseña ha sido actualizada exitosamente. Ya puedes ingresar a tu cuenta con tu nueva contraseña.
        </p>
        <GmxButton href="/login" className="w-full">
          IR AL LOGIN
        </GmxButton>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-surface shadow-2xl overflow-hidden relative">
      <div className="p-8 lg:p-10 space-y-8">
        <div className="text-center relative">
          <Link href="/login" className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white pl-8">
            RECUPERAR CONTRASEÑA
          </h2>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <p className="text-sm text-muted-foreground text-center">
              Ingresa tu correo electrónico y te enviaremos un código de verificación para restablecer tu contraseña.
            </p>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-500 text-white">
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
                  className="w-full rounded-md border border-border bg-background py-3 pl-10 pr-4 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden bg-primary px-8 py-4 font-display text-[15px] font-600 uppercase tracking-[0.18em] text-white transition-colors duration-300 clip-corner hover:bg-primary-dark disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'ENVIAR CÓDIGO'}
                </span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <p className="text-sm text-muted-foreground text-center">
              Hemos enviado un código a <strong>{email}</strong>. Ingresa el código y tu nueva contraseña.
            </p>

            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-500 text-white">
                Código de Verificación <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  placeholder="000000"
                  className="w-full rounded-md border border-border bg-background py-3 pl-10 pr-4 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary tracking-widest"
                />
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-500 text-white">
                Nueva Contraseña <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-md border border-border bg-background py-3 pl-10 pr-4 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden bg-primary px-8 py-4 font-display text-[15px] font-600 uppercase tracking-[0.18em] text-white transition-colors duration-300 clip-corner hover:bg-primary-dark disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'RESTABLECER CONTRASEÑA'}
                </span>
              </button>
            </div>
            
            <div className="text-center pt-2">
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="text-xs text-muted-foreground hover:text-white transition-colors"
              >
                Cambiar correo electrónico
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
