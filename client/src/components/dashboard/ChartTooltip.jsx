import { formatDayMonth } from '../../utils/datetime'
import { formatPaise } from '../../utils/currency'

export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      {label ? <p className="mb-1 text-xs font-medium text-slate-500">{formatDayMonth(label)}</p> : null}
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={`${entry.name}-${entry.dataKey ?? 'value'}`} className="flex items-center justify-between gap-6 text-sm">
            <span className="text-slate-600">{entry.name}</span>
            <span className="font-semibold text-navy-900 tabular-nums">{formatPaise(entry.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
