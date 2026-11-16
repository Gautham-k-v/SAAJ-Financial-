import { Badge } from '../ui/Badge'
import { Card, CardHeader } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { formatPaise } from '../../utils/currency'
import { formatTime } from '../../utils/datetime'

const allocationTones = {
  Full: 'teal',
  Partial: 'amber',
  Advance: 'navy',
}

export function RecentTransactions({ transactions }) {
  return (
    <Card className="xl:col-span-2">
      <CardHeader
        title="Recent transactions"
        description="Receipts posted on this date. Each one keeps its own transaction and receipt number."
      />
      {transactions.length === 0 ? (
        <EmptyState title="No receipts yet" description="Posted payments will appear here with their receipt numbers." />
      ) : (
        <>
          <ul className="divide-y divide-slate-100 md:hidden">
            {transactions.map((transaction) => (
              <li key={transaction.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-navy-900">{transaction.customerName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{transaction.customerId}</p>
                  </div>
                  <p className="font-semibold text-navy-900 tabular-nums">{formatPaise(transaction.amount)}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <Badge tone={allocationTones[transaction.allocation] ?? 'slate'}>{transaction.allocation}</Badge>
                  <span>{transaction.method}</span>
                  <span>{formatTime(transaction.recordedAt)}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {transaction.receiptNumber} · {transaction.loanId} · {transaction.collectorName}
                </p>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Receipt</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Loan</th>
                  <th className="px-3 py-3 font-medium">Collector</th>
                  <th className="px-3 py-3 font-medium">Method</th>
                  <th className="px-3 py-3 font-medium">Time</th>
                  <th className="px-3 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{transaction.receiptNumber}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-navy-900">{transaction.customerName}</p>
                      <p className="text-xs text-slate-500">{transaction.customerId}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{transaction.loanId}</td>
                    <td className="px-3 py-3 text-slate-600">{transaction.collectorName}</td>
                    <td className="px-3 py-3 text-slate-600">{transaction.method}</td>
                    <td className="px-3 py-3 text-slate-600 tabular-nums">{formatTime(transaction.recordedAt)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-navy-900 tabular-nums">
                      {formatPaise(transaction.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={allocationTones[transaction.allocation] ?? 'slate'}>{transaction.allocation}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}
