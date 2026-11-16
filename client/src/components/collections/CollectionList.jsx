import { Link } from 'react-router-dom'
import { CollectionStatusBadge } from './CollectionStatusBadge'
import { EmptyState } from '../ui/EmptyState'
import { buttonClasses } from '../ui/buttonStyles'
import { formatPhone } from '../../utils/customers'
import { formatPaise } from '../../utils/currency'

export function CollectionList({ rows, date }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white">
        <EmptyState title="No collections match" description="Try another date, customer, phone number, or status." />
      </div>
    )
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link to={detailPath(row, date)} className="font-semibold text-navy-900 hover:text-teal-800">
                  {row.customerName}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500">
                  {row.customerId} · {row.loanId}
                </p>
              </div>
              <CollectionStatusBadge status={row.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Expected</dt>
                <dd className="mt-0.5 font-medium text-navy-900 tabular-nums">{formatPaise(row.expected)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Remaining</dt>
                <dd className="mt-0.5 font-medium text-navy-900 tabular-nums">{formatPaise(row.remaining)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Phone</dt>
                <dd className="mt-0.5 text-slate-600 tabular-nums">{formatPhone(row.phone)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Agent</dt>
                <dd className="mt-0.5 text-slate-600">{row.agentName}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={detailPath(row, date)} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                View
              </Link>
              <Link to={recordPath(row, date)} className={buttonClasses({ size: 'sm' })}>
                Record payment
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 font-medium">Customer ID</th>
              <th className="px-3 py-3 font-medium">Customer</th>
              <th className="px-3 py-3 font-medium">Phone</th>
              <th className="px-3 py-3 font-medium">Loan</th>
              <th className="px-3 py-3 font-medium">Expected</th>
              <th className="px-3 py-3 font-medium">Collected</th>
              <th className="px-3 py-3 font-medium">Remaining</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Agent</th>
              <th className="px-5 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-5 py-3 text-slate-600">{row.customerId}</td>
                <td className="px-3 py-3 font-semibold text-navy-900">
                  <Link to={detailPath(row, date)} className="hover:text-teal-800">
                    {row.customerName}
                  </Link>
                </td>
                <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPhone(row.phone)}</td>
                <td className="px-3 py-3 text-slate-600">{row.loanId}</td>
                <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(row.expected)}</td>
                <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(row.collected)}</td>
                <td className="px-3 py-3 font-medium text-navy-900 tabular-nums">{formatPaise(row.remaining)}</td>
                <td className="px-3 py-3">
                  <CollectionStatusBadge status={row.status} />
                </td>
                <td className="px-3 py-3 text-slate-600">{row.agentName}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <Link to={detailPath(row, date)} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                      View
                    </Link>
                    <Link to={recordPath(row, date)} className={buttonClasses({ size: 'sm' })}>
                      Record
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function detailPath(row, date) {
  return `/collections/${row.loanId}/${row.instalmentNumber}?date=${date}`
}

function recordPath(row, date) {
  return `/collections/${row.loanId}/${row.instalmentNumber}/record?date=${date}`
}
