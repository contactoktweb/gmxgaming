'use client'

import { useState, useEffect } from 'react'
import { Shield, ShieldAlert, History, Calendar, Settings, Save, X, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { toast } from 'sonner'
import { GmxButton } from '@/components/gmx-button'

export function PlayerTeams() {
  const { user } = useAuth()
  const [activeTeam, setActiveTeam] = useState<any>(null)
  const [pastTeams, setPastTeams] = useState<any[]>([])
  const [managedTeams, setManagedTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [editingTeam, setEditingTeam] = useState<any>(null)
  const [savingTeam, setSavingTeam] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function fetchTeams() {
      if (!user) return
      
      // Fetch player contracts (teams they play for)
      const { data } = await supabase
        .from('contracts')
        .select(`
          id, 
          status, 
          start_date, 
          end_date, 
          teams (id, name, logo_url, country)
        `)
        .eq('player_id', user.id)
        .order('start_date', { ascending: false })

      if (data) {
        const active = data.find(c => c.status === 'activo' || c.status === 'pendiente')
        if (active) setActiveTeam(active)
        
        const past = data.filter(c => c.status === 'completado' || c.status === 'cancelado')
        setPastTeams(past)
      }

      // Fetch teams managed by user
      const { data: managed } = await supabase
        .from('teams')
        .select('*')
        .eq('manager_id', user.id)
        .order('created_at', { ascending: false })

      if (managed) {
        setManagedTeams(managed)
      }

      setLoading(false)
    }
    fetchTeams()
  }, [user])

  const handleUpdateTeam = async () => {
    if (!editingTeam) return
    setSavingTeam(true)
    const { error } = await supabase.from('teams').update({
      name: editingTeam.name,
      tag: editingTeam.tag,
      country: editingTeam.country,
      logo_url: editingTeam.logo_url
    }).eq('id', editingTeam.id)

    if (error) {
      toast.error('Error al actualizar el equipo')
    } else {
      toast.success('Equipo actualizado exitosamente')
      setManagedTeams(prev => prev.map(t => t.id === editingTeam.id ? editingTeam : t))
      setEditingTeam(null)
    }
    setSavingTeam(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editingTeam) {
      const file = e.target.files[0]
      toast.loading('Subiendo logo...', { id: 'logo-upload' })
      const fileExt = file.name.split('.').pop()
      const fileName = `team-logo-${editingTeam.id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError, data } = await supabase.storage.from('teams').upload(fileName, file)
      if (uploadError) {
        toast.error('Error al subir la imagen', { id: 'logo-upload' })
        return
      }
      const { data: publicUrlData } = supabase.storage.from('teams').getPublicUrl(data.path)
      setEditingTeam({ ...editingTeam, logo_url: publicUrlData.publicUrl })
      toast.success('Logo subido, no olvides guardar los cambios.', { id: 'logo-upload' })
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando equipos...</div>
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Equipos Administrados */}
      {managedTeams.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-6 flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Equipos que Administras
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {managedTeams.map(team => (
              <div key={team.id} className="rounded-lg bg-background border border-border p-4 flex flex-col items-center text-center hover:border-primary/50 transition-colors">
                <img 
                  src={team.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                  alt={team.name} 
                  className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-surface bg-surface" 
                />
                <h4 className="font-display font-700 text-white uppercase">{team.name}</h4>
                <div className="text-xs font-500 uppercase tracking-widest mt-1 mb-5">
                   <span className={team.status === 'active' ? 'text-emerald-500' : team.status === 'banned' ? 'text-red-500' : 'text-yellow-500'}>
                     {team.status === 'active' ? 'ACTIVO' : team.status === 'banned' ? 'BANEADO' : 'PENDIENTE'}
                   </span>
                </div>
                <div className="mt-auto w-full flex gap-2">
                  <button onClick={() => setEditingTeam(team)} className="flex-1 py-2 rounded bg-surface border border-border text-[11px] font-600 text-white hover:border-primary transition-colors tracking-widest uppercase">
                    EDITAR
                  </button>
                  <Link href={`/equipos/${team.id}`} className="flex-1 py-2 rounded bg-primary/10 text-primary text-[11px] font-600 hover:bg-primary hover:text-white transition-colors text-center tracking-widest uppercase">
                    PERFIL
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipo Actual como Jugador */}
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h3 className="font-display text-2xl font-700 uppercase tracking-tight text-white mb-6 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Mi Equipo Actual (Jugador)
        </h3>

        {activeTeam ? (
          <div className="flex flex-col sm:flex-row items-center gap-6 rounded-lg bg-background p-6 border border-primary/20">
            <img 
              src={activeTeam.teams?.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
              alt={activeTeam.teams?.name}
              className="w-24 h-24 rounded-xl object-cover bg-surface border border-border"
            />
            <div className="flex-1 text-center sm:text-left">
              <h4 className="font-display text-3xl font-700 text-white uppercase">{activeTeam.teams?.name}</h4>
              <p className="text-muted-foreground mt-1 mb-4">{activeTeam.teams?.country}</p>
              
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-600 uppercase tracking-widest">
                Contrato {activeTeam.status}
              </div>
            </div>
            <Link 
              href={`/equipos/${activeTeam.teams?.id}`} 
              className="mt-4 sm:mt-0 px-6 py-3 rounded bg-primary/10 text-primary font-600 uppercase tracking-widest text-sm hover:bg-primary hover:text-white transition-colors"
            >
              Ver Perfil
            </Link>
          </div>
        ) : (
          <div className="text-center py-12 rounded-lg bg-background border border-dashed border-border">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-display text-xl font-600 text-white">Sin Equipo Actual</h4>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
              Actualmente eres un agente libre. Cuando firmes un contrato con un equipo, aparecerá aquí.
            </p>
          </div>
        )}
      </div>

      {/* Historial de Equipos */}
      {pastTeams.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white mb-6 flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Historial de Equipos
          </h3>

          <div className="grid gap-4">
            {pastTeams.map((contract) => (
              <div key={contract.id} className="flex items-center gap-4 p-4 rounded-lg bg-background border border-border">
                <img 
                  src={contract.teams?.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                  alt={contract.teams?.name}
                  className="w-12 h-12 rounded object-cover grayscale opacity-70"
                />
                <div className="flex-1">
                  <h5 className="font-600 text-white uppercase">{contract.teams?.name}</h5>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(contract.start_date).toLocaleDateString()} - {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Cancelado'}
                  </div>
                </div>
                <div className="text-xs font-600 uppercase tracking-widest text-muted-foreground">
                  {contract.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Edición de Equipo */}
      {editingTeam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingTeam(null)} />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between border-b border-border p-6 bg-surface shrink-0">
              <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Editar Equipo
              </h3>
              <button onClick={() => setEditingTeam(null)} className="text-muted-foreground hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="flex flex-col items-center">
                <img 
                  src={editingTeam.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                  alt={editingTeam.name}
                  className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-border bg-background"
                />
                <label className="w-full">
                  <span className="text-xs font-600 text-muted-foreground uppercase tracking-widest mb-2 block text-center">Actualizar Logo</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-600 text-muted-foreground uppercase tracking-widest">Nombre del Equipo</label>
                  <input 
                    type="text" 
                    value={editingTeam.name || ''}
                    onChange={e => setEditingTeam({...editingTeam, name: e.target.value.toUpperCase()})}
                    className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-white focus:border-primary focus:outline-none uppercase"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-600 text-muted-foreground uppercase tracking-widest">Tag del Equipo</label>
                  <input 
                    type="text" 
                    value={editingTeam.tag || ''}
                    onChange={e => setEditingTeam({...editingTeam, tag: e.target.value.toUpperCase()})}
                    className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-white focus:border-primary focus:outline-none uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-600 text-muted-foreground uppercase tracking-widest">País</label>
                  <input 
                    type="text" 
                    value={editingTeam.country || ''}
                    onChange={e => setEditingTeam({...editingTeam, country: e.target.value})}
                    className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border p-6 bg-surface shrink-0 flex justify-end gap-3">
              <button 
                onClick={() => setEditingTeam(null)}
                className="px-6 py-2 rounded-md border border-border text-sm font-600 text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <GmxButton onClick={handleUpdateTeam} disabled={savingTeam} className="px-6 py-2">
                {savingTeam ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambios'}
              </GmxButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
