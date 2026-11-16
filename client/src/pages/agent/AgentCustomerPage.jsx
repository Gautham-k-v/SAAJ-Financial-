import { Link, useParams } from 'react-router-dom'
import { AgentHeader } from '../../components/agent/AgentHeader'
import { LoanStatusBadge } from '../../components/loans/LoanStatusBadge'
import { RepaymentSchedule } from '../../components/loans/RepaymentSchedule'
import { ErrorState } from '../../components/ui/ErrorState'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { actor } from '../../services/access'
import { getCustomer } from '../../services/customerService'
import { listLoans } from '../../services/loanService'
import { assignedCustomerLoans } from '../../utils/agentBook'
import { formatPhone } from '../../utils/customers'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/datetime'

export default function AgentCustomerPage() {
  const { customerId } = useParams()
  const session = actor()
  const loans = assignedCustomerLoans(listLoans(), session.accountId, customerId)
  const customer = loans.length > 0 ? getCustomer(customerId) : null
  const active = loans.filter((loan) => loan.status === 'Active')
  useDocumentTitle(customer ? customer.fullName : 'Customer')

  if (!customer) {
    return (
      <div>
        <AgentHeader />
        <ErrorState title="Customer not assigned" message="This customer is not in your collection book." />
        <Link to="/agent/customers" className={`${buttonClasses({ variant: 'secondary' })} mt-6`}>
          Assigned customers
        </Link>
      </div>
    )
  }

  return (
    <div>
      <AgentHeader />
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">{customer.id}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-900">{customer.fullName}</h1>
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <dl className="grid gap-3 text-sm">
          <Detail label="Phone" value={formatPhone(customer.phone)} />
          <Detail label="Alternate phone" value={customer.alternatePhone ? formatPhone(customer.alternatePhone) : '—'} />
          <Detail label="Address" value={customer.address} />
          <Detail label="Place" value={`${customer.place} · ${customer.pinCode}`} />
          <Detail label="Status" value={customer.status} />
        </dl>
        <a className={`${buttonClasses({ variant: 'secondary' })} mt-4 w-full`} href={`tel:${customer.phone}`}>
          Call customer
        </a>
      </section>
      {active.map((loan) => {
        const next = loan.schedule.find((row) => row.remaining > 0) ?? loan.schedule[0]
        return (
          <section key={loan.id} className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-4">
              <div>
                <p className="font-semibold text-navy-900">{loan.id}</p>
                <p className="text-xs text-slate-500">{formatDisplayDate(loan.startDate)} – {formatDisplayDate(loan.endDate)}</p>
              </div>
              <LoanStatusBadge status={loan.displayStatus} />
            </div>
            <dl className="grid grid-cols-2 gap-3 px-4 pb-4 text-sm">
              <Detail label="Principal" value={formatPaise(loan.principal)} />
              <Detail label="Agreed repayment" value={formatPaise(loan.totalRepayment)} />
              <Detail label="Daily instalment" value={formatPaise(loan.dailyInstalment)} />
              <Detail label="Total repaid" value={formatPaise(loan.totalRepaid)} />
              <Detail label="Outstanding" value={formatPaise(loan.outstanding)} />
            </dl>
            <div className="px-4 pb-4">
              <Link className={`${buttonClasses({ className: 'w-full' })}`} to={`/agent/collections/${loan.id}/${next.number}/record`}>
                Record payment
              </Link>
            </div>
            <RepaymentSchedule schedule={loan.schedule} />
            <div className="border-t border-slate-100 px-4 py-4">
              <h2 className="text-sm font-semibold text-navy-900">Previous payments</h2>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {loan.payments.filter((payment) => payment.type !== 'reversal').length === 0 ? <li>No receipts yet.</li> : null}
                {loan.payments.filter((payment) => payment.type !== 'reversal').map((payment) => (
                  <li key={payment.id}>
                    {formatDisplayDate(payment.paidOn)} · {payment.receiptNumber || payment.id} · {formatPaise(payment.amount)} · {payment.method || 'Cash'} · {payment.status || 'Posted'}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )
      })}
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-navy-900">{value}</dd>
    </div>
  )
}
