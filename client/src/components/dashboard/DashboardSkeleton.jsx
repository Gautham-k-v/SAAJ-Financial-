export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading dashboard</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white xl:col-span-2" />
        <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white xl:col-span-2" />
        <div className="space-y-6">
          <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </div>
      </div>
    </div>
  )
}
