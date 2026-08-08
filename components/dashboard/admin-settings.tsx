'use client'

import { useState, useEffect } from 'react'
import { Settings, Globe, Gamepad2, Loader2, Save, X, Plus } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { GmxButton } from '@/components/gmx-button'
import { FileUpload } from '@/components/forms/file-upload'

interface AppSetting {
  id: string
  value: string[]
}

interface TournamentTemplate {
  id: string
  name: string
  game: string
  type: string
  logo_url: string
}

export function AdminSettings() {
  const [countries, setCountries] = useState<string[]>([])
  const [games, setGames] = useState<{name: string, image: string}[]>([])
  
  const [newCountry, setNewCountry] = useState('')
  const [newGame, setNewGame] = useState('')
  const [newGameImage, setNewGameImage] = useState<File | null>(null)
  
  const [templates, setTemplates] = useState<TournamentTemplate[]>([])
  const [newTemplate, setNewTemplate] = useState({name: '', game: 'Mobile Legends', type: 'Relámpago', logo_url: ''})
  const [templateImage, setTemplateImage] = useState<File | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true)
      const { data } = await supabase.from('app_settings').select('*')
      if (data) {
        const countryConfig = data.find(s => s.id === 'enabled_countries')
        const gameConfig = data.find(s => s.id === 'enabled_games')
        
        if (countryConfig && Array.isArray(countryConfig.value)) {
          setCountries(countryConfig.value)
        }
        if (gameConfig && Array.isArray(gameConfig.value)) {
          setGames(gameConfig.value.map((g: any) => 
            typeof g === 'string' ? { name: g, image: '' } : g
          ))
        }
      }

      const { data: tmplData } = await supabase.from('tournament_templates').select('*').order('created_at', { ascending: false })
      if (tmplData) {
        setTemplates(tmplData)
      }
      
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    
    // Save countries
    await supabase.from('app_settings').upsert({ 
      id: 'enabled_countries', 
      value: countries 
    })
    
    // Save games
    await supabase.from('app_settings').upsert({ 
      id: 'enabled_games', 
      value: games 
    })
    
    setSaving(false)
    alert('Configuraciones guardadas exitosamente.')
  }

  const addCountry = () => {
    if (newCountry.trim() && !countries.includes(newCountry.trim())) {
      setCountries([...countries, newCountry.trim()])
      setNewCountry('')
    }
  }

  const addGame = async () => {
    if (!newGame.trim()) return
    if (games.some(g => g.name.toLowerCase() === newGame.trim().toLowerCase())) return

    let imageUrl = ''
    if (newGameImage) {
      setSaving(true)
      const fileExt = newGameImage.name.split('.').pop()
      const fileName = `game_${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage.from('teams').upload(fileName, newGameImage)
      if (data) {
        const { data: urlData } = supabase.storage.from('teams').getPublicUrl(data.path)
        imageUrl = urlData.publicUrl
      }
      setSaving(false)
    }

    setGames([...games, { name: newGame.trim(), image: imageUrl }])
    setNewGame('')
    setNewGameImage(null)
  }

  const addTemplate = async () => {
    if (!newTemplate.name.trim()) return
    setSaving(true)
    let logoUrl = newTemplate.logo_url
    if (templateImage) {
      const fileExt = templateImage.name.split('.').pop()
      const fileName = `tmpl_${Date.now()}.${fileExt}`
      const { data } = await supabase.storage.from('teams').upload(fileName, templateImage)
      if (data) {
        const { data: urlData } = supabase.storage.from('teams').getPublicUrl(data.path)
        logoUrl = urlData.publicUrl
      }
    }
    const { data, error } = await supabase.from('tournament_templates').insert({
      name: newTemplate.name.trim(),
      game: newTemplate.game,
      type: newTemplate.type,
      logo_url: logoUrl
    }).select().single()
    
    if (data) {
      setTemplates([data, ...templates])
    }
    setNewTemplate({name: '', game: 'Mobile Legends', type: 'Relámpago', logo_url: ''})
    setTemplateImage(null)
    setSaving(false)
  }

  const deleteTemplate = async (id: string) => {
    await supabase.from('tournament_templates').delete().eq('id', id)
    setTemplates(templates.filter(t => t.id !== id))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary" />
              Configuraciones Base
            </h2>
            <p className="text-muted-foreground mt-1">
              Administra los países habilitados y los juegos soportados en la plataforma.
            </p>
          </div>
          
          <GmxButton onClick={handleSave} disabled={saving} className="gap-2 shrink-0 py-2.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Cambios
          </GmxButton>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Countries */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-600 uppercase tracking-widest border-b border-border pb-2">
              <Globe className="w-5 h-5 text-primary" />
              Países Habilitados
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                list="countries-list"
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCountry()}
                placeholder="Añadir nuevo país..."
                className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
              />
              <datalist id="countries-list">
                <option value="Argentina" />
                <option value="Bolivia" />
                <option value="Chile" />
                <option value="Colombia" />
                <option value="Costa Rica" />
                <option value="Cuba" />
                <option value="Ecuador" />
                <option value="El Salvador" />
                <option value="Guatemala" />
                <option value="Honduras" />
                <option value="México" />
                <option value="Nicaragua" />
                <option value="Panamá" />
                <option value="Paraguay" />
                <option value="Perú" />
                <option value="Puerto Rico" />
                <option value="República Dominicana" />
                <option value="Uruguay" />
                <option value="Venezuela" />
                <option value="España" />
                <option value="Estados Unidos" />
              </datalist>
              <button 
                onClick={addCountry}
                className="flex items-center justify-center w-10 h-10 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {countries.map(country => (
                <div key={country} className="flex items-center gap-2 bg-background border border-border rounded-full px-3 py-1 text-sm text-white">
                  <span>{country}</span>
                  <button 
                    onClick={() => setCountries(countries.filter(c => c !== country))}
                    className="text-muted-foreground hover:text-red-500 transition-colors ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {countries.length === 0 && (
                <p className="text-muted-foreground text-sm italic">No hay países habilitados.</p>
              )}
            </div>
          </div>

          {/* Games */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-600 uppercase tracking-widest border-b border-border pb-2">
              <Gamepad2 className="w-5 h-5 text-primary" />
              Juegos Soportados
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  list="games-list"
                  value={newGame}
                  onChange={(e) => setNewGame(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGame()}
                  placeholder="Añadir nuevo juego..."
                  className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
                <datalist id="games-list">
                  <option value="Mobile Legends" />
                  <option value="Free Fire" />
                  <option value="League of Legends" />
                  <option value="Valorant" />
                  <option value="Call of Duty: Mobile" />
                  <option value="PUBG Mobile" />
                  <option value="Honor of Kings" />
                  <option value="Clash Royale" />
                  <option value="Teamfight Tactics" />
                  <option value="EA Sports FC" />
                  <option value="Wild Rift" />
                  <option value="Overwatch 2" />
                  <option value="Rocket League" />
                </datalist>
                <button 
                  onClick={addGame}
                  disabled={saving}
                  className="flex items-center justify-center w-10 h-10 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-500 text-muted-foreground block">Logo del juego (Opcional)</label>
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                  onChange={(e) => setNewGameImage(e.target.files?.[0] || null)}
                  className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-600 file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {games.map(game => (
                <div key={game.name} className="flex items-center gap-2 bg-background border border-border rounded-full pl-2 pr-3 py-1 text-sm text-white">
                  {game.image ? (
                    <img src={game.image} alt={game.name} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span>{game.name}</span>
                  <button 
                    onClick={() => setGames(games.filter(g => g.name !== game.name))}
                    className="text-muted-foreground hover:text-red-500 transition-colors ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {games.length === 0 && (
                <p className="text-muted-foreground text-sm italic">No hay juegos soportados.</p>
              )}
            </div>
          </div>
        </div>

        {/* Tournament Templates Section */}
        <div className="mt-8 border-t border-border pt-8">
          <div className="flex items-center gap-2 text-white font-600 uppercase tracking-widest border-b border-border pb-2 mb-6">
            <Settings className="w-5 h-5 text-primary" />
            Plantillas de Torneos
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Creator */}
            <div className="lg:col-span-1 space-y-4 bg-background p-5 rounded-xl border border-border">
              <h3 className="text-sm font-600 text-white uppercase tracking-widest">Crear Nueva Plantilla</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nombre de la Plantilla</label>
                  <input 
                    type="text" 
                    value={newTemplate.name}
                    onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    placeholder="Ej. Torneo Mensual MLBB"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Juego Base</label>
                  <select 
                    value={newTemplate.game}
                    onChange={e => setNewTemplate({...newTemplate, game: e.target.value})}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    {games.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                    {games.length === 0 && <option value="Mobile Legends">Mobile Legends</option>}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tipo de Torneo</label>
                  <select 
                    value={newTemplate.type}
                    onChange={e => setNewTemplate({...newTemplate, type: e.target.value})}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    <option value="Relámpago">Relámpago (1 día)</option>
                    <option value="Clasificatorio">Clasificatorio</option>
                    <option value="Liga">Liga Mensual</option>
                    <option value="Presencial">Presencial / LAN</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Logo (Opcional)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setTemplateImage(e.target.files?.[0] || null)}
                    className="w-full text-xs text-muted-foreground file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-600 file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </div>
                <GmxButton onClick={addTemplate} disabled={saving || !newTemplate.name} className="w-full mt-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'CREAR PLANTILLA'}
                </GmxButton>
              </div>
            </div>

            {/* List */}
            <div className="lg:col-span-2">
              {templates.length === 0 ? (
                <div className="flex justify-center items-center h-full min-h-[200px] border border-dashed border-border rounded-xl bg-background/50">
                  <p className="text-muted-foreground text-sm">No hay plantillas creadas.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {templates.map(tmpl => (
                    <div key={tmpl.id} className="relative flex items-center gap-4 bg-background border border-border p-4 rounded-xl hover:border-primary/50 transition-colors">
                      <button 
                        onClick={() => deleteTemplate(tmpl.id)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <img 
                        src={tmpl.logo_url || 'https://i0.wp.com/gmxgaming.com/wp-content/plugins/ultimate-member/assets/img/default_avatar.jpg'} 
                        alt={tmpl.name} 
                        className="w-14 h-14 rounded-lg object-cover bg-surface"
                      />
                      <div>
                        <h4 className="font-600 text-white text-sm">{tmpl.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-primary">{tmpl.game}</span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span className="text-xs text-muted-foreground">{tmpl.type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
