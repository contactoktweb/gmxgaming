'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  name: string
  required?: boolean
  accept?: string
  icon?: React.ReactNode
}

export function FileUpload({ 
  name, 
  required, 
  accept = "image/jpeg,image/png,image/gif,application/pdf,.jpg,.jpeg,.jpe,.png,.gif,.pdf", 
  icon 
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setError(null)
    
    if (!file) {
      setPreview(null)
      setFileName(null)
      return
    }

    // Tamaño máximo: 5MB (5 * 1024 * 1024)
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo supera el tamaño máximo de 5MB.')
      setPreview(null)
      setFileName(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setFileName(file.name)

    // Previsualización si es imagen
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    } else {
      setPreview(null) // Para PDFs no hay previsualización directa aquí
    }
  }

  const clearFile = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPreview(null)
    setFileName(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <div className={cn(
        "group relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-background px-6 py-10 transition-colors",
        error ? "border-red-500" : "border-border hover:border-primary hover:bg-primary/5",
        fileName ? "cursor-default" : "cursor-pointer"
      )}>
        
        {preview ? (
          <div className="relative w-full flex justify-center">
             <img src={preview} alt="Vista previa" className="max-h-48 object-contain rounded-md" />
             <button type="button" onClick={clearFile} className="absolute -top-4 -right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white transition-transform hover:scale-110 shadow-lg">
               <X className="w-5 h-5" />
             </button>
          </div>
        ) : fileName ? (
          <div className="relative flex w-full flex-col items-center gap-3">
            <FileText className="h-10 w-10 text-primary" />
            <p className="text-sm font-medium text-white text-center break-all px-4">{fileName}</p>
            <button type="button" onClick={clearFile} className="absolute -top-4 -right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white transition-transform hover:scale-110 shadow-lg">
               <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 text-muted-foreground transition-colors group-hover:text-primary pointer-events-none">
              {icon || <Upload className="h-10 w-10" />}
            </div>
            <p className="text-center text-sm text-white pointer-events-none">
              <span className="font-600 text-primary">Haz clic para cargar</span> o arrastra un archivo aquí
            </p>
            <p className="mt-1 text-xs text-muted-foreground pointer-events-none">Tamaño máximo: 5MB</p>
          </>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          name={name}
          required={required && !fileName}
          accept={accept}
          onChange={handleFileChange}
          className={cn(
            "absolute inset-0 z-0 h-full w-full cursor-pointer opacity-0",
            fileName && "pointer-events-none"
          )}
        />
      </div>
      {error && <p className="text-xs font-500 text-red-500">{error}</p>}
    </div>
  )
}
