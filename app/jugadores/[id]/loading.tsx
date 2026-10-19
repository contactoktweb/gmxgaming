export default function PlayerDetailLoading() {
  return (
    <div className="min-h-screen bg-deep pt-24 pb-32">
      {/* Banner Skeleton */}
      <div className="relative overflow-hidden border-b border-border bg-surface px-5 py-24 lg:px-10">
        <div className="container relative z-10 mx-auto max-w-5xl flex flex-col items-center gap-8 sm:flex-row sm:items-end animate-pulse">
          <div className="h-48 w-48 shrink-0 rounded border-4 border-border bg-deep/80 shadow-2xl" />
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left space-y-4 flex-1">
            <div className="h-6 w-28 bg-white/10 rounded" />
            <div className="h-12 w-64 bg-white/10 rounded" />
            <div className="flex gap-4 pt-2">
              <div className="h-9 w-24 bg-white/5 rounded-md border border-border" />
              <div className="h-9 w-24 bg-white/5 rounded-md border border-border" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto mt-16 max-w-5xl px-5 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Left Column: Info & Game Stats */}
          <div className="flex flex-col gap-8 lg:col-span-1">
            <div className="rounded-xl border border-border bg-surface p-6 shadow-xl animate-pulse space-y-6">
              <div className="h-6 w-36 bg-white/10 rounded" />
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-white/5 rounded" />
                  <div className="h-5 w-32 bg-white/10 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-white/5 rounded" />
                  <div className="h-6 w-28 bg-white/5 rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Teams & Contracts */}
          <div className="flex flex-col gap-12 lg:col-span-2">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-48 bg-white/10 rounded" />
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-5">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded bg-deep border border-border" />
                    <div className="space-y-2">
                      <div className="h-5 w-36 bg-white/10 rounded" />
                      <div className="h-4 w-24 bg-white/5 rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-20 rounded bg-white/5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
