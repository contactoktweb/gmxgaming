'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export type Role = 'admin' | 'jugador'

export interface User {
  name: string
  email: string
  role: Role
  avatar?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check local storage for session on mount
    const storedUser = localStorage.getItem('gmx_session')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string) => {
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 800))

    let loggedInUser: User | null = null

    if (email.toLowerCase() === 'admin@gmx.com') {
      loggedInUser = {
        name: 'Admin GMX',
        email: 'admin@gmx.com',
        role: 'admin',
        avatar: 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'
      }
    } else if (email.toLowerCase() === 'jugador@gmx.com') {
      loggedInUser = {
        name: 'Jugador',
        email: 'jugador@gmx.com',
        role: 'jugador',
        avatar: 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'
      }
    } else {
      // By default, let any email login as jugador for demo purposes if not strictly admin
      loggedInUser = {
        name: email.split('@')[0],
        email,
        role: 'jugador',
        avatar: 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'
      }
    }

    if (loggedInUser) {
      setUser(loggedInUser)
      localStorage.setItem('gmx_session', JSON.stringify(loggedInUser))
      return true
    }

    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('gmx_session')
    
    // Redirect to login if on a protected route
    if (pathname === '/micuenta') {
      router.push('/login')
    } else {
      router.refresh()
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
