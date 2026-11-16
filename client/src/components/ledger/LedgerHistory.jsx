import { Link } from 'react-router-dom'
import { Badge } from '../ui/Badge'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/datetime'

const tones = {
  Disbursement: 'navy',
  Payment: 'teal',
  'Partial payment': 'amber',
  'Advance payment': 'navy',
  Reversal: 'rose',
  Adjustment: 'slate',
}

export function LedgerHistory({ entries }) {
  if (entries.length === 0) {
    return <p className="px-5 py-6 text-sm text-slate-500">No entries match these filters.</p>
  }

  return (
    <>
      <ul className="divide-y divide-slate-100 md:hidden">
        {entries.map((entry) => (
          <li key={entry.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge tone={tones[entry.kind] ?? 'slate'}>{entry.kind}</Badge>
                <p className="mt-2 text-sm font-medium text-navy-900">{entry.description}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDisplayDate(entry.date)} · {entry.transactionId} · {entry.receiptNumber}
                </p>
              </div>
              <p className="text-sm font-semibold text-navy-900 tabular-nums">{formatPaise(entry.balance)}</p>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Debit {entry.debit ? formatPaise(entry.debit) : '—'} · Credit {entry.credit ? formatPaise(entry.credit) : '—'} · {entry.method} · {entry.collector}
            </p>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-3 py-3 font-medium">Transaction</th>
              <th className="px-3 py-3 font-medium">Receipt</th>
              <th className="px-3 py-3 font-medium">Description</th>
              <th className="px-3 py-3 font-medium">Debit</th>
              <th className="px-3 py-3 font-medium">Credit</th>
              <th className="px-3 py-3 font-medium">Balance</th>
              <th className="px-3 py-3 font-medium">Method</th>
              <th className="px-5 py-3 font-medium">Collector</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-slate-100 last:border-0">
                <td className="px-5 py-3 text-slate-600">{formatDisplayDate(entry.date)}</td>
                <td className="px-3 py-3 text-slate-600">{entry.transactionId}</td>
                <td className="px-3 py-3 text-slate-600">
                  {entry.receiptNumber !== '—' && entry.kind !== 'Reversal' && entry.kind !== 'Disbursement' && entry.kind !== 'Adjustment' ? (
                    <Link to={`/transactions/${entry.transactionId}`} className="font-semibold text-teal-800 hover:text-teal-900">
                      {entry.receiptNumber}
                    </Link>
                  ) : (
                    entry.receiptNumber
                  )}
                </td>
                <td className="px-3 py-3">
                  <Badge tone={tones[entry.kind] ?? 'slate'}>{entry.kind}</Badge>
                  <p className="mt-1 text-xs text-slate-500">{entry.description}</p>
                </td>
                <td className="px-3 py-3 text-slate-600 tabular-nums">{entry.debit ? formatPaise(entry.debit) : '—'}</td>
                <td className="px-3 py-3 text-slate-600 tabular-nums">{entry.credit ? formatPaise(entry.credit) : '—'}</td>
                <td className="px-3 py-3 font-medium text-navy-900 tabular-nums">{formatPaise(entry.balance)}</td>
                <td className="px-3 py-3 text-slate-600">{entry.method}</td>
                <td className="px-5 py-3 text-slate-600">{entry.collector}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

