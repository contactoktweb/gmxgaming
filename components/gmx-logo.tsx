import { cn } from '@/lib/utils'

export function GmxLogo({ className, variant = 'header' }: { className?: string, variant?: 'header' | 'footer' }) {
  const imgSrc = variant === 'header' ? '/logos/logo-header.png' : '/logos/logo-footer.png'
  
  return (
    <a href="/#hero" className={cn('group inline-flex items-center', className)} aria-label="GMX Gaming inicio">
      <img 
        src={imgSrc} 
        alt="GMX Gaming Logo" 
        className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
      />
    </a>
  )
}
