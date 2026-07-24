'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

// Global Lenis instance to allow external control (e.g., pausing when a modal is open)
declare global {
  interface Window {
    __lenis?: Lenis
  }
}

export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
      // Allow native scroll inside elements marked with data-lenis-prevent
      prevent: (node: Element) => {
        return node.closest('[data-lenis-prevent]') !== null
      },
    })

    // Expose instance globally so modals can pause/resume it
    window.__lenis = lenis

    let rafId = 0
    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    // Intercept anchor links for smooth in-page navigation
    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!target) return
      const id = target.getAttribute('href')
      if (!id || id === '#') return
      const el = document.querySelector(id)
      if (el) {
        e.preventDefault()
        lenis.scrollTo(el as HTMLElement, { offset: -80 })
      }
    }
    document.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('click', onClick)
      window.__lenis = undefined
      lenis.destroy()
    }
  }, [])

  return null
}
