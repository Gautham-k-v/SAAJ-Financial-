import { Link } from 'react-router-dom'
import { LoanStatusBadge } from './LoanStatusBadge'
import { EmptyState } from '../ui/EmptyState'
import { buttonClasses } from '../ui/buttonStyles'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/datetime'

export function LoanList({ loans }) {
  if (loans.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white">
        <EmptyState title="No loans match" description="Try another loan ID, customer, or status." />
      </div>
    )
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {loans.map((loan) => (
          <li key={loan.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link to={`/loans/${loan.id}`} className="font-semibold text-navy-900 hover:text-teal-800">
                  {loan.customerName}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500">{loan.id}</p>
              </div>
              <LoanStatusBadge status={loan.displayStatus} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Daily instalment</dt>
                <dd className="mt-0.5 font-medium text-navy-900 tabular-nums">{formatPaise(loan.dailyInstalment)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Outstanding</dt>
                <dd className="mt-0.5 font-medium text-navy-900 tabular-nums">{formatPaise(loan.outstanding)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Duration</dt>
                <dd className="mt-0.5 text-slate-600">{loan.repaymentDays} days</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Agent</dt>
                <dd className="mt-0.5 text-slate-600">{loan.agentName}</dd>
              </div>
            </dl>
            <Link to={`/loans/${loan.id}`} className={`${buttonClasses({ variant: 'secondary', size: 'sm' })} mt-4`}>
              View loan
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 font-medium">Loan</th>
              <th className="px-3 py-3 font-medium">Customer</th>
              <th className="px-3 py-3 font-medium">Principal</th>
              <th className="px-3 py-3 font-medium">Finance</th>
              <th className="px-3 py-3 font-medium">Total</th>
              <th className="px-3 py-3 font-medium">Daily</th>
              <th className="px-3 py-3 font-medium">Duration</th>
              <th className="px-3 py-3 font-medium">Start</th>
              <th className="px-3 py-3 font-medium">End</th>
              <th className="px-3 py-3 font-medium">Outstanding</th>
              <th className="px-3 py-3 font-medium">Agent</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-5 py-3 font-semibold text-navy-900">
                  <Link to={`/loans/${loan.id}`} className="hover:text-teal-800">
                    {loan.id}
                  </Link>
                </td>
                <td className="px-3 py-3 text-slate-700">{loan.customerName}</td>
                <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(loan.principal)}</td>
                <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(loan.financeCharge)}</td>
                <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(loan.totalRepayment)}</td>
                <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(loan.dailyInstalment)}</td>
                <td className="px-3 py-3 text-slate-600">{loan.repaymentDays} days</td>
                <td className="px-3 py-3 text-slate-600">{formatDisplayDate(loan.startDate)}</td>
                <td className="px-3 py-3 text-slate-600">{formatDisplayDate(loan.endDate)}</td>
                <td className="px-3 py-3 font-medium text-navy-900 tabular-nums">{formatPaise(loan.outstanding)}</td>
                <td className="px-3 py-3 text-slate-600">{loan.agentName}</td>
                <td className="px-3 py-3">
                  <LoanStatusBadge status={loan.displayStatus} />
                </td>
                <td className="px-5 py-3 text-right">
                  <Link to={`/loans/${loan.id}`} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
