import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CustomerStatusBadge } from '../../components/customers/CustomerStatusBadge'
import { LedgerHistory } from '../../components/ledger/LedgerHistory'
import { LoanStatusBadge } from '../../components/loans/LoanStatusBadge'
import { Card, CardHeader } from '../../components/ui/Card'
import { ErrorState } from '../../components/ui/ErrorState'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectField } from '../../components/ui/SelectField'
import { StatCard } from '../../components/ui/StatCard'
import { TextField } from '../../components/ui/TextField'
import { Button } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { getCustomer } from '../../services/customerService'
import { listLoans } from '../../services/loanService'
import { formatPhone } from '../../utils/customers'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/datetime'
import { accountEntries, customerPosition, filterEntries, LEDGER_ENTRY_TYPES, pageOf } from '../../utils/ledger'
import { Wallet } from 'lucide-react'

export default function CustomerLedgerPage() {
  const { customerId } = useParams()
  const customer = getCustomer(customerId)
  const loans = listLoans()
  const position = customer ? customerPosition(customer, loans) : null
  const entries = customer ? accountEntries(loans, customer.id) : []
  const [params, setParams] = useSearchParams()
  const filtered = filterEntries(entries, {
    query: params.get('q') || '',
    type: params.get('type') || '',
    from: params.get('from') || '',
    to: params.get('to') || '',
  })
  const paged = pageOf(filtered, params.get('page') || 1)
  useDocumentTitle(customer ? `${customer.fullName} ledger` : 'Customer ledger')

  if (!customer || !position) {
    return (
      <div className="mx-auto max-w-5xl">
        <ErrorState title="Customer not found" message="This customer is not in the ledger." />
        <Link to="/ledger" className={`${buttonClasses({ variant: 'secondary' })} mt-6`}>All customers</Link>
      </div>
    )
  }

  function update(next) {
    const following = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (!value) following.delete(key)
      else following.set(key, value)
    }
    if (!('page' in next)) following.delete('page')
    setParams(following)
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow={customer.id}
        title={customer.fullName}
        description="This ledger uses the same loans and receipt allocations as collections and transactions."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/ledger" className={buttonClasses({ variant: 'secondary' })}>All customers</Link>
            <Link to={`/ledger/${customer.id}/statement`} className={buttonClasses()}>Account statement</Link>
          </div>
        }
      />

      <Card>
        <CardHeader title="Customer" description={customer.id} />
        <dl className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <Detail label="Full name" value={customer.fullName} />
          <Detail label="Phone" value={formatPhone(customer.phone)} />
          <Detail label="Address" value={customerAddress(customer)} />
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Status</dt>
            <dd className="mt-1"><CustomerStatusBadge status={customer.status} /></dd>
          </div>
        </dl>
      </Card>

      <div className="my-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Principal borrowed" value={formatPaise(position.principal)} hint="Active, completed, and collected loans" icon={Wallet} tone="navy" />
        <StatCard label="Agreed repayment" value={formatPaise(position.agreed)} hint="Contract total" icon={Wallet} tone="navy" />
        <StatCard label="Amount repaid" value={formatPaise(position.repaid)} hint="Allocated receipts" icon={Wallet} tone="teal" />
        <StatCard label="Remaining repayment" value={formatPaise(position.outstanding)} hint="Same figure as the loan book" icon={Wallet} tone="amber" />
        <StatCard label="Active loans" value={String(position.activeLoans)} hint="Includes loans shown as overdue" icon={Wallet} tone="teal" />
        <StatCard label="Completed loans" value={String(position.completedLoans)} hint="Fully repaid contracts" icon={Wallet} tone="navy" />
      </div>

      <Card>
        <CardHeader title="Loans" description="Each loan keeps its own schedule. Pending loans are listed and stay out of the balance until activation." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Loan</th>
                <th className="px-3 py-3 font-medium">Principal</th>
                <th className="px-3 py-3 font-medium">Finance</th>
                <th className="px-3 py-3 font-medium">Agreed</th>
                <th className="px-3 py-3 font-medium">Daily</th>
                <th className="px-3 py-3 font-medium">Paid</th>
                <th className="px-3 py-3 font-medium">Outstanding</th>
                <th className="px-3 py-3 font-medium">Start</th>
                <th className="px-3 py-3 font-medium">End</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {position.loans.map((loan) => (
                <tr key={loan.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-3 font-semibold text-navy-900">{loan.id}</td>
                  <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(loan.principal)}</td>
                  <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(loan.financeCharge)}</td>
                  <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(loan.totalRepayment)}</td>
                  <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(loan.dailyInstalment)}</td>
                  <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(loan.totalRepaid)}</td>
                  <td className="px-3 py-3 font-medium text-navy-900 tabular-nums">{formatPaise(loan.outstanding)}</td>
                  <td className="px-3 py-3 text-slate-600">{formatDisplayDate(loan.startDate)}</td>
                  <td className="px-3 py-3 text-slate-600">{formatDisplayDate(loan.endDate)}</td>
                  <td className="px-3 py-3"><LoanStatusBadge status={loan.displayStatus} /></td>
                  <td className="px-5 py-3 text-right">
                    <Link to={`/ledger/${customer.id}/${loan.id}`} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                      Open ledger
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Transaction history" description="Running balance is the book balance after that entry. Filtering does not rewrite it." />
        <div className="grid gap-3 border-b border-slate-100 px-5 py-4 md:grid-cols-4">
          <TextField id="entry-search" label="Search" type="search" value={params.get('q') || ''} onChange={(event) => update({ q: event.target.value })} />
          <SelectField id="entry-type" label="Type" value={params.get('type') || ''} onChange={(event) => update({ type: event.target.value })}>
            <option value="">All</option>
            <option value="Payments">All payments</option>
            {LEDGER_ENTRY_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </SelectField>
          <TextField id="entry-from" label="From" type="date" value={params.get('from') || ''} onChange={(event) => update({ from: event.target.value })} />
          <TextField id="entry-to" label="To" type="date" value={params.get('to') || ''} onChange={(event) => update({ to: event.target.value })} />
        </div>
        <LedgerHistory entries={paged.items} />
        <div className="flex items-center justify-between gap-3 px-5 py-4 text-sm text-slate-600">
          <p>{filtered.length === 1 ? '1 entry' : `${filtered.length} entries`}</p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={paged.page <= 1} onClick={() => update({ page: String(paged.page - 1), q: params.get('q') || '', type: params.get('type') || '', from: params.get('from') || '', to: params.get('to') || '' })}>
              Previous
            </Button>
            <span>Page {paged.page} of {paged.pages}</span>
            <Button variant="secondary" size="sm" disabled={paged.page >= paged.pages} onClick={() => update({ page: String(paged.page + 1), q: params.get('q') || '', type: params.get('type') || '', from: params.get('from') || '', to: params.get('to') || '' })}>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function customerAddress(customer) {
  const parts = [customer.address, customer.place, customer.pinCode].filter(Boolean)
  const unique = []
  for (const part of parts) {
    if (!unique.some((item) => item.includes(part))) unique.push(part)
  }
  return unique.join(', ')
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-navy-900">{value}</dd>
    </div>
  )
}
