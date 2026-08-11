'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export type Role = 'admin' | 'jugador'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  is_player?: boolean
  player_status?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password?: string) => Promise<{success: boolean, error?: string}>
  register: (email: string, password?: string) => Promise<{success: boolean, error?: string}>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        await fetchProfile(session.user)
      } else {
        if (mounted) {
          setUser(null)
          setIsLoading(false)
        }
      }
    }

    async function fetchProfile(authUser: any) {
      if (!mounted) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (mounted) {
        setUser({
          id: authUser.id,
          name: profile?.name || authUser.email?.split('@')[0] || 'Usuario',
          email: authUser.email || '',
          role: profile?.role === 'admin' ? 'admin' : 'jugador',
          avatar: profile?.avatar || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg',
          is_player: profile?.is_player || false,
          player_status: profile?.player_status || 'none'
        })
        setIsLoading(false)
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchProfile(session.user)
        } else {
          setUser(null)
          setIsLoading(false)
        }
      }
    )

    return () => {
      mounted = false;
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password?: string) => {
    // If no password provided (shouldn't happen with real form, but for typing), fail
    if (!password) return { success: false, error: 'Contraseña requerida' };

    setIsLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setIsLoading(false)
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  const register = async (email: string, password?: string) => {
    if (!password) return { success: false, error: 'Contraseña requerida' }

    setIsLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setIsLoading(false)
      return { success: false, error: error.message }
    }

    // Attempt to automatically log in the user after registration
    // This depends on Supabase settings (whether email confirmation is required)
    if (data.session) {
      return { success: true }
    } else {
      // If email confirmation is required, they won't have a session right away
      setIsLoading(false)
      return { success: true }
    }
  }

  const logout = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setIsLoading(false)
    
    if (pathname === '/micuenta' || pathname.startsWith('/dashboard')) {
      router.push('/login')
    } else {
      router.refresh()
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
