'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, CheckSquare, Users, Trophy, ShieldCheck, Loader2, PlaySquare, Mic, Handshake, Crown, Eye, KeyRound } from 'lucide-react'
import { AdminValidations } from '@/components/dashboard/admin-validations'
import { AdminPlayers } from '@/components/dashboard/admin-players'
import { AdminTournaments } from '@/components/dashboard/admin-tournaments'
import { AdminTeams } from '@/components/dashboard/admin-teams'
import { AdminSettings } from '@/components/dashboard/admin-settings'
import { AdminMedia } from '@/components/dashboard/admin-media'
import { AdminCasters } from '@/components/dashboard/admin-casters'
import { AdminSponsors } from '@/components/dashboard/admin-sponsors'
import { AdminRoles } from '@/components/dashboard/admin-roles'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/sections/site-footer'
import { CustomCursor } from '@/components/custom-cursor'
import { SmoothScroll } from '@/components/smooth-scroll'
import { BackToTop } from '@/components/back-to-top'
import { Preloader } from '@/components/preloader'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

type Tab = 'validaciones' | 'jugadores' | 'equipos' | 'torneos' | 'media' | 'casters' | 'sponsors' | 'ajustes' | 'roles'

export default function AdministracionPage() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('validaciones')
  const [ready, setReady] = useState(false)
  const router = useRouter()

  const isPrincipal = user?.isAdminPrincipal
  const isSecundario = user?.isAdminSecundario
  const isVisitante = user?.isAdminVisitante

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      router.push('/micuenta')
    }
  }, [user, isLoading, router])

  // Ajustar la pestaña activa según los permisos del rol
  useEffect(() => {
    if (user?.isAdminVisitante && activeTab !== 'jugadores' && activeTab !== 'equipos') {
      setActiveTab('jugadores')
    } else if (user?.isAdminSecundario && !['validaciones', 'jugadores', 'equipos'].includes(activeTab)) {
      setActiveTab('validaciones')
    }
  }, [user, activeTab])

  if (isLoading || !user || !user.isAdmin) {
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
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl font-700 uppercase tracking-tight text-white sm:text-5xl">
                Administración
              </h1>
              {isPrincipal && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-700 uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Crown className="w-3.5 h-3.5" /> Admin Principal (Raúl)
                </span>
              )}
              {isSecundario && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-700 uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  <ShieldCheck className="w-3.5 h-3.5" /> Admin Secundario (Yume)
                </span>
              )}
              {isVisitante && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-700 uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  <Eye className="w-3.5 h-3.5" /> Admin Visitante (Solo Lectura)
                </span>
              )}
            </div>
            <p className="mt-2 text-muted-foreground text-sm">
              {isPrincipal && 'Panel de control general, supervisión y gestión de roles de la plataforma.'}
              {isSecundario && 'Gestión y control de validaciones, jugadores y equipos de la plataforma.'}
              {isVisitante && 'Acceso de consulta: visualización, descarga de imágenes y exportación a Excel.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          <aside className="w-full lg:w-64 shrink-0">
            <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
              {/* Validaciones: Admin Principal y Admin Secundario */}
              {(isPrincipal || isSecundario) && (
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
              )}
              
              {/* Jugadores: Todos los roles de admin */}
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
              
              {/* Equipos: Todos los roles de admin */}
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

              {/* Pestañas exclusivas para Admin Principal */}
              {isPrincipal && (
                <>
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
                    onClick={() => setActiveTab('media')}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-600 uppercase tracking-wider transition-colors whitespace-nowrap",
                      activeTab === 'media'
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <PlaySquare className="h-5 w-5" />
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
                    onClick={() => setActiveTab('sponsors')}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-600 uppercase tracking-wider transition-colors whitespace-nowrap",
                      activeTab === 'sponsors'
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Handshake className="h-5 w-5" />
                    Sponsors
                  </button>

                  <button
                    onClick={() => setActiveTab('roles')}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-600 uppercase tracking-wider transition-colors whitespace-nowrap border border-amber-500/30",
                      activeTab === 'roles'
                        ? "bg-amber-500 text-black font-700"
                        : "text-amber-400 hover:bg-amber-500/10"
                    )}
                  >
                    <Crown className="h-5 w-5" />
                    Roles y Permisos
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
                </>
              )}
            </nav>
          </aside>

          <div className="flex-1 min-w-0">
            {activeTab === 'validaciones' && (isPrincipal || isSecundario) && <AdminValidations />}
            {activeTab === 'jugadores' && <AdminPlayers />}
            {activeTab === 'equipos' && <AdminTeams />}
            {activeTab === 'torneos' && isPrincipal && <AdminTournaments />}
            {activeTab === 'media' && isPrincipal && <AdminMedia />}
            {activeTab === 'casters' && isPrincipal && <AdminCasters />}
            {activeTab === 'sponsors' && isPrincipal && <AdminSponsors />}
            {activeTab === 'roles' && isPrincipal && <AdminRoles />}
            {activeTab === 'ajustes' && isPrincipal && <AdminSettings />}
          </div>

        </div>

      </div>
      </main>

      <SiteFooter />
    </>
  )
}
