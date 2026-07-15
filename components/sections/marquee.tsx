'use client'

const LINE_ONE = ['GMX GAMING', 'AQUÍ COMIENZA EL CAMINO', 'SUPERA TUS LÍMITES', 'COMPITE. CRECE. DOMINA.']
const LINE_TWO = ['TORNEOS DE ESPORTS', 'MOBILE LEGENDS', 'COMPETENCIA DE ALTO NIVEL', 'CONVIÉRTETE EN UNA ESTRELLA']

function Row({
  items,
  direction,
  variant,
}: {
  items: string[]
  direction: 'left' | 'right'
  variant: 'red' | 'dark'
}) {
  const doubled = [...items, ...items]
  return (
    <div
      className={
        variant === 'red'
          ? 'flex overflow-hidden bg-primary py-5 text-white'
          : 'flex overflow-hidden border-y border-border bg-deep py-5 text-white'
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
  return (
    <section aria-hidden className="relative">
      <Row items={LINE_ONE} direction="left" variant="red" />
      <Row items={LINE_TWO} direction="right" variant="dark" />
    </section>
  )
}
