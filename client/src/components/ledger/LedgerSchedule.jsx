import { CollectionStatusBadge } from '../collections/CollectionStatusBadge'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/datetime'

export function LedgerSchedule({ rows, selected, onSelect }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-slate-500">
          <tr className="border-b border-slate-100">
            <th className="px-5 py-3 font-medium">No.</th>
            <th className="px-3 py-3 font-medium">Due date</th>
            <th className="px-3 py-3 font-medium">Expected</th>
            <th className="px-3 py-3 font-medium">Paid</th>
            <th className="px-3 py-3 font-medium">Remaining</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Allocation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.number} className={`border-b border-slate-100 last:border-0 ${selected === row.number ? 'bg-teal-50' : ''}`}>
              <td className="px-5 py-3 text-slate-600 tabular-nums">{row.number}</td>
              <td className="px-3 py-3 text-slate-600">{formatDisplayDate(row.dueDate)}</td>
              <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(row.expected)}</td>
              <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(row.paid)}</td>
              <td className="px-3 py-3 font-medium text-navy-900 tabular-nums">{formatPaise(row.remaining)}</td>
              <td className="px-3 py-3">
                <CollectionStatusBadge status={row.paymentStatus} />
              </td>
              <td className="px-5 py-3">
                <button type="button" className="font-semibold text-teal-800 hover:text-teal-900" onClick={() => onSelect(row.number)}>
                  {selected === row.number ? 'Hide' : 'View'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
