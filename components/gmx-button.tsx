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
  onClick?: (e?: any) => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  as?: 'a' | 'button'
}

export function GmxButton({
  children,
  href,
  variant = 'primary',
  className,
  arrow = true,
  onClick,
  disabled = false,
  type,
  as,
}: Props) {
  const base =
    'group relative inline-flex items-center justify-center gap-2 overflow-hidden px-7 py-4 font-display text-[13px] font-600 uppercase tracking-[0.18em] transition-colors duration-300 clip-corner sm:text-sm cursor-pointer'

  const styles =
    variant === 'primary'
      ? 'bg-primary text-white'
      : 'border border-white/25 bg-transparent text-white hover:text-white'

  const inner = (
    <>
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
    </>
  )

  const isButton = as === 'button' || Boolean(type) || (!href && Boolean(onClick))

  if (isButton) {
    return (
      <button
        type={type || 'button'}
        onClick={onClick}
        disabled={disabled}
        aria-disabled={disabled}
        className={cn(base, styles, disabled && 'cursor-not-allowed opacity-50 pointer-events-none', className)}
        data-cursor={disabled ? undefined : ''}
      >
        {inner}
      </button>
    )
  }

  return (
    <a
      href={disabled ? undefined : (href || '#registro')}
      onClick={disabled ? (e) => e.preventDefault() : onClick}
      aria-disabled={disabled}
      className={cn(base, styles, disabled && 'cursor-not-allowed opacity-50 pointer-events-none', className)}
      data-cursor={disabled ? undefined : ''}
    >
      {inner}
    </a>
  )
}

