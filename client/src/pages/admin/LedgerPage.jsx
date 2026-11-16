import { Link, useSearchParams } from 'react-router-dom'
import { CustomerStatusBadge } from '../../components/customers/CustomerStatusBadge'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectField } from '../../components/ui/SelectField'
import { TextField } from '../../components/ui/TextField'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { listCustomers } from '../../services/customerService'
import { listLoans } from '../../services/loanService'
import { formatPhone } from '../../utils/customers'
import { formatPaise } from '../../utils/currency'
import { ledgerBook } from '../../utils/ledger'

export default function LedgerPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''
  const status = params.get('status') || 'All'
  const sort = params.get('sort') || 'outstanding'
  const rows = ledgerBook(listCustomers(), listLoans(), { query, status, sort })
  useDocumentTitle('Customer ledger')

  function update(next) {
    const following = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === 'All' || (key === 'sort' && value === 'outstanding')) following.delete(key)
      else following.set(key, value)
    }
    setParams(following)
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        eyebrow="Book"
        title="Customer ledger"
        description="Balances are the outstanding amounts already calculated from each loan’s payment allocations."
      />
      <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <TextField id="ledger-search" label="Search" type="search" value={query} placeholder="Customer name or phone number" onChange={(event) => update({ q: event.target.value })} />
        <SelectField id="ledger-status" label="Customer status" value={status} onChange={(event) => update({ status: event.target.value })}>
          <option value="All">All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </SelectField>
        <SelectField id="ledger-sort" label="Sort by outstanding" value={sort} onChange={(event) => update({ sort: event.target.value })}>
          <option value="outstanding">Highest outstanding</option>
          <option value="name">Customer name</option>
        </SelectField>
      </div>
      <p className="mb-4 text-sm text-slate-500" role="status">
        {rows.length === 1 ? '1 customer' : `${rows.length} customers`}
      </p>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white">
          <EmptyState title="No customers match" description="Try another name, phone number, or status." />
        </div>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {rows.map((row) => (
              <li key={row.customer.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy-900">{row.customer.fullName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{row.customer.id}</p>
                  </div>
                  <CustomerStatusBadge status={row.customer.status} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <Field label="Phone" value={formatPhone(row.customer.phone)} />
                  <Field label="Borrowed" value={formatPaise(row.principal)} />
                  <Field label="Repaid" value={formatPaise(row.repaid)} />
                  <Field label="Outstanding" value={formatPaise(row.outstanding)} />
                  <Field label="Active loans" value={String(row.activeLoans)} />
                </dl>
                <Link to={`/ledger/${row.customer.id}`} className={`${buttonClasses({ variant: 'secondary', size: 'sm' })} mt-4`}>
                  View ledger
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Customer ID</th>
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Phone</th>
                  <th className="px-3 py-3 font-medium">Borrowed</th>
                  <th className="px-3 py-3 font-medium">Repaid</th>
                  <th className="px-3 py-3 font-medium">Outstanding</th>
                  <th className="px-3 py-3 font-medium">Active loans</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.customer.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3 text-slate-600">{row.customer.id}</td>
                    <td className="px-3 py-3 font-semibold text-navy-900">{row.customer.fullName}</td>
                    <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPhone(row.customer.phone)}</td>
                    <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(row.principal)}</td>
                    <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(row.repaid)}</td>
                    <td className="px-3 py-3 font-medium text-navy-900 tabular-nums">{formatPaise(row.outstanding)}</td>
                    <td className="px-3 py-3 text-slate-600 tabular-nums">{row.activeLoans}</td>
                    <td className="px-3 py-3"><CustomerStatusBadge status={row.customer.status} /></td>
                    <td className="px-5 py-3 text-right">
                      <Link to={`/ledger/${row.customer.id}`} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                        View ledger
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-navy-900">{value}</dd>
    </div>
  )
}
