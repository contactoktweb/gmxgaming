'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { translateAuthError } from '@/lib/utils'

export type Role = 'admin_principal' | 'admin_secundario' | 'admin_visitante' | 'admin' | 'jugador' | 'user'

export interface User {
  id: string
  name: string
  nickname?: string
  email: string
  role: Role
  avatar?: string
  is_player?: boolean
  player_status?: string
  isAdmin?: boolean
  isAdminPrincipal?: boolean
  isAdminSecundario?: boolean
  isAdminVisitante?: boolean
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

    async function fetchProfile(authUser: any) {
      if (!mounted) return;

      const metadata = authUser.user_metadata || {}
      const googleName = metadata.full_name || metadata.name || authUser.email?.split('@')[0] || 'Usuario'
      const googleAvatar = metadata.avatar_url || metadata.picture || null

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        let activeProfile = profile

        // Si no existe el perfil en la base de datos, lo creamos automáticamente
        if (!profile) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .upsert({
              id: authUser.id,
              name: googleName,
              avatar_url: googleAvatar,
              role: 'user',
              is_player: false,
              player_status: 'none'
            })
            .select('*')
            .single()

          if (newProfile) {
            activeProfile = newProfile
          }
        } else if ((!profile.name && googleName) || (!profile.avatar_url && googleAvatar)) {
          // Si existe pero le falta nombre o avatar, completamos con Google
          const updates: Record<string, any> = {}
          if (!profile.name && googleName) updates.name = googleName
          if (!profile.avatar_url && googleAvatar) updates.avatar_url = googleAvatar

          const { data: updatedProfile } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', authUser.id)
            .select('*')
            .single()

          if (updatedProfile) {
            activeProfile = updatedProfile
          }
        }

        const dbRole = (activeProfile?.role || '').trim().toLowerCase()
        const isAdmPrincipal = dbRole === 'admin_principal' || dbRole === 'admin'
        const isAdmSecundario = dbRole === 'admin_secundario'
        const isAdmVisitante = dbRole === 'admin_visitante'
        const isAdm = isAdmPrincipal || isAdmSecundario || isAdmVisitante

        let userRole: Role = 'user'
        if (isAdmPrincipal) userRole = dbRole === 'admin' ? 'admin' : 'admin_principal'
        else if (isAdmSecundario) userRole = 'admin_secundario'
        else if (isAdmVisitante) userRole = 'admin_visitante'
        else if (activeProfile?.is_player) userRole = 'jugador'
        else userRole = (dbRole as Role) || 'user'

        if (mounted) {
          setUser({
            id: authUser.id,
            name: activeProfile?.name || googleName,
            nickname: activeProfile?.nickname || activeProfile?.game_nickname || '',
            email: authUser.email || '',
            role: userRole,
            avatar: activeProfile?.avatar_url || activeProfile?.avatar || googleAvatar || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg',
            is_player: activeProfile?.is_player || false,
            player_status: activeProfile?.player_status || 'none',
            isAdmin: isAdm,
            isAdminPrincipal: isAdmPrincipal,
            isAdminSecundario: isAdmSecundario,
            isAdminVisitante: isAdmVisitante
          })
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Error fetching/creating profile:', err)
        if (mounted) {
          // Fallback usando directamente datos de autenticación
          setUser({
            id: authUser.id,
            name: googleName,
            email: authUser.email || '',
            role: 'user',
            avatar: googleAvatar || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg',
            is_player: false,
            player_status: 'none',
            isAdmin: false,
            isAdminPrincipal: false,
            isAdminSecundario: false,
            isAdminVisitante: false
          })
          setIsLoading(false)
        }
      }
    }

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
    if (!password) return { success: false, error: 'Contraseña requerida' };

    setIsLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setIsLoading(false)
      return { success: false, error: translateAuthError(error.message) }
    }

    return { success: true }
  }

  const register = async (email: string, password?: string) => {
    if (!password) return { success: false, error: 'Contraseña requerida' }

    const cleanEmail = email.trim().toLowerCase()
    setIsLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/confirm`,
      },
    })

    if (error) {
      setIsLoading(false)
      return { success: false, error: translateAuthError(error) }
    }

    // Si Supabase tiene protección de enumeración activa, retorna data.user con identities: []
    // cuando el usuario ya existe en auth.users, sin arrojar error en el signUp.
    if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
      setIsLoading(false)
      return {
        success: false,
        error: 'Este correo electrónico ya está registrado. Por favor inicia sesión o recupera tu contraseña.'
      }
    }

    // Si Supabase ya devolvió sesión (email confirmations OFF), usar directamente
    if (data.session) {
      return { success: true }
    }

    // Si requiere confirmación de email, intentamos auto-login
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (loginError) {
      setIsLoading(false)
      return { success: true, emailNotConfirmed: true } as any
    }

    return { success: true }
  }

  const logout = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setIsLoading(false)
    
    if (pathname === '/micuenta' || pathname.startsWith('/dashboard') || pathname.startsWith('/administracion')) {
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
