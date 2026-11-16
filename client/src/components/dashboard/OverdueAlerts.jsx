import { Badge } from '../ui/Badge'
import { Card, CardHeader } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { formatPaise } from '../../utils/currency'

const severityTones = {
  high: 'rose',
  medium: 'amber',
  low: 'slate',
}

export function OverdueAlerts({ items, total }) {
  return (
    <Card>
      <CardHeader
        title="Overdue payment alerts"
        description={items.length === 0 ? 'No open alerts' : `${formatPaise(total)} still open from earlier days`}
      />
      {items.length === 0 ? (
        <EmptyState
          title="No overdue instalments"
          description="Missed instalments from earlier days will be listed here."
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.loanId} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy-900">{item.customerName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {item.locality} · {item.loanId}
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-navy-900 tabular-nums">{formatPaise(item.amount)}</p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone={severityTones[item.severity] ?? 'slate'}>
                  {item.daysOverdue === 1 ? '1 day overdue' : `${item.daysOverdue} days overdue`}
                </Badge>
                <span className="text-xs text-slate-500">{item.collectorName}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
