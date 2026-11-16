import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatPaise, formatPaiseCompact } from '../../utils/currency'
import { formatDayMonth } from '../../utils/datetime'
import { Card, CardHeader } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { ChartTooltip } from './ChartTooltip'

export function CollectionChart({ series, period }) {
  return (
    <Card className="xl:col-span-2">
      <CardHeader
        title="Daily collection"
        description="Expected book and amount received. These stay separate from individual receipts."
      />
      {series.length === 0 ? (
        <EmptyState
          title="No collection days"
          description="The daily chart appears when the sample book has a schedule."
        />
      ) : (
        <div className="px-2 py-4 sm:px-4">
          <p className="sr-only">
            Collected {formatPaise(period.collected)} of {formatPaise(period.expected)} expected from{' '}
            {formatDayMonth(period.from)} to {formatDayMonth(period.to)}.
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} barGap={4} barCategoryGap="28%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e6ebf2" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDayMonth}
                  interval="preserveStartEnd"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={formatPaiseCompact}
                  width={56}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip content={ChartTooltip} cursor={{ fill: 'rgba(12, 35, 65, 0.04)' }} />
                <Bar dataKey="expected" name="Expected" fill="#d7e0ea" radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Bar dataKey="collected" name="Collected" fill="#0f766e" radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-4 px-2 text-xs text-slate-500">
            <LegendDot color="#d7e0ea" label="Expected" />
            <LegendDot color="#0f766e" label="Collected" />
          </div>
        </div>
      )}
    </Card>
  )
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}
