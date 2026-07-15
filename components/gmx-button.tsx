'use client'

import { type ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  children: ReactNode
  href?: string
  variant?: 'primary' | 'secondary'
  className?: string
  arrow?: boolean
  onClick?: () => void
}

export function GmxButton({
  children,
  href = '#registro',
  variant = 'primary',
  className,
  arrow = true,
  onClick,
}: Props) {
  const base =
    'group relative inline-flex items-center justify-center gap-2 overflow-hidden px-7 py-4 font-display text-[13px] font-600 uppercase tracking-[0.18em] transition-colors duration-300 clip-corner sm:text-sm'

  const styles =
    variant === 'primary'
      ? 'bg-primary text-white'
      : 'border border-white/25 bg-transparent text-white hover:text-white'

  return (
    <a href={href} onClick={onClick} className={cn(base, styles, className)} data-cursor>
      {/* Fill sweep */}
      <span
        className={cn(
          'absolute inset-0 -z-0 origin-left scale-x-0 transition-transform duration-400 ease-out group-hover:scale-x-100',
          variant === 'primary' ? 'bg-primary-dark' : 'bg-primary',
        )}
      />
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {arrow && (
          <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        )}
      </span>
    </a>
  )
}
