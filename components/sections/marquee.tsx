import { useLanguage } from '@/lib/language-context'

function Row({
  items,
  direction,
  variant,
}: {
  items: readonly string[]
  direction: 'left' | 'right'
  variant: 'red' | 'dark'
}) {
  const doubled = [...items, ...items]
  return (
    <div
      className={
        variant === 'red'
          ? 'flex overflow-hidden bg-primary py-3.5 sm:py-4 text-white'
          : 'flex overflow-hidden border-y border-border bg-deep py-3.5 sm:py-4 text-white'
      }
    >
      <div
        className={`flex shrink-0 items-center gap-10 pr-10 ${
          direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'
        }`}
      >
        {doubled.map((item, i) => (
          <div key={i} className="flex shrink-0 items-center gap-10">
            <span className="font-display text-2xl font-700 uppercase tracking-tight sm:text-3xl">
              {item}
            </span>
            <span
              className={
                variant === 'red'
                  ? 'flex h-3 w-3 shrink-0 rotate-45 bg-white/70'
                  : 'flex h-3 w-3 shrink-0 rotate-45 bg-primary'
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function MarqueeBand() {
  const { d } = useLanguage()

  return (
    <section aria-hidden className="relative">
      <Row items={d.marquee.line1} direction="left" variant="red" />
      <Row items={d.marquee.line2} direction="right" variant="dark" />
    </section>
  )
}
