import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartTooltip } from '../dashboard/ChartTooltip'
import { Card, CardHeader } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { formatPaiseCompact } from '../../utils/currency'

export function ReportChart({ title, description, data, bars, xKey = 'label' }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      {data.length === 0 ? (
        <EmptyState title="No figures in this period" description="The chart appears when the book has activity in the selected dates." />
      ) : (
        <div className="px-2 py-4 sm:px-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={4} barCategoryGap="28%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e6ebf2" />
                <XAxis dataKey={xKey} interval="preserveStartEnd" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tickFormatter={formatPaiseCompact} width={56} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip content={ChartTooltip} cursor={{ fill: 'rgba(12, 35, 65, 0.04)' }} />
                {bars.map((bar) => (
                  <Bar key={bar.key} dataKey={bar.key} name={bar.name} fill={bar.fill} radius={[4, 4, 0, 0]} maxBarSize={18} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 px-2 text-xs text-slate-500">
            {bars.map((bar) => (
              <span key={bar.key} className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: bar.fill }} />
                {bar.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
