import { Link } from 'react-router-dom'
import { CustomerPhoto } from './CustomerPhoto'
import { CustomerStatusBadge } from './CustomerStatusBadge'
import { EmptyState } from '../ui/EmptyState'
import { buttonClasses } from '../ui/buttonStyles'
import { formatPhone } from '../../utils/customers'
import { formatDisplayDate } from '../../utils/datetime'

export function CustomerList({ customers }) {
  if (customers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white">
        <EmptyState
          title="No customers match"
          description="Try another name, phone number, or status."
        />
      </div>
    )
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {customers.map((customer) => (
          <li key={customer.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <CustomerPhoto name={customer.fullName} photograph={customer.photograph} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/customers/${customer.id}`} className="font-semibold text-navy-900 hover:text-teal-800">
                      {customer.fullName}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">{customer.id}</p>
                  </div>
                  <CustomerStatusBadge status={customer.status} />
                </div>
                <p className="mt-3 text-sm text-slate-600 tabular-nums">{formatPhone(customer.phone)}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {customer.place} · {customer.pinCode}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link to={`/customers/${customer.id}`} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                View
              </Link>
              <Link
                to={`/customers/${customer.id}/edit`}
                className={buttonClasses({ variant: 'secondary', size: 'sm' })}
              >
                Edit
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-3 py-3 font-medium">Phone</th>
              <th className="px-3 py-3 font-medium">Place</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <CustomerPhoto name={customer.fullName} photograph={customer.photograph} size="sm" />
                    <div>
                      <Link to={`/customers/${customer.id}`} className="font-semibold text-navy-900 hover:text-teal-800">
                        {customer.fullName}
                      </Link>
                      <p className="text-xs text-slate-500">{customer.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPhone(customer.phone)}</td>
                <td className="px-3 py-3 text-slate-600">
                  {customer.place}
                  <span className="mt-0.5 block text-xs text-slate-500">{customer.pinCode}</span>
                </td>
                <td className="px-3 py-3">
                  <CustomerStatusBadge status={customer.status} />
                </td>
                <td className="px-3 py-3 text-slate-600">{formatDisplayDate(customer.createdAt)}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={`/customers/${customer.id}`}
                      className={buttonClasses({ variant: 'secondary', size: 'sm' })}
                    >
                      View
                    </Link>
                    <Link
                      to={`/customers/${customer.id}/edit`}
                      className={buttonClasses({ variant: 'secondary', size: 'sm' })}
                    >
                      Edit
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
