import { cn } from '@/lib/utils'

export function GmxLogo({ className }: { className?: string }) {
  return (
    <a href="#hero" className={cn('group inline-flex items-center gap-2.5', className)} aria-label="GMX Gaming inicio">
      <span className="flex h-9 w-9 items-center justify-center bg-primary font-display text-lg font-700 leading-none text-white clip-corner transition-transform duration-300 group-hover:scale-105">
        G
      </span>
      <span className="font-display text-xl font-700 uppercase leading-none tracking-tight text-white">
        GMX<span className="text-primary">.</span>
      </span>
    </a>
  )
}
