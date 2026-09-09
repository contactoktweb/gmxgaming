'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit, ExternalLink, Image as ImageIcon, Upload, Save, X, ArrowUp, ArrowDown, Handshake, Globe, Check, AlertCircle, Eye } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { GmxButton } from '@/components/gmx-button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PARTNERS, PartnerSponsor } from '@/lib/site-data'

export function AdminSponsors() {
  const [sponsors, setSponsors] = useState<PartnerSponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<PartnerSponsor>({
    name: '',
    image_url: '',
    url: ''
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchSponsors()
  }, [])

  const fetchSponsors = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'sponsors')
        .maybeSingle()

      if (data && Array.isArray(data.value) && data.value.length > 0) {
        setSponsors(data.value)
      } else {
        // Fallback default
        setSponsors(PARTNERS)
      }
    } catch (err: any) {
      console.error('Error fetching sponsors:', err)
      setSponsors(PARTNERS)
    } finally {
      setLoading(false)
    }
  }

  const persistSponsors = async (newList: PartnerSponsor[]) => {
    setSaving(true)
    try {
      const { error } = await supabase.from('app_settings').upsert({
        id: 'sponsors',
        value: newList
      })

      if (error) {
        toast.error('Error al guardar en la base de datos: ' + error.message)
      } else {
        setSponsors(newList)
      }
    } catch (err: any) {
      toast.error('Error inesperado al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenNew = () => {
    setEditingIndex(null)
    setFormData({
      name: '',
      image_url: '',
      url: ''
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (index: number) => {
    setEditingIndex(index)
    setFormData({ ...sponsors[index] })
    setIsModalOpen(true)
  }

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    setUploadingImage(true)
    toast.loading('Subiendo imagen del sponsor...', { id: 'upload-sponsor-img' })

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `sponsor-${Date.now()}.${fileExt}`
      
      const { error: uploadError, data } = await supabase.storage
        .from('teams')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicUrlData } = supabase.storage
        .from('teams')
        .getPublicUrl(data.path)

      const finalUrl = publicUrlData.publicUrl
      setFormData(prev => ({ ...prev, image_url: finalUrl }))
      toast.success('Imagen subida correctamente', { id: 'upload-sponsor-img' })
    } catch (err: any) {
      console.error('Error uploading image:', err)
      toast.error('Error al subir la imagen: ' + (err?.message || 'Error desconocido'), { id: 'upload-sponsor-img' })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      toast.error('El nombre del sponsor (Alt) es obligatorio')
      return
    }

    let formattedUrl = formData.url.trim()
    if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`
    }

    const newSponsorItem: PartnerSponsor = {
      id: formData.id || `sponsor-${Date.now()}`,
      name: trimmedName,
      image_url: formData.image_url?.trim() || '',
      url: formattedUrl
    }

    let updatedList: PartnerSponsor[]
    if (editingIndex !== null) {
      updatedList = [...sponsors]
      updatedList[editingIndex] = newSponsorItem
      toast.success('Sponsor actualizado')
    } else {
      updatedList = [...sponsors, newSponsorItem]
      toast.success('Sponsor agregado')
    }

    setIsModalOpen(false)
    await persistSponsors(updatedList)
  }

  const handleDelete = async (index: number) => {
    const updatedList = sponsors.filter((_, idx) => idx !== index)
    setDeleteConfirm(null)
    toast.success('Sponsor eliminado')
    await persistSponsors(updatedList)
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === sponsors.length - 1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const updatedList = [...sponsors]
    const temp = updatedList[index]
    updatedList[index] = updatedList[targetIndex]
    updatedList[targetIndex] = temp

    await persistSponsors(updatedList)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white flex items-center gap-2.5">
                <Handshake className="w-6 h-6 text-primary" />
                Sponsors & Patrocinadores
              </h2>
              <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-600 text-primary">
                {sponsors.length} Total
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
              Administra los sponsors, logos con texto alternativo (Alt) y enlaces de redirección externa (`_blank`) del carrusel.
            </p>
          </div>

          <GmxButton onClick={handleOpenNew} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Agregar Sponsor
          </GmxButton>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <p className="text-muted-foreground animate-pulse">Cargando sponsors...</p>
          </div>
        ) : sponsors.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl bg-background/50 p-8">
            <Handshake className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-display text-lg font-700 uppercase text-white mb-1">Sin Sponsors Registrados</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
              Agrega patrocinadores con su imagen, texto descriptivo (Alt) y URL de redirección.
            </p>
            <GmxButton onClick={handleOpenNew} variant="secondary" className="gap-2 text-xs">
              <Plus className="w-4 h-4" /> Registrar Primer Sponsor
            </GmxButton>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sponsors.map((sponsor, index) => (
              <div 
                key={sponsor.id || index}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-background p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
              >
                <div>
                  {/* Top Preview */}
                  <div className="relative h-28 w-full rounded-lg border border-border/80 bg-surface/80 flex items-center justify-center p-4 mb-4 overflow-hidden group-hover:border-primary/30 transition-colors">
                    {sponsor.image_url ? (
                      <img 
                        src={sponsor.image_url} 
                        alt={sponsor.name} 
                        className="max-h-full max-w-full object-contain filter drop-shadow transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-center">
                        <span className="font-display text-base font-700 uppercase tracking-tight text-white/70">
                          {sponsor.name}
                        </span>
                        <span className="block text-[10px] text-muted-foreground mt-1">(Solo texto / Sin imagen)</span>
                      </div>
                    )}

                    {/* Order Badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[10px] font-mono text-muted-foreground">
                      #{index + 1}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display font-700 text-white text-base truncate" title={sponsor.name}>
                        {sponsor.name}
                      </h3>
                      <span className="text-[10px] uppercase font-600 px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                        Alt: {sponsor.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                      <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                      {sponsor.url ? (
                        <a 
                          href={sponsor.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="truncate hover:text-primary transition-colors hover:underline text-white/90"
                          title="Abrir enlace en nueva pestaña"
                        >
                          {sponsor.url}
                        </a>
                      ) : (
                        <span className="text-muted-foreground/60 italic">Sin enlace de redirección</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Controls & Actions */}
                <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0 || saving}
                      title="Mover a la izquierda / arriba"
                      className="p-1.5 rounded border border-border bg-surface text-muted-foreground hover:text-white hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === sponsors.length - 1 || saving}
                      title="Mover a la derecha / abajo"
                      className="p-1.5 rounded border border-border bg-surface text-muted-foreground hover:text-white hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {sponsor.url && (
                      <a
                        href={sponsor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Probar enlace en nueva pestaña"
                        className="p-1.5 rounded border border-border bg-surface text-primary hover:bg-primary/10 hover:border-primary transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleOpenEdit(index)}
                      title="Editar Sponsor"
                      className="p-1.5 rounded border border-border bg-surface text-muted-foreground hover:text-white hover:border-primary transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(index)}
                      title="Eliminar Sponsor"
                      className="p-1.5 rounded border border-border bg-surface text-muted-foreground hover:text-red-400 hover:border-red-500/50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Agregar / Editar Sponsor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !uploadingImage && setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border p-6 bg-surface">
              <h3 className="font-display text-xl font-700 uppercase tracking-tight text-white flex items-center gap-2">
                <Handshake className="w-5 h-5 text-primary" />
                {editingIndex !== null ? 'Editar Sponsor' : 'Nuevo Sponsor'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-5">
              {/* Nombre / Alt */}
              <div className="space-y-1.5">
                <label className="block text-xs font-700 uppercase tracking-wider text-primary">
                  Nombre del Sponsor (Texto Alt) <span className="text-red-400">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: HYPERPLAY, REDBYTE, FED. MX ESPORTS..."
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-muted-foreground">
                  Este texto se usará como etiqueta y atributo accesible <code className="text-primary font-mono">alt="{formData.name || 'nombre'}"</code> en el logo.
                </p>
              </div>

              {/* Imagen / Logo */}
              <div className="space-y-2">
                <label className="block text-xs font-700 uppercase tracking-wider text-primary">
                  Logo / Imagen del Sponsor
                </label>
                
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="flex flex-col items-center justify-center h-28 rounded-lg border-2 border-dashed border-border bg-background hover:border-primary/50 cursor-pointer transition-colors p-3 text-center">
                      <Upload className="w-5 h-5 text-primary mb-1" />
                      <span className="text-xs font-semibold text-white">Subir archivo</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">PNG, SVG, JPG o WebP</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex flex-col justify-center">
                    <input 
                      type="url"
                      value={formData.image_url}
                      onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="O ingresa URL de imagen (https://...)"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      Fondo transparente (PNG/SVG) recomendado para mejor integración.
                    </p>
                  </div>
                </div>

                {/* Live Preview */}
                {formData.image_url && (
                  <div className="rounded-lg border border-border bg-background/80 p-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-10 rounded border border-border bg-surface flex items-center justify-center p-1 overflow-hidden">
                        <img 
                          src={formData.image_url} 
                          alt={formData.name || 'Preview'} 
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white block truncate max-w-[200px]">
                          {formData.name || 'Vista previa del logo'}
                        </span>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Imagen cargada
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="text-xs text-muted-foreground hover:text-red-400 p-1"
                      title="Quitar imagen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Link de Redirección */}
              <div className="space-y-1.5">
                <label className="block text-xs font-700 uppercase tracking-wider text-primary">
                  Link de Redirección (URL) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    value={formData.url}
                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://ejemplo.com/patrocinador"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                  />
                  {formData.url && (
                    <a
                      href={formData.url.startsWith('http') ? formData.url : `https://${formData.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-white transition-colors"
                      title="Probar en nueva pestaña"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span>ℹ️</span> Al hacer clic sobre el sponsor, <strong>se abrirá este enlace en una nueva pestaña</strong> (`target="_blank"`).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-white rounded-lg border border-border hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <GmxButton type="submit" disabled={uploadingImage || saving} className="gap-2 px-5">
                  <Save className="w-4 h-4" />
                  {editingIndex !== null ? 'Actualizar Sponsor' : 'Guardar Sponsor'}
                </GmxButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm rounded-xl border border-red-500/30 bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4 border border-red-500/20">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-700 uppercase tracking-tight text-white mb-2">
              ¿Eliminar Sponsor?
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Estás a punto de eliminar a <strong className="text-white">{sponsors[deleteConfirm]?.name}</strong> del carrusel de patrocinadores.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-lg border border-border text-xs font-semibold uppercase text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold uppercase text-white transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
