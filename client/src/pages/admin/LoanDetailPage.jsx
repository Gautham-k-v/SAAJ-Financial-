import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarRange, IndianRupee, TriangleAlert, Wallet } from 'lucide-react'
import { CustomerPhoto } from '../../components/customers/CustomerPhoto'
import { CustomerStatusBadge } from '../../components/customers/CustomerStatusBadge'
import { LoanStatusBadge } from '../../components/loans/LoanStatusBadge'
import { RepaymentSchedule } from '../../components/loans/RepaymentSchedule'
import { Card, CardHeader } from '../../components/ui/Card'
import { ErrorState } from '../../components/ui/ErrorState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { Button } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { activateLoan, cancelLoan, getLoan } from '../../services/loanService'
import { formatPhone } from '../../utils/customers'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate, formatTime } from '../../utils/datetime'
import { LoanStateError } from '../../utils/loans'

export default function LoanDetailPage() {
  const { loanId } = useParams()
  const [revision, setRevision] = useState(0)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [actionError, setActionError] = useState('')
  const loan = getLoan(loanId)
  useDocumentTitle(loan ? loan.id : 'Loan')

  if (!loan) {
    return (
      <div className="mx-auto max-w-5xl">
        <ErrorState title="Loan not found" message="This loan ID is not in the loan records." />
        <Link to="/loans" className={`${buttonClasses({ variant: 'secondary' })} mt-6`}>
          Back to loans
        </Link>
      </div>
    )
  }

  function refresh() {
    setRevision((current) => current + 1)
    setConfirmCancel(false)
    setActionError('')
  }

  function run(action) {
    try {
      action(loan.id)
      refresh()
    } catch (error) {
      setActionError(error instanceof LoanStateError ? error.message : 'The loan could not be updated.')
    }
  }

  const canActivate = loan.status === 'Pending'
  const canCancel = loan.status === 'Pending' || loan.status === 'Active'
  const canEdit = loan.status === 'Pending'

  return (
    <div className="mx-auto max-w-5xl" data-revision={revision}>
      <PageHeader
        eyebrow={loan.id}
        title={loan.customerName}
        description={`${loan.repaymentDays} daily instalments · ${formatDisplayDate(loan.startDate)} to ${formatDisplayDate(loan.endDate)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/loans" className={buttonClasses({ variant: 'secondary' })}>
              All loans
            </Link>
            {canEdit ? (
              <Link to={`/loans/${loan.id}/edit`} className={buttonClasses()}>
                Edit terms
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <LoanStatusBadge status={loan.displayStatus} />
        {loan.displayStatus === 'Overdue' ? (
          <p className="text-sm text-rose-700">{formatPaise(loan.overdueAmount)} is past due.</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Outstanding" value={formatPaise(loan.outstanding)} hint="Unpaid scheduled balance" icon={Wallet} tone="navy" />
        <StatCard label="Repaid" value={formatPaise(loan.totalRepaid)} hint="Recorded against instalments" icon={IndianRupee} tone="teal" />
        <StatCard label="Daily instalment" value={formatPaise(loan.dailyInstalment)} hint={`${loan.repaymentDays} repayment days`} icon={CalendarRange} tone="navy" />
        <StatCard
          label="Past due"
          value={formatPaise(loan.overdueAmount)}
          hint={loan.overdueAmount > 0 ? 'Missed instalments' : 'Nothing is past due'}
          icon={TriangleAlert}
          tone={loan.overdueAmount > 0 ? 'amber' : 'teal'}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Customer" description={loan.customerId} />
          <div className="flex items-center gap-4 px-5 py-5">
            <CustomerPhoto name={loan.customerName} size="md" />
            <div className="min-w-0">
              <Link to={`/customers/${loan.customerId}`} className="font-semibold text-navy-900 hover:text-teal-800">
                {loan.customerName}
              </Link>
              <p className="mt-1 text-sm text-slate-600 tabular-nums">
                {loan.customerPhone ? formatPhone(loan.customerPhone) : '—'}
              </p>
              <p className="mt-1 text-sm text-slate-500">{loan.customerPlace || '—'}</p>
              {loan.customerStatus ? (
                <div className="mt-2">
                  <CustomerStatusBadge status={loan.customerStatus} />
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Loan" description={loan.status === 'Pending' ? 'Terms can still be edited.' : 'Terms are fixed.'} />
          <dl className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            <Detail label="Principal" value={formatPaise(loan.principal)} />
            <Detail label="Finance charge" value={formatPaise(loan.financeCharge)} />
            <Detail label="Total repayment" value={formatPaise(loan.totalRepayment)} />
            <Detail label="Daily instalment" value={formatPaise(loan.dailyInstalment)} />
            <Detail label="Start" value={formatDisplayDate(loan.startDate)} />
            <Detail label="End" value={formatDisplayDate(loan.endDate)} />
            <Detail label="Assigned agent" value={loan.agentName} />
            <Detail label="Created" value={formatDisplayDate(loan.createdAt)} />
          </dl>
          <p className="border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
            <span className="font-medium text-navy-900">Remarks. </span>
            {loan.remarks || 'None'}
          </p>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Repayment schedule"
          description="Each instalment is stored on its own. Receipts do not change the expected amount."
        />
        <RepaymentSchedule schedule={loan.schedule} />
      </Card>

      <Card className="mt-6">
        <CardHeader
          title="Payment history"
          description="Receipts stay separate from the schedule. Expected instalment amounts are not rewritten."
        />
        {loan.payments.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">No payments have been recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Instalment</th>
                  <th className="px-3 py-3 font-medium">Amount</th>
                  <th className="px-3 py-3 font-medium">Allocation</th>
                  <th className="px-5 py-3 font-medium">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {loan.payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3 text-slate-600">{formatDisplayDate(payment.paidOn)}</td>
                    <td className="px-3 py-3 text-slate-600 tabular-nums">
                      {payment.allocations?.map((item) => item.instalmentNumber).join(', ') || payment.instalmentNumber || '—'}
                    </td>
                    <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(payment.amount)}</td>
                    <td className="px-3 py-3 text-slate-600">{payment.type === 'reversal' ? 'Reversal' : payment.allocation || payment.status}</td>
                    <td className="px-5 py-3">
                      <Link to={`/transactions/${payment.id}`} className="font-semibold text-teal-800 hover:text-teal-900">
                        {payment.receiptNumber || payment.id}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader title="Audit trail" description="Important changes on this loan." />
        <ol className="divide-y divide-slate-100">
          {loan.audit.map((entry) => (
            <li key={entry.id} className="px-5 py-4">
              <p className="text-sm font-semibold text-navy-900">{entry.action}</p>
              <p className="mt-1 text-sm text-slate-600">{entry.detail}</p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDisplayDate(entry.at.slice(0, 10))} · {formatTime(entry.at)}
              </p>
            </li>
          ))}
        </ol>
      </Card>

      {canActivate || canCancel ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {actionError ? (
            <p className="mb-3 text-sm text-rose-700" role="alert">
              {actionError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            {canActivate ? <Button onClick={() => run(activateLoan)}>Activate loan</Button> : null}
            {canCancel && !confirmCancel ? (
              <Button variant="secondary" onClick={() => setConfirmCancel(true)}>
                Cancel loan
              </Button>
            ) : null}
            {confirmCancel ? (
              <>
                <Button onClick={() => run(cancelLoan)}>Confirm cancellation</Button>
                <Button variant="secondary" onClick={() => setConfirmCancel(false)}>
                  Keep loan
                </Button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-navy-900">{value}</dd>
    </div>
  )
}
