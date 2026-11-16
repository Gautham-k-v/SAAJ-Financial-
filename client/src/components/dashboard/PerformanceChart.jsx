import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatPaise, formatPercent } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/datetime'
import { Card, CardHeader } from '../ui/Card'
import { ChartTooltip } from './ChartTooltip'

export function PerformanceChart({ period }) {
  const segments = [
    { name: 'Collected', amount: period.collected, color: '#0f766e' },
    { name: 'Shortfall', amount: period.shortfall, color: '#14345c' },
  ]
  const hasBook = period.expected > 0

  return (
    <Card>
      <CardHeader
        title="Collection performance"
        description={`${formatDisplayDate(period.from)} – ${formatDisplayDate(period.to)}`}
      />
      <div className="px-5 py-4">
        <div className="relative h-56">
          {hasBook ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  dataKey="amount"
                  nameKey="name"
                  innerRadius={68}
                  outerRadius={88}
                  paddingAngle={3}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {segments.map((segment) => (
                    <Cell key={segment.name} fill={segment.color} />
                  ))}
                </Pie>
                <Tooltip content={ChartTooltip} />
              </PieChart>
            </ResponsiveContainer>
          ) : null}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-semibold tracking-tight text-navy-900 tabular-nums">
              {formatPercent(period.rate)}
            </p>
            <p className="text-xs text-slate-500">collected</p>
          </div>
        </div>
        <ul className="mt-2 space-y-3">
          {segments.map((segment) => (
            <li key={segment.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                {segment.name}
              </span>
              <span className="font-semibold text-navy-900 tabular-nums">{formatPaise(segment.amount)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
