'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false)
  const [active, setActive] = useState(false)
  const [hidden, setHidden] = useState(true)

  const dotX = useMotionValue(-100)
  const dotY = useMotionValue(-100)
  const ringX = useSpring(dotX, { stiffness: 300, damping: 28, mass: 0.5 })
  const ringY = useSpring(dotY, { stiffness: 300, damping: 28, mass: 0.5 })

  useEffect(() => {
    const isFine = window.matchMedia('(pointer: fine)').matches
    if (!isFine) return
    setEnabled(true)
    document.documentElement.classList.add('custom-cursor-active')

    const move = (e: MouseEvent) => {
      dotX.set(e.clientX)
      dotY.set(e.clientY)
      setHidden(false)
      const el = e.target as HTMLElement
      const interactive = el.closest('a, button, [data-cursor], input, textarea, label')
      setActive(Boolean(interactive))
    }
    const leave = () => setHidden(true)

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseleave', leave)
      document.documentElement.classList.remove('custom-cursor-active')
    }
  }, [dotX, dotY])

  if (!enabled) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999]" style={{ opacity: hidden ? 0 : 1 }}>
      <motion.div
        className="fixed left-0 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
        style={{ x: dotX, y: dotY }}
      />
      <motion.div
        className="fixed left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-[width,height,opacity,border-color] duration-200"
        style={{
          x: ringX,
          y: ringY,
          width: active ? 52 : 30,
          height: active ? 52 : 30,
          borderColor: active ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
          opacity: active ? 0.9 : 0.5,
        }}
      />
    </div>
  )
}
