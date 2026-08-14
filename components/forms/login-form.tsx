'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { GmxButton } from '@/components/gmx-button'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/utils/supabase/client'

function LoginFormContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      if (errorParam === 'auth_callback_failed') {
        setError('No se pudo completar el inicio de sesión con Google. Por favor intenta de nuevo.')
      } else {
        setError(decodeURIComponent(errorParam))
      }
    }
  }, [searchParams])

  const handleGoogleLogin = async () => {
    setError('')
    setIsGoogleLoading(true)
    try {
      const redirectUrl = `${window.location.origin}/auth/callback?next=/micuenta`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google')
      setIsGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const { success, error: loginError } = await login(email, password)
    
    if (success) {
      router.push('/micuenta')
    } else {
      if (loginError?.includes('Email not confirmed')) {
        setError('Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.')
      } else {
        setError(loginError || 'Credenciales inválidas. Por favor intenta de nuevo.')
      }
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-md space-y-8 rounded-xl border border-border bg-surface p-8 shadow-2xl lg:p-10"
    >
      <div className="text-center">
        <h2 className="font-display text-3xl font-700 uppercase tracking-tight text-white">
          INICIAR SESIÓN
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Ingresa a tu cuenta de GMX Gaming.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-500 text-white">
            Correo Electrónico <span className="text-primary">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-500 text-white">
            Contraseña <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-4 py-3 pr-12 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div className="flex justify-end pt-1">
            <Link href="/login/olvide-password" className="text-xs text-primary hover:text-primary-dark transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 font-500 text-center pt-2">
          {error}
        </p>
      )}

      <div className="pt-4 text-center space-y-4">
        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden bg-primary px-8 py-4 font-display text-[15px] font-600 uppercase tracking-[0.18em] text-white transition-colors duration-300 clip-corner hover:bg-primary-dark disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center gap-2">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'INGRESAR'}
          </span>
        </button>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase tracking-wider">O</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <button
          type="button"
          disabled={isGoogleLoading || isLoading}
          onClick={handleGoogleLogin}
          className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden bg-white px-8 py-4 font-display text-[14px] font-600 uppercase tracking-[0.15em] text-black transition-colors duration-300 clip-corner hover:bg-gray-100 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-black" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span className="relative z-10 flex items-center gap-2">
            {isGoogleLoading ? 'CONECTANDO CON GOOGLE...' : 'CONTINUAR CON GOOGLE'}
          </span>
        </button>
      </div>
      
      <div className="text-center mt-4">
        <Link href="/crear-cuenta" className="text-sm text-muted-foreground hover:text-primary transition-colors">
          ¿No tienes una cuenta? Regístrate aquí.
        </Link>
      </div>
    </form>
  )
}

export function LoginForm() {
  return (
    <Suspense fallback={
      <div className="mx-auto w-full max-w-md p-8 text-center text-white">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  )
}
