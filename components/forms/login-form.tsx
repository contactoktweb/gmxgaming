'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { GmxButton } from '@/components/gmx-button'
import { useAuth } from '@/lib/auth-context'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const success = await login(email)
    
    if (success) {
      router.push('/micuenta')
    } else {
      setError('Credenciales inválidas. Por favor intenta de nuevo.')
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
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex justify-end pt-1">
            <Link href="/login/olvide-password" className="text-xs text-primary hover:text-primary-dark transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 font-500 text-center">
          {error}
        </p>
      )}

      <div className="pt-4 text-center">
        <button
          type="submit"
          disabled={isLoading}
          className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden bg-primary px-8 py-4 font-display text-[15px] font-600 uppercase tracking-[0.18em] text-white transition-colors duration-300 clip-corner hover:bg-primary-dark disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center gap-2">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'INGRESAR'}
          </span>
        </button>
      </div>
      
      <div className="text-center mt-4">
        <a href="/registro/alta-de-jugador" className="text-sm text-muted-foreground hover:text-primary transition-colors">
          ¿No tienes una cuenta? Regístrate aquí.
        </a>
      </div>
    </form>
  )
}
