'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false)
  const [active, setActive] = useState(false)
  const [hidden, setHidden] = useState(true)

  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  const springX = useSpring(cursorX, { stiffness: 350, damping: 30, mass: 0.4 })
  const springY = useSpring(cursorY, { stiffness: 350, damping: 30, mass: 0.4 })

  useEffect(() => {
    const isFine = window.matchMedia('(pointer: fine)').matches
    if (!isFine) return
    setEnabled(true)

    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
      setHidden(false)
      const el = e.target as HTMLElement
      const interactive = el.closest('a, button, [data-cursor], input, textarea, label, [role="button"]')
      setActive(Boolean(interactive))
    }
    const leave = () => setHidden(true)

    window.addEventListener('mousemove', move, { passive: true })
    window.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseleave', leave)
    }
  }, [cursorX, cursorY])

  if (!enabled) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-300" style={{ opacity: hidden ? 0 : 1 }}>
      {/* Animated glowing trailing aura that follows the native mouse pointer */}
      <motion.div
        className="fixed left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border pointer-events-none transition-[width,height,opacity,border-color,background-color] duration-200"
        style={{
          x: springX,
          y: springY,
          width: active ? 46 : 28,
          height: active ? 46 : 28,
          borderColor: active ? 'rgba(255, 45, 32, 0.75)' : 'rgba(255, 45, 32, 0.3)',
          backgroundColor: active ? 'rgba(255, 45, 32, 0.08)' : 'transparent',
          opacity: active ? 0.9 : 0.45,
        }}
      />
    </div>
  )
}
