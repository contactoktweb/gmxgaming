'use client'

import { motion, type Variants } from 'motion/react'
import { type ReactNode } from 'react'

type Direction = 'up' | 'left' | 'right' | 'fade' | 'scale'

const OFFSET = 60

function variantsFor(direction: Direction): Variants {
  const hidden: Record<string, number> = { opacity: 0 }
  if (direction === 'up') hidden.y = OFFSET
  if (direction === 'left') hidden.x = -OFFSET
  if (direction === 'right') hidden.x = OFFSET
  if (direction === 'scale') hidden.scale = 0.92
  return {
    hidden,
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
    },
  }
}

export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.7,
  className,
  amount = 0.3,
  once = true,
}: {
  children: ReactNode
  direction?: Direction
  delay?: number
  duration?: number
  className?: string
  amount?: number
  once?: boolean
}) {
  return (
    <motion.div
      className={className}
      variants={variantsFor(direction)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function Stagger({
  children,
  className,
  stagger = 0.12,
  amount = 0.2,
  once = true,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  amount?: number
  once?: boolean
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  direction = 'up',
  duration = 0.7,
  className,
}: {
  children: ReactNode
  direction?: Direction
  duration?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      variants={variantsFor(direction)}
      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
