const tones = {
  teal: 'bg-teal-50 text-teal-800',
  amber: 'bg-amber-50 text-amber-800',
  navy: 'bg-navy-100 text-navy-800',
  rose: 'bg-rose-50 text-rose-800',
  slate: 'bg-slate-100 text-slate-700',
}

export function Badge({ tone = 'slate', children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}
