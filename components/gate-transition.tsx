'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'

type GateState = 'idle' | 'closed' | 'open'

interface GateTransitionContextType {
  navigate: (href: string) => void
  isTransitioning: boolean
}

const GateTransitionContext = createContext<GateTransitionContextType>({
  navigate: () => {},
  isTransitioning: false,
})

export const useGateTransition = () => useContext(GateTransitionContext)

export function GateTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  const [gateState, setGateState] = useState<GateState>('idle')
  const isNavigatingRef = useRef(false)
  const isClosedRef = useRef(false)
  const pageReadyRef = useRef(false)
  const timersRef = useRef<NodeJS.Timeout[]>([])

  const clearAllTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
  }

  // Abre las compuertas para revelar la nueva página ya montada
  const triggerOpen = useCallback(() => {
    clearAllTimers()
    setGateState('open')

    const t = setTimeout(() => {
      setGateState('idle')
      isNavigatingRef.current = false
      isClosedRef.current = false
      pageReadyRef.current = false
    }, 420)
    timersRef.current.push(t)
  }, [])

  // Iniciar transición sincronizada con la carga real de la página
  const navigate = useCallback(
    (href: string) => {
      if (isNavigatingRef.current) return
      if (href === pathnameRef.current || (href === '/' && pathnameRef.current === '/')) return

      isNavigatingRef.current = true
      isClosedRef.current = false
      pageReadyRef.current = false
      clearAllTimers()

      // 1. Iniciar cambio de ruta en Next.js
      router.push(href)

      // 2. Cerrar compuertas de forma suave
      setGateState('closed')

      // La animación de cierre tarda 380ms en encajar completamente al centro
      const tClose = setTimeout(() => {
        isClosedRef.current = true

        // Si la nueva página ya terminó de renderizarse mientras se cerraba, abrimos de inmediato
        if (pageReadyRef.current) {
          triggerOpen()
        }
      }, 380)
      timersRef.current.push(tClose)

      // Fallback de seguridad por si la red demora o no hay cambio de pathname
      const tFallback = setTimeout(() => {
        if (isNavigatingRef.current) {
          triggerOpen()
        }
      }, 1500)
      timersRef.current.push(tFallback)
    },
    [router, triggerOpen],
  )

  // Cuando Next.js monta oficialmente la nueva página y actualiza el pathname:
  useEffect(() => {
    if (isNavigatingRef.current) {
      pageReadyRef.current = true

      // Si las compuertas ya están totalmente cerradas en el centro, abrimos para revelar la nueva página
      if (isClosedRef.current) {
        const t = setTimeout(() => {
          triggerOpen()
        }, 50)
        timersRef.current.push(t)
      }
    }
  }, [pathname, triggerOpen])

  // Interceptar clicks en enlaces internos
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return
      }

      const target = e.target as HTMLElement | null
      const anchor = target?.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return

      const currentUrl = new URL(window.location.href)
      let targetUrlObj: URL
      try {
        targetUrlObj = new URL(href, window.location.origin)
      } catch {
        return
      }

      if (targetUrlObj.origin !== currentUrl.origin) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return

      if (
        targetUrlObj.pathname === currentUrl.pathname &&
        targetUrlObj.search === currentUrl.search
      ) {
        return
      }

      e.preventDefault()
      navigate(href)
    }

    document.addEventListener('click', handleDocumentClick, { capture: true })
    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true })
      clearAllTimers()
    }
  }, [navigate])

  const isActive = gateState !== 'idle'

  // Diagonal interlocking cut paths
  const topClipPath =
    'polygon(0% 0%, 100% 0%, 100% 65%, 64% 50%, 58% 55%, 42% 47%, 36% 43%, 0% 35%)'

  const bottomClipPath =
    'polygon(0% 35%, 36% 43%, 42% 47%, 58% 55%, 64% 50%, 100% 65%, 100% 100%, 0% 100%)'

  return (
    <GateTransitionContext.Provider value={{ navigate, isTransitioning: isActive }}>
      {children}

      {/* Gate Transition Overlay */}
      <AnimatePresence>
        {isActive && (
          <div
            className={`fixed inset-0 z-[99999] overflow-hidden ${
              gateState === 'open' ? 'pointer-events-none' : 'pointer-events-auto'
            }`}
            aria-hidden="true"
          >
            {/* Base sólida oscura de fondo */}
            <div className="absolute inset-0 z-20 bg-[#09090b]" />

            {/* TOP GATE PANEL (div recortado en diagonal superior) */}
            <motion.div
              className="absolute inset-0 z-30 overflow-hidden will-change-transform shadow-[0_10px_40px_rgba(0,0,0,0.8)] pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, #09090b 0%, #121217 75%, #1c0b0b 100%)',
                clipPath: topClipPath,
              }}
              initial={{ y: '-101%' }}
              animate={{ y: gateState === 'closed' ? '0%' : '-101%' }}
              transition={{
                duration: 0.38,
                ease: [0.25, 1, 0.4, 1],
              }}
            >
              {/* Subtle Red Neon Seam on contact edge */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                viewBox="0 0 1000 1000"
                preserveAspectRatio="none"
              >
                <polyline
                  points="0,350 360,430 420,470 580,550 640,500 1000,650"
                  fill="none"
                  stroke="#ff2d20"
                  strokeWidth="2.5"
                  className="opacity-90"
                />
              </svg>
            </motion.div>

            {/* BOTTOM GATE PANEL (div recortado en diagonal inferior) */}
            <motion.div
              className="absolute inset-0 z-30 overflow-hidden will-change-transform shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pointer-events-none"
              style={{
                background: 'linear-gradient(0deg, #09090b 0%, #121217 75%, #1c0b0b 100%)',
                clipPath: bottomClipPath,
              }}
              initial={{ y: '101%' }}
              animate={{ y: gateState === 'closed' ? '0%' : '101%' }}
              transition={{
                duration: 0.38,
                ease: [0.25, 1, 0.4, 1],
              }}
            >
              {/* Subtle Red Neon Seam on contact edge */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                viewBox="0 0 1000 1000"
                preserveAspectRatio="none"
              >
                <polyline
                  points="0,350 360,430 420,470 580,550 640,500 1000,650"
                  fill="none"
                  stroke="#ff2d20"
                  strokeWidth="2.5"
                  className="opacity-90"
                />
              </svg>
            </motion.div>

            {/* Seam Collision Glow Flash */}
            {gateState === 'closed' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0.4] }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-6 z-35 bg-gradient-to-r from-transparent via-primary/50 to-transparent blur-md pointer-events-none"
              />
            )}
          </div>
        )}
      </AnimatePresence>
    </GateTransitionContext.Provider>
  )
}
