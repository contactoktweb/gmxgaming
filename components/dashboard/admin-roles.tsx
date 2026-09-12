'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  ShieldAlert, 
  Search, 
  ShieldCheck, 
  UserCheck, 
  Eye, 
  AlertCircle, 
  Loader2, 
  Check, 
  UserX,
  Crown,
  Sparkles,
  Users
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { AdminPagination } from '@/components/dashboard/admin-pagination'

interface ProfileUser {
  id: string
  name: string | null
  nickname: string | null
  game_nickname: string | null
  email?: string | null
  avatar_url: string | null
  role: string | null
  is_player?: boolean
  created_at: string
}

const ROLE_DEFINITIONS = [
  {
    key: 'admin_principal',
    name: 'Admin Principal',
    desc: 'Acceso total y único con permiso para gestionar roles (Raúl).',
    color: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: Crown
  },
  {
    key: 'admin_secundario',
    name: 'Admin Secundario',
    desc: 'Gestión completa de Validaciones, Jugadores y Equipos (Yume).',
    color: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: ShieldCheck
  },
  {
    key: 'admin_visitante',
    name: 'Admin Visitante',
    desc: 'Solo lectura de Jugadores y Equipos, descarga de fotos y exportar a Excel.',
    color: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    icon: Eye
  },
  {
    key: 'user',
    name: 'Usuario / Jugador',
    desc: 'Sin acceso administrativo al panel.',
    color: 'border-white/10 bg-white/5 text-muted-foreground',
    badge: 'bg-white/5 text-muted-foreground border-white/10',
    icon: Users
  }
]

