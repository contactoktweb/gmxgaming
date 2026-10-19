export default function TeamDetailsLoading() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16 animate-pulse">
          <div className="w-40 h-40 rounded-full bg-white/5 shrink-0" />
          <div className="flex-1 space-y-4">
            <div className="h-6 w-32 bg-white/10 rounded-full" />
            <div className="h-12 w-64 bg-white/10 rounded" />
            <div className="flex gap-8 pt-4">
              <div className="h-10 w-24 bg-white/5 rounded" />
              <div className="h-10 w-28 bg-white/5 rounded" />
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-8 animate-pulse">
            <div className="h-8 w-44 bg-white/10 rounded mb-8" />
            <div className="grid sm:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border">
                  <div className="w-16 h-16 rounded-lg bg-white/5 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 bg-white/10 rounded" />
                    <div className="h-3 w-16 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-1 rounded-2xl border border-border bg-surface p-6 animate-pulse">
            <div className="h-6 w-36 bg-white/10 rounded mb-6" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-background border border-border" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
