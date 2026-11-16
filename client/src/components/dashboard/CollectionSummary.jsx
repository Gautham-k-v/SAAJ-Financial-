import { Banknote, Building2, Smartphone } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import { formatCount, formatPaise, formatPercent } from '../../utils/currency'

const channelIcons = {
  Cash: Banknote,
  UPI: Smartphone,
  'Bank transfer': Building2,
}

export function CollectionSummary({ data }) {
  const rows = [
    { label: 'Expected', value: data.book.expectedToday },
    { label: 'Collected', value: data.book.collectedToday },
    { label: 'Pending', value: data.pendingToday },
  ]
  const rate = Math.min(data.collectionRate, 1) * 100

  return (
    <Card>
      <CardHeader
        title="Today’s collection summary"
        description={`${formatCount(data.book.receiptsPosted)} receipts in the sample book`}
      />
      <div className="space-y-5 px-5 py-4">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Collection rate</span>
            <span className="font-semibold text-navy-900 tabular-nums">{formatPercent(data.collectionRate)}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-700" style={{ width: `${rate}%` }} />
          </div>
        </div>

        <dl className="space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <dt className="text-slate-500">{row.label}</dt>
              <dd className="font-semibold text-navy-900 tabular-nums">{formatPaise(row.value)}</dd>
            </div>
          ))}
          {data.advanceToday > 0 ? (
            <div className="flex items-center justify-between text-sm">
              <dt className="text-slate-500">Advance over today’s book</dt>
              <dd className="font-semibold text-navy-900 tabular-nums">{formatPaise(data.advanceToday)}</dd>
            </div>
          ) : null}
        </dl>

        <div className="space-y-3 border-t border-slate-100 pt-4">
          {data.channels.map((channel) => {
            const Icon = channelIcons[channel.method] ?? Banknote
            const width = data.book.collectedToday === 0 ? 0 : (channel.amount / data.book.collectedToday) * 100
            return (
              <div key={channel.method}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 text-slate-600">
                    <Icon className="h-4 w-4 text-teal-700" aria-hidden="true" />
                    {channel.method}
                  </span>
                  <span className="font-medium text-navy-900 tabular-nums">{formatPaise(channel.amount)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-navy-800" style={{ width: `${width}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
