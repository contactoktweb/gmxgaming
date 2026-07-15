'use client'

import { motion, type Variants } from 'motion/react'
import { type ElementType } from 'react'

type Props = {
  text: string
  as?: ElementType
  className?: string
  variant?: 'title' | 'subtitle'
  stagger?: number
  delay?: number
  amount?: number
  /** Split multi-line strings on "\n" so each line wraps as a block */
  lines?: string[]
}

/**
 * Title:    initial translateX(-7px), opacity 0.3 -> translateX(0), opacity 1
 * Subtitle: initial translateX(7px),  opacity 0   -> translateX(0), opacity 1
 * Animates per-character with a short stagger when it enters ~70-85% of viewport.
 */
export function SplitText({
  text,
  as: Tag = 'span',
  className,
  variant = 'title',
  stagger = 0.03,
  delay = 0,
  amount = 0.6,
  lines,
}: Props) {
  const from =
    variant === 'title'
      ? { opacity: 0.3, x: -7 }
      : { opacity: 0, x: 7 }

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
  }
  const child: Variants = {
    hidden: from,
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  }

  const rows = lines ?? [text]

  const MotionTag = motion(Tag as ElementType)

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={container}
      aria-label={rows.join(' ')}
    >
      {rows.map((row, ri) => (
        <span key={ri} className="block" aria-hidden="true">
          {Array.from(row).map((char, ci) => (
            <motion.span
              key={`${ri}-${ci}`}
              variants={child}
              className="inline-block whitespace-pre"
              style={{ willChange: 'transform, opacity' }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </span>
      ))}
    </MotionTag>
  )
}
