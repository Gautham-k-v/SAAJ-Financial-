import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectField } from '../../components/ui/SelectField'
import { TextField } from '../../components/ui/TextField'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { listCustomers } from '../../services/customerService'
import { filterTransactions, listTransactions } from '../../services/paymentService'
import { PAYMENT_METHODS } from '../../utils/collections'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/datetime'

const tones = { Posted: 'teal', Reversed: 'rose', Reversal: 'amber' }

export default function TransactionsPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''
  const method = params.get('method') || ''
  const customerId = params.get('customer') || ''
  const from = params.get('from') || ''
  const to = params.get('to') || ''
  const rows = filterTransactions(listTransactions(), { query, method, customerId, from, to })
  useDocumentTitle('Transactions')

  function update(next) {
    const following = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (!value) following.delete(key)
      else following.set(key, value)
    }
    setParams(following)
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        eyebrow="Book"
        title="Transactions"
        description="Receipts are appended and kept apart from the repayment schedule. These records live in this browser for development, not in a production ledger."
      />

      <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-5">
        <TextField id="transaction-search" label="Search" type="search" value={query} placeholder="Name, loan, receipt, or transaction" onChange={(event) => update({ q: event.target.value })} />
        <TextField id="transaction-from" label="From" type="date" value={from} onChange={(event) => update({ from: event.target.value })} />
        <TextField id="transaction-to" label="To" type="date" value={to} onChange={(event) => update({ to: event.target.value })} />
        <SelectField id="transaction-method" label="Payment method" value={method} onChange={(event) => update({ method: event.target.value })}>
          <option value="">All methods</option>
          {PAYMENT_METHODS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </SelectField>
        <SelectField id="transaction-customer" label="Customer" value={customerId} onChange={(event) => update({ customer: event.target.value })}>
          <option value="">All customers</option>
          {listCustomers().map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.fullName}</option>
          ))}
        </SelectField>
      </div>

      <p className="mb-4 text-sm text-slate-500" role="status">
        {rows.length === 1 ? '1 transaction' : `${rows.length} transactions`}
      </p>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white">
          <EmptyState title="No transactions match" description="Try another customer, method, or date." />
        </div>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {rows.map((payment) => (
              <li key={payment.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy-900">{payment.customerName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{payment.id} · {payment.loanId}</p>
                  </div>
                  <Status payment={payment} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <Field label="Receipt" value={payment.receiptNumber} />
                  <Field label="Amount" value={formatPaise(payment.amount)} />
                  <Field label="Method" value={payment.method} />
                  <Field label="Date" value={formatDisplayDate(payment.paidOn)} />
                  <Field label="Collector" value={payment.collectorName} />
                </dl>
                <Link to={`/transactions/${payment.id}`} className={`${buttonClasses({ variant: 'secondary', size: 'sm' })} mt-4`}>
                  View receipt
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Transaction ID</th>
                  <th className="px-3 py-3 font-medium">Receipt</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Loan</th>
                  <th className="px-3 py-3 font-medium">Amount</th>
                  <th className="px-3 py-3 font-medium">Method</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Collector</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3 text-slate-600">{payment.id}</td>
                    <td className="px-3 py-3 text-slate-600">{payment.receiptNumber}</td>
                    <td className="px-3 py-3 font-semibold text-navy-900">{payment.customerName}</td>
                    <td className="px-3 py-3 text-slate-600">{payment.loanId}</td>
                    <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(payment.amount)}</td>
                    <td className="px-3 py-3 text-slate-600">{payment.method}</td>
                    <td className="px-3 py-3 text-slate-600">{formatDisplayDate(payment.paidOn)}</td>
                    <td className="px-3 py-3 text-slate-600">{payment.collectorName}</td>
                    <td className="px-3 py-3"><Status payment={payment} /></td>
                    <td className="px-5 py-3 text-right">
                      <Link to={`/transactions/${payment.id}`} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                        View receipt
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

function Status({ payment }) {
  const label = payment.type === 'reversal' ? 'Reversal' : payment.status
  return <Badge tone={tones[label] ?? 'slate'}>{label}</Badge>
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-navy-900">{value}</dd>
    </div>
  )
}
