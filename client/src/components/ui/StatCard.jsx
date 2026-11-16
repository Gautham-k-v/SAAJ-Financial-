const tones = {
  navy: 'bg-navy-100 text-navy-800',
  teal: 'bg-teal-50 text-teal-700',
  amber: 'bg-amber-50 text-amber-700',
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'navy' }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-[1.65rem] font-semibold leading-none tracking-tight text-navy-900 tabular-nums">
        {value}
      </p>
      <p className="mt-3 text-xs text-slate-500">{hint}</p>
    </article>
  )
}
