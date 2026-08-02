'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, Save, Globe, Gamepad2, Settings2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { GmxButton } from '@/components/gmx-button'

export function AdminSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [countries, setCountries] = useState<string[]>([])
  const [games, setGames] = useState<string[]>([])
  
  const [newCountry, setNewCountry] = useState('')
  const [newGame, setNewGame] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase.from('app_settings').select('*')
      if (data) {
        const countryConfig = data.find(c => c.id === 'enabled_countries')
        const gameConfig = data.find(c => c.id === 'enabled_games')
        
        if (countryConfig && Array.isArray(countryConfig.value)) {
          setCountries(countryConfig.value)
        }
        if (gameConfig && Array.isArray(gameConfig.value)) {
          setGames(gameConfig.value)
        }
      }
      setLoading(false)
    }
    loadSettings()
  }, [])

  const handleAddCountry = () => {
    const val = newCountry.trim()
    if (val && !countries.includes(val)) {
      setCountries(prev => [...prev, val])
      setNewCountry('')
    }
  }

  const handleRemoveCountry = (country: string) => {
    setCountries(prev => prev.filter(c => c !== country))
  }

  const handleAddGame = () => {
    const val = newGame.trim()
    if (val && !games.includes(val)) {
      setGames(prev => [...prev, val])
      setNewGame('')
    }
  }

  const handleRemoveGame = (game: string) => {
    if (game === 'Mobile Legends') {
      alert('Mobile Legends no puede ser eliminado por defecto.')
      return
    }
    setGames(prev => prev.filter(g => g !== game))
  }

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
    alert('Configuración guardada correctamente.')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 border border-border rounded-xl bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      <div className="flex items-center justify-between bg-surface border border-border p-6 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Settings2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white">
              Ajustes Globales
            </h2>
            <p className="text-muted-foreground text-sm">Gestiona países y juegos disponibles en los formularios de registro.</p>
          </div>
        </div>
        <GmxButton onClick={handleSave} disabled={saving} className="min-w-[150px]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
        </GmxButton>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Paises */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h3 className="font-display text-lg font-600 uppercase tracking-widest text-white">
              Países Habilitados
            </h3>
          </div>
          
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newCountry}
              onChange={e => setNewCountry(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCountry()}
              placeholder="Añadir nuevo país..."
              className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
            />
            <button 
              onClick={handleAddCountry}
              className="flex items-center justify-center px-4 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {countries.map(country => (
              <div key={country} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                <span className="text-sm font-500 text-white">{country}</span>
                <button 
                  onClick={() => handleRemoveCountry(country)}
                  className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {countries.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay países configurados.</p>
            )}
          </div>
        </div>

        {/* Juegos */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Gamepad2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-display text-lg font-600 uppercase tracking-widest text-white">
              Juegos Habilitados
            </h3>
          </div>
          
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newGame}
              onChange={e => setNewGame(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddGame()}
              placeholder="Añadir nuevo juego..."
              className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
            />
            <button 
              onClick={handleAddGame}
              className="flex items-center justify-center px-4 rounded-md bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {games.map(game => (
              <div key={game} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-500 text-white">{game}</span>
                  {game === 'Mobile Legends' && (
                    <span className="text-[10px] uppercase tracking-widest bg-primary/20 text-primary px-2 py-0.5 rounded">Default</span>
                  )}
                </div>
                {game !== 'Mobile Legends' && (
                  <button 
                    onClick={() => handleRemoveGame(game)}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {games.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay juegos configurados.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
