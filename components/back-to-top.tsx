'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp } from 'lucide-react'

export function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.a
          href="#hero"
          aria-label="Volver arriba"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ duration: 0.3 }}
          className="group fixed bottom-6 right-6 z-[800] flex h-12 w-12 items-center justify-center bg-primary text-white shadow-lg shadow-primary/30 transition-colors hover:bg-primary-dark clip-corner"
        >
          <ArrowUp className="size-5 transition-transform duration-300 group-hover:-translate-y-1" />
        </motion.a>
      )}
    </AnimatePresence>
  )
}
