'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { translations, type Language } from './i18n/translations'

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  setLanguage: (lang: Language) => void
  toggleLang: () => void
  t: (key: string, fallback?: string) => string
  d: (typeof translations)['es'] | (typeof translations)['en']
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'gmx_lang'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('es')
  const [mounted, setMounted] = useState(false)

  // Initialize from localStorage or cookie on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Language | null
      if (stored === 'es' || stored === 'en') {
        setLangState(stored)
        document.documentElement.lang = stored
      } else {
        setLangState('es')
        document.documentElement.lang = 'es'
      }
    } catch {
      // Ignore localStorage read errors in SSR/strict privacy modes
    }
    setMounted(true)
  }, [])

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang)
    try {
      localStorage.setItem(STORAGE_KEY, newLang)
      document.cookie = `${STORAGE_KEY}=${newLang}; path=/; max-age=31536000; SameSite=Lax`
      document.documentElement.lang = newLang
    } catch {
      // Ignore write errors
    }
  }, [])

  const toggleLang = useCallback(() => {
    setLangState(prev => {
      const next = prev === 'es' ? 'en' : 'es'
      try {
        localStorage.setItem(STORAGE_KEY, next)
        document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`
        document.documentElement.lang = next
      } catch {}
      return next
    })
  }, [])

  const currentDict = useMemo(() => {
    return translations[lang] || translations.es
  }, [lang])

  // Helper function to resolve dot-notated paths e.g. "hero.welcomeBadge"
  const t = useCallback((path: string, fallback?: string): string => {
    const keys = path.split('.')
    let current: any = translations[lang] || translations.es

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        // Fallback to Spanish dictionary if not found in current language
        let fallbackCurrent: any = translations.es
        for (const fbKey of keys) {
          if (fallbackCurrent && typeof fallbackCurrent === 'object' && fbKey in fallbackCurrent) {
            fallbackCurrent = fallbackCurrent[fbKey]
          } else {
            fallbackCurrent = undefined
            break
          }
        }
        return typeof fallbackCurrent === 'string' ? fallbackCurrent : (fallback || path)
      }
    }

    return typeof current === 'string' ? current : (fallback || path)
  }, [lang])

  const contextValue = useMemo(() => ({
    lang,
    setLang,
    setLanguage: setLang,
    toggleLang,
    t,
    d: currentDict
  }), [lang, setLang, toggleLang, t, currentDict])

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
