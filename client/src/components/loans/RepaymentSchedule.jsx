import { InstalmentStatusBadge } from './LoanStatusBadge'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/datetime'

export function RepaymentSchedule({ schedule }) {
  return (
    <div className="max-h-[28rem] overflow-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="sticky top-0 bg-white text-xs uppercase tracking-wide text-slate-500">
          <tr className="border-b border-slate-100">
            <th className="px-5 py-3 font-medium">No.</th>
            <th className="px-3 py-3 font-medium">Due date</th>
            <th className="px-3 py-3 font-medium">Expected</th>
            <th className="px-3 py-3 font-medium">Paid</th>
            <th className="px-3 py-3 font-medium">Remaining</th>
            <th className="px-5 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row) => (
            <tr key={row.number} className="border-b border-slate-100 last:border-0">
              <td className="px-5 py-3 font-medium text-navy-900 tabular-nums">{row.number}</td>
              <td className="px-3 py-3 text-slate-600">{formatDisplayDate(row.dueDate)}</td>
              <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(row.expected)}</td>
              <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(row.paid)}</td>
              <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(row.remaining)}</td>
              <td className="px-5 py-3">
                <InstalmentStatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
