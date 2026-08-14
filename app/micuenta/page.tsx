'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Loader2, ShieldCheck, ScrollText, Users } from 'lucide-react'
import { UserProfile } from '@/components/dashboard/user-profile'
import { PlayerTeams } from '@/components/dashboard/player-teams'
import { PlayerContracts } from '@/components/dashboard/player-contracts'
import { ManagerPlayers } from '@/components/dashboard/manager-players'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/sections/site-footer'
import { CustomCursor } from '@/components/custom-cursor'
import { SmoothScroll } from '@/components/smooth-scroll'
import { BackToTop } from '@/components/back-to-top'
import { Preloader } from '@/components/preloader'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'

type Tab = 'perfil' | 'equipos' | 'jugadores' | 'contratos'

export default function MiCuentaPage() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('perfil')
  const [ready, setReady] = useState(false)
  const [isManager, setIsManager] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    async function checkManagerStatus() {
      if (!user) return
      
      const { data: teams } = await supabase
        .from('teams')
        .select('id')
        .eq('manager_id', user.id)

      if (teams && teams.length > 0) {
        setIsManager(true)
        const teamIds = teams.map(t => t.id)
        
        const { count } = await supabase
          .from('contracts')
          .select('id', { count: 'exact', head: true })
          .in('team_id', teamIds)
          .in('status', ['pending_manager', 'pending', 'pendiente'])
        
        if (count) {
          setPendingRequestsCount(count)
        }
      } else {
        setIsManager(false)
      }
    }

    checkManagerStatus()
  }, [user, activeTab])

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
              {/* Perfil */}
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
              
              {/* Equipos */}
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

              {/* Jugadores (Solo para líderes/managers de equipo) */}
              {isManager && (
                <button
                  onClick={() => setActiveTab('jugadores')}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-600 uppercase tracking-wider transition-colors whitespace-nowrap",
                    activeTab === 'jugadores'
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" />
                    Jugadores
                  </div>
                  {pendingRequestsCount > 0 && (
                    <div 
                      className="group/badge relative flex items-center"
                      title={`${pendingRequestsCount} solicitud${pendingRequestsCount > 1 ? 'es' : ''} de contrato pendiente${pendingRequestsCount > 1 ? 's' : ''} por revisar`}
                    >
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-700 bg-amber-500 text-black animate-pulse shadow-sm">
                        {pendingRequestsCount}
                      </span>
                      {/* Tooltip informativo al hacer hover */}
                      <div className="pointer-events-none absolute right-0 bottom-full mb-2 hidden sm:block w-52 rounded-xl bg-surface border border-border p-3 text-xs font-500 normal-case tracking-normal text-white opacity-0 transition-all duration-200 group-hover/badge:opacity-100 z-50 text-left shadow-2xl">
                        <span className="font-700 text-amber-400 block mb-1">
                          {pendingRequestsCount === 1 ? '1 Solicitud Pendiente' : `${pendingRequestsCount} Solicitudes Pendientes`}
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                          {pendingRequestsCount === 1 
                            ? 'Tienes 1 solicitud de contrato enviada por un jugador esperando tu aprobación.'
                            : `Tienes ${pendingRequestsCount} solicitudes de contratos enviadas por jugadores esperando tu aprobación.`}
                        </p>
                        <div className="absolute top-full right-3 -mt-px border-4 border-transparent border-t-surface"></div>
                      </div>
                    </div>
                  )}
                </button>
              )}

              {/* Contratos */}
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
            {activeTab === 'perfil' && <UserProfile onNavigateTab={setActiveTab} />}
            {activeTab === 'equipos' && <PlayerTeams />}
            {activeTab === 'jugadores' && <ManagerPlayers />}
            {activeTab === 'contratos' && <PlayerContracts />}
          </div>

        </div>

      </div>
      </main>

      <SiteFooter />
    </>
  )
}
