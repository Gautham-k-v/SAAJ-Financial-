import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LedgerHistory } from '../../components/ledger/LedgerHistory'
import { LedgerSchedule } from '../../components/ledger/LedgerSchedule'
import { LoanStatusBadge } from '../../components/loans/LoanStatusBadge'
import { Card, CardHeader } from '../../components/ui/Card'
import { ErrorState } from '../../components/ui/ErrorState'
import { PageHeader } from '../../components/ui/PageHeader'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { getLoan } from '../../services/loanService'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/datetime'
import { accountEntries, instalmentAllocations, scheduleRows } from '../../utils/ledger'

export default function LoanLedgerPage() {
  const { customerId, loanId } = useParams()
  const loan = getLoan(loanId)
  const [selected, setSelected] = useState(null)
  useDocumentTitle(loan ? `${loan.id} ledger` : 'Loan ledger')

  if (!loan || loan.customerId !== customerId) {
    return (
      <div className="mx-auto max-w-5xl">
        <ErrorState title="Loan ledger not found" message="This loan does not belong to the selected customer." />
        <Link to={`/ledger/${customerId}`} className={`${buttonClasses({ variant: 'secondary' })} mt-6`}>
          Customer ledger
        </Link>
      </div>
    )
  }

  const entries = accountEntries([loan], loan.customerId, loan.id)
  const rows = scheduleRows(loan)
  const allocations = selected ? instalmentAllocations(loan, selected) : []

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow={loan.customerName}
        title={loan.id}
        description="Instalment totals are the allocated receipt amounts. The schedule’s expected amounts stay as agreed."
        actions={
          <Link to={`/ledger/${loan.customerId}`} className={buttonClasses({ variant: 'secondary' })}>
            Customer ledger
          </Link>
        }
      />
      <div className="mb-6 flex items-center gap-3">
        <LoanStatusBadge status={loan.displayStatus} />
        <p className="text-sm text-slate-600">Outstanding {formatPaise(loan.outstanding)}</p>
      </div>

      <Card>
        <CardHeader title="Loan" description={`${formatDisplayDate(loan.startDate)} – ${formatDisplayDate(loan.endDate)}`} />
        <dl className="grid gap-4 px-5 py-5 sm:grid-cols-3">
          <Detail label="Principal" value={formatPaise(loan.principal)} />
          <Detail label="Finance charge" value={formatPaise(loan.financeCharge)} />
          <Detail label="Agreed repayment" value={formatPaise(loan.totalRepayment)} />
          <Detail label="Daily instalment" value={formatPaise(loan.dailyInstalment)} />
          <Detail label="Total paid" value={formatPaise(loan.totalRepaid)} />
          <Detail label="Outstanding" value={formatPaise(loan.outstanding)} />
        </dl>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Repayment schedule" description="Paid, partial, unpaid, and overdue come from the due date and the allocated amount." />
        <LedgerSchedule
          rows={rows}
          selected={selected}
          onSelect={(number) => setSelected((current) => (current === number ? null : number))}
        />
        {selected ? (
          <div className="border-t border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-navy-900">Instalment {selected} allocations</h3>
            {allocations.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No receipt has been allocated to this instalment.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {allocations.map((item) => (
                  <li key={`${item.paymentId}-${item.amount}`}>
                    <Link to={`/transactions/${item.paymentId}`} className="font-semibold text-teal-800 hover:text-teal-900">
                      {item.receiptNumber}
                    </Link>
                    {' · '}
                    {formatDisplayDate(item.paidOn)} · {formatPaise(item.amount)} · {item.method}
                    {item.counts ? '' : ' · reversed, not counted in the paid total'}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </Card>

      <Card className="mt-6">
        <CardHeader title="Loan transactions" description="The running balance for this loan ends at its outstanding amount." />
        <LedgerHistory entries={entries} />
      </Card>
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
