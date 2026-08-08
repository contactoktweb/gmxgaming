'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, CheckSquare, Users, Trophy, ScrollText, ShieldCheck, Loader2, Youtube, Mic } from 'lucide-react'
import { AdminValidations } from '@/components/dashboard/admin-validations'
import { AdminPlayers } from '@/components/dashboard/admin-players'
import { AdminTournaments } from '@/components/dashboard/admin-tournaments'
import { AdminContracts } from '@/components/dashboard/admin-contracts'
import { AdminTeams } from '@/components/dashboard/admin-teams'
import { AdminSettings } from '@/components/dashboard/admin-settings'
import { AdminMedia } from '@/components/dashboard/admin-media'
import { AdminCasters } from '@/components/dashboard/admin-casters'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/sections/site-footer'
import { CustomCursor } from '@/components/custom-cursor'
import { SmoothScroll } from '@/components/smooth-scroll'
import { BackToTop } from '@/components/back-to-top'
import { Preloader } from '@/components/preloader'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

type Tab = 'validaciones' | 'jugadores' | 'equipos' | 'contratos' | 'torneos' | 'media' | 'casters' | 'ajustes'

export default function AdministracionPage() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('validaciones')
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/micuenta')
    }
  }, [user, isLoading, router])

  if (isLoading || !user || user.role !== 'admin') {
    return (
      <main className="min-h-screen bg-deep flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-white font-display font-600 uppercase tracking-widest text-sm">Cargando Panel...</p>
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
              Administración
            </h1>
            <p className="mt-2 text-muted-foreground">
              Panel de control general de la plataforma.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          <aside className="w-full lg:w-64 shrink-0">
            <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
              <button
                onClick={() => setActiveTab('validaciones')}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-600 uppercase tracking-wider transition-colors whitespace-nowrap",
                  activeTab === 'validaciones'
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <CheckSquare className="h-5 w-5" />
                Validaciones
              </button>
              
              <button
                onClick={() => setActiveTab('jugadores')}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-600 uppercase tracking-wider transition-colors whitespace-nowrap",
                  activeTab === 'jugadores'
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <Users className="h-5 w-5" />
                Jugadores
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
                onClick={() => setActiveTab('torneos')}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-600 uppercase tracking-wider transition-colors whitespace-nowrap",
                  activeTab === 'torneos'
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <Trophy className="h-5 w-5" />
                Torneos
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

              <button
                onClick={() => setActiveTab('media')}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-600 uppercase tracking-wider transition-colors whitespace-nowrap",
                  activeTab === 'media'
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <Youtube className="h-5 w-5" />
                Media
              </button>

              <button
                onClick={() => setActiveTab('casters')}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-600 uppercase tracking-wider transition-colors whitespace-nowrap",
                  activeTab === 'casters'
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <Mic className="h-5 w-5" />
                Casters
              </button>

              <button
                onClick={() => setActiveTab('ajustes')}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-600 uppercase tracking-wider transition-colors whitespace-nowrap",
                  activeTab === 'ajustes'
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <Settings className="h-5 w-5" />
                Ajustes
              </button>
            </nav>
          </aside>

          <div className="flex-1 min-w-0">
            {activeTab === 'validaciones' && <AdminValidations />}
            {activeTab === 'jugadores' && <AdminPlayers />}
            {activeTab === 'equipos' && <AdminTeams />}
            {activeTab === 'torneos' && <AdminTournaments />}
            {activeTab === 'contratos' && <AdminContracts />}
            {activeTab === 'media' && <AdminMedia />}
            {activeTab === 'casters' && <AdminCasters />}
            {activeTab === 'ajustes' && <AdminSettings />}
          </div>

        </div>

      </div>
      </main>

      <SiteFooter />
    </>
  )
}
