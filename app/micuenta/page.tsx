'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Loader2, ShieldCheck, ScrollText } from 'lucide-react'
import { UserProfile } from '@/components/dashboard/user-profile'
import { PlayerTeams } from '@/components/dashboard/player-teams'
import { PlayerContracts } from '@/components/dashboard/player-contracts'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/sections/site-footer'
import { CustomCursor } from '@/components/custom-cursor'
import { SmoothScroll } from '@/components/smooth-scroll'
import { BackToTop } from '@/components/back-to-top'
import { Preloader } from '@/components/preloader'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

type Tab = 'perfil' | 'equipos' | 'contratos'

export default function MiCuentaPage() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('perfil')
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <main className="min-h-screen bg-deep flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-white font-display font-600 uppercase tracking-widest text-sm">Cargando...</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <Preloader onDone={() => setReady(true)} />
      <SmoothScroll />
      <CustomCursor />
      <SiteHeader />
      <BackToTop />
      
      <main className="min-h-screen bg-deep py-24 sm:py-32">
        <div className="container mx-auto px-4 max-w-7xl">
        
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-4xl font-700 uppercase tracking-tight text-white sm:text-5xl">
              Mi Cuenta
            </h1>
            <p className="mt-2 text-muted-foreground">
              Gestiona tu perfil, equipos y contratos.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-64 shrink-0">
            <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
              {/* Player Tabs */}
              <button
                onClick={() => setActiveTab('perfil')}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-600 uppercase tracking-wider transition-colors whitespace-nowrap",
                  activeTab === 'perfil'
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <User className="h-5 w-5" />
                Mi Perfil
              </button>
              
              <button
                onClick={() => setActiveTab('equipos')}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-600 uppercase tracking-wider transition-colors whitespace-nowrap",
                  activeTab === 'equipos'
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <ShieldCheck className="h-5 w-5" />
                Equipos
              </button>

              <button
                onClick={() => setActiveTab('contratos')}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-600 uppercase tracking-wider transition-colors whitespace-nowrap",
                  activeTab === 'contratos'
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <ScrollText className="h-5 w-5" />
                Contratos
              </button>
            </nav>
          </aside>

          <div className="flex-1 min-w-0">
            {activeTab === 'perfil' && <UserProfile />}
            {activeTab === 'equipos' && <PlayerTeams />}
            {activeTab === 'contratos' && <PlayerContracts />}
          </div>

        </div>

      </div>
      </main>

      <SiteFooter />
    </>
  )
}