export function AdminRoles() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<ProfileUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilterRole, setSelectedFilterRole] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [confirmRoleModal, setConfirmRoleModal] = useState<{
    profile: ProfileUser
    targetRole: string
  } | null>(null)

  const supabase = createClient()

  const fetchProfiles = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error al obtener perfiles:', error)
        toast.error('Error al cargar lista de usuarios: ' + error.message)
      } else {
        setProfiles(data || [])
      }
    } catch (err: any) {
      console.error('Error en fetchProfiles:', err)
      toast.error('Error inesperado al conectar con Supabase')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return profiles.filter(p => {
      // Filtro de rol
      if (selectedFilterRole !== 'all') {
        const pRole = (p.role || 'user').toLowerCase()
        if (selectedFilterRole === 'admin_principal' && (pRole !== 'admin_principal' && pRole !== 'admin')) {
          return false
        }
        if (selectedFilterRole === 'admin_secundario' && pRole !== 'admin_secundario') {
          return false
        }
        if (selectedFilterRole === 'admin_visitante' && pRole !== 'admin_visitante') {
          return false
        }
        if (selectedFilterRole === 'user' && (pRole === 'admin' || pRole.startsWith('admin_'))) {
          return false
        }
      }

      // Filtro de búsqueda
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const name = (p.name || '').toLowerCase()
      const nickname = (p.nickname || '').toLowerCase()
      const gameNick = (p.game_nickname || '').toLowerCase()
      const email = (p.email || '').toLowerCase()

      return name.includes(q) || nickname.includes(q) || gameNick.includes(q) || email.includes(q) || p.id.includes(q)
    })
  }, [profiles, searchQuery, selectedFilterRole])

  // Reset de página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedFilterRole])

  // Elementos paginados
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredUsers.slice(start, start + itemsPerPage)
  }, [filteredUsers, currentPage, itemsPerPage])

  // Contadores
  const stats = useMemo(() => {
    let principal = 0
    let secundario = 0
    let visitante = 0
    let regular = 0

    profiles.forEach(p => {
      const r = (p.role || 'user').toLowerCase()
      if (r === 'admin_principal' || r === 'admin') principal++
      else if (r === 'admin_secundario') secundario++
      else if (r === 'admin_visitante') visitante++
      else regular++
    })

    return { principal, secundario, visitante, regular, total: profiles.length }
  }, [profiles])

  // Confirmar y aplicar cambio de rol
  const handleAssignRole = async (targetProfile: ProfileUser, targetRole: string) => {
    if (targetProfile.id === user?.id && targetRole !== 'admin_principal' && targetRole !== 'admin') {
      toast.error('No puedes remover tu propio rol de Admin Principal para no perder el acceso a la plataforma.')
      return
    }

    setUpdatingUserId(targetProfile.id)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: targetRole })
        .eq('id', targetProfile.id)

      if (error) {
        toast.error('Error al actualizar el rol: ' + error.message)
      } else {
        setProfiles(prev => prev.map(p => p.id === targetProfile.id ? { ...p, role: targetRole } : p))
        const roleLabel = ROLE_DEFINITIONS.find(r => r.key === targetRole)?.name || targetRole
        toast.success(`Rol asignado: ${roleLabel} a ${targetProfile.name || 'usuario'}`)
      }
    } catch (err: any) {
      toast.error('Error inesperado: ' + (err?.message || ''))
    } finally {
      setUpdatingUserId(null)
      setConfirmRoleModal(null)
    }
  }

  const getRoleDef = (roleStr: string | null) => {
    const r = (roleStr || 'user').toLowerCase()
    if (r === 'admin_principal' || r === 'admin') {
      return ROLE_DEFINITIONS[0]
    }
    if (r === 'admin_secundario') {
      return ROLE_DEFINITIONS[1]
    }
    if (r === 'admin_visitante') {
      return ROLE_DEFINITIONS[2]
    }
    return ROLE_DEFINITIONS[3]
  }

  const getRoleBadge = (roleStr: string | null) => {
    const r = (roleStr || 'user').toLowerCase()
    if (r === 'admin_principal' || r === 'admin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-600 bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <Crown className="w-3.5 h-3.5" />
          Admin Principal
        </span>
      )
    }
    if (r === 'admin_secundario') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-600 bg-purple-500/15 text-purple-300 border border-purple-500/30">
          <ShieldCheck className="w-3.5 h-3.5" />
          Admin Secundario
        </span>
      )
    }
    if (r === 'admin_visitante') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-600 bg-sky-500/15 text-sky-300 border border-sky-500/30">
          <Eye className="w-3.5 h-3.5" />
          Admin Visitante
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-500 bg-white/5 text-muted-foreground border border-white/10">
        <Users className="w-3.5 h-3.5" />
        Usuario
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header & Banner Informativo */}
      <div className="rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-surface to-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-400" />
              <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white">
                Gestión de Roles y Permisos
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Módulo exclusivo del Admin Principal (Raúl). Aquí puedes buscar cualquier usuario registrado en la plataforma y asignarle su rol administrativo correspondiente.
            </p>
          </div>
          <button
            onClick={fetchProfiles}
            disabled={loading}
            className="self-start sm:self-center px-4 py-2 text-xs font-600 uppercase tracking-wider rounded-lg border border-border bg-surface hover:bg-white/5 text-white transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
            Refrescar Lista
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen de Roles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLE_DEFINITIONS.map(def => {
          const Icon = def.icon
          const count = 
            def.key === 'admin_principal' ? stats.principal :
            def.key === 'admin_secundario' ? stats.secundario :
            def.key === 'admin_visitante' ? stats.visitante : stats.regular

          const isSelected = selectedFilterRole === def.key

          return (
            <button
              key={def.key}
              onClick={() => setSelectedFilterRole(isSelected ? 'all' : def.key)}
              className={cn(
                "flex flex-col text-left p-4 rounded-xl border transition-all duration-200",
                isSelected 
                  ? "border-primary ring-1 ring-primary bg-primary/10" 
                  : "border-border bg-surface/60 hover:bg-surface hover:border-white/20"
              )}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className={cn("p-2 rounded-lg border", def.color)}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="font-display text-xl font-700 text-white">
                  {count}
                </span>
              </div>
              <h3 className="font-display text-sm font-700 uppercase tracking-wide text-white">
                {def.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {def.desc}
              </p>
            </button>
          )
        })}
      </div>

      {/* Filtro y Buscador */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface p-4 rounded-xl border border-border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, nickname (IGN) o ID de usuario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-deep/80 border border-border text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {selectedFilterRole !== 'all' && (
          <button
            onClick={() => setSelectedFilterRole('all')}
            className="text-xs font-500 text-primary hover:underline whitespace-nowrap self-end sm:self-center"
          >
            Quitar filtro ({ROLE_DEFINITIONS.find(r => r.key === selectedFilterRole)?.name})
          </button>
        )}
      </div>

      {/* Lista de Usuarios */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-display uppercase tracking-widest text-muted-foreground">
              Cargando usuarios registrados...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <UserX className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h4 className="font-display text-lg font-600 uppercase text-white mb-1">
              No se encontraron usuarios
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Intenta con otro término de búsqueda o limpia el filtro de roles seleccionado.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-white/[0.02] text-[11px] font-600 uppercase tracking-wider text-muted-foreground">
                    <th className="py-3.5 px-4">Usuario</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Nickname / IGN</th>
                    <th className="py-3.5 px-4">Rol Actual</th>
                    <th className="py-3.5 px-4 text-right">Asignar Nuevo Rol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-sm">
                  {paginatedUsers.map((profile) => {
                    const currentRole = (profile.role || 'user').toLowerCase()
                    const isRaul = profile.email === 'kike_301097@hotmail.com' || profile.role === 'admin_principal'
                    const isSelf = profile.id === user?.id
                    const isUpdating = updatingUserId === profile.id

                    return (
                      <tr key={profile.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={profile.avatar_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'}
                              alt={profile.name || 'Usuario'}
                              className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-600 text-white truncate text-xs sm:text-sm">
                                {profile.name || 'Sin Nombre'}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {profile.email || profile.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 hidden md:table-cell">
                          <span className="text-xs text-muted-foreground font-mono">
                            {profile.nickname || profile.game_nickname || '—'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {(() => {
                            const def = getRoleDef(currentRole)
                            const Icon = def.icon
                            return (
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-600 border",
                                def.badge
                              )}>
                                <Icon className="w-3 h-3" />
                                <span>{def.name}</span>
                              </span>
                            )
                          })()}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isUpdating ? (
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            ) : isRaul ? (
                              <span className="text-[11px] text-amber-400 font-500 italic">
                                Rol Protegido
                              </span>
                            ) : (
                              <select
                                value={currentRole === 'admin' ? 'admin_principal' : currentRole}
                                onChange={(e) => {
                                  const newRole = e.target.value
                                  if (newRole !== currentRole) {
                                    setConfirmRoleModal({
                                      profile,
                                      targetRole: newRole
                                    })
                                  }
                                }}
                                className="rounded-lg bg-deep border border-border px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition-colors cursor-pointer"
                              >
                                <option value="admin_principal">👑 Admin Principal</option>
                                <option value="admin_secundario">🛡️ Admin Secundario</option>
                                <option value="admin_visitante">👁️ Admin Visitante</option>
                                <option value="user">👤 Usuario / Jugador</option>
                              </select>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filteredUsers.length > 0 && (
              <div className="p-4 border-t border-border bg-surface/40">
                <AdminPagination
                  currentPage={currentPage}
                  totalItems={filteredUsers.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                  itemsPerPageOptions={[5, 10, 20, 50]}
                  itemName="usuarios registrados"
                  className="border-t-0 pt-0 mt-0"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Confirmación de Asignación de Rol */}
      {confirmRoleModal && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmRoleModal(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-primary/10 border border-primary/20 text-primary">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-700 uppercase text-white">
                  Confirmar Asignación de Rol
                </h3>
                <p className="text-xs text-muted-foreground">
                  Modificarás los permisos de acceso del usuario.
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-deep/60 p-4 rounded-lg border border-border/80 mb-6 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Usuario:</span>
                <span className="text-white font-semibold">{confirmRoleModal.profile.name || 'Sin nombre'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Rol Actual:</span>
                <div>{getRoleBadge(confirmRoleModal.profile.role)}</div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-muted-foreground">Nuevo Rol:</span>
                <div>{getRoleBadge(confirmRoleModal.targetRole)}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmRoleModal(null)}
                className="px-4 py-2.5 text-xs font-600 uppercase tracking-wider rounded-lg border border-border text-muted-foreground hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleAssignRole(confirmRoleModal.profile, confirmRoleModal.targetRole)}
                className="px-5 py-2.5 text-xs font-600 uppercase tracking-wider rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Confirmar y Asignar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
