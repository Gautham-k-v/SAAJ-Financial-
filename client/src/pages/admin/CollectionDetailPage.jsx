import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CustomerPhoto } from '../../components/customers/CustomerPhoto'
import { CollectionStatusBadge } from '../../components/collections/CollectionStatusBadge'
import { LoanStatusBadge } from '../../components/loans/LoanStatusBadge'
import { RepaymentSchedule } from '../../components/loans/RepaymentSchedule'
import { Card, CardHeader } from '../../components/ui/Card'
import { ErrorState } from '../../components/ui/ErrorState'
import { PageHeader } from '../../components/ui/PageHeader'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { getCollectionLine } from '../../services/collectionService'
import { formatPhone } from '../../utils/customers'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/datetime'
import { LOAN_BOOK_DATE } from '../../utils/loans'

export default function CollectionDetailPage() {
  const { loanId, instalmentNumber } = useParams()
  const [params] = useSearchParams()
  const date = params.get('date') || LOAN_BOOK_DATE
  const record = getCollectionLine(loanId, instalmentNumber, date)
  useDocumentTitle(record ? record.line.customerName : 'Collection')

  if (!record) {
    return (
      <div className="mx-auto max-w-5xl">
        <ErrorState title="Collection not found" message="This instalment is not on the loan schedule." />
        <Link to={`/collections?date=${date}`} className={`${buttonClasses({ variant: 'secondary' })} mt-6`}>
          Back to collections
        </Link>
      </div>
    )
  }

  const { loan, line } = record

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow={`${line.customerId} · ${line.loanId}`}
        title={line.customerName}
        description={`Instalment ${line.instalmentNumber} · due ${formatDisplayDate(line.dueDate)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={`/collections?date=${date}`} className={buttonClasses({ variant: 'secondary' })}>
              All collections
            </Link>
            <Link
              to={`/collections/${loan.id}/${line.instalmentNumber}/record?date=${date}`}
              className={buttonClasses()}
            >
              Record payment
            </Link>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <CollectionStatusBadge status={line.status} />
        <LoanStatusBadge status={loan.displayStatus} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Customer" description={line.customerId} />
          <div className="flex items-center gap-4 px-5 py-5">
            <CustomerPhoto name={line.customerName} />
            <div>
              <Link to={`/customers/${line.customerId}`} className="font-semibold text-navy-900 hover:text-teal-800">
                {line.customerName}
              </Link>
              <p className="mt-1 text-sm text-slate-600 tabular-nums">{formatPhone(line.phone)}</p>
              <p className="mt-1 text-sm text-slate-500">{line.place}</p>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Loan" description="Active contract for this instalment" />
          <dl className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            <Detail label="Loan ID" value={loan.id} />
            <Detail label="Agent" value={line.agentName} />
            <Detail label="Daily instalment" value={formatPaise(loan.dailyInstalment)} />
            <Detail label="Total repayment" value={formatPaise(loan.totalRepayment)} />
            <Detail label="Total paid" value={formatPaise(loan.totalRepaid)} />
            <Detail label="Outstanding" value={formatPaise(loan.outstanding)} />
          </dl>
          <div className="border-t border-slate-100 px-5 py-4">
            <Link to={`/loans/${loan.id}`} className="text-sm font-semibold text-teal-800 hover:text-teal-900">
              Open the loan profile
            </Link>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="This instalment" description={`Viewed for ${formatDisplayDate(date)}. Status comes from allocated payments.`} />
        <dl className="grid gap-4 px-5 py-5 sm:grid-cols-4">
          <Detail label="Expected" value={formatPaise(line.expected)} />
          <Detail label="Collected" value={formatPaise(line.collected)} />
          <Detail label="Remaining" value={formatPaise(line.remaining)} />
          <Detail label="Due" value={formatDisplayDate(line.dueDate)} />
        </dl>
      </Card>

      <Card className="mt-6">
        <CardHeader
          title="Payment history"
          description="Receipts stay separate from the schedule. A receipt counts only where it is allocated."
        />
        {loan.payments.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">No payments have been recorded on this loan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Amount</th>
                  <th className="px-3 py-3 font-medium">Allocated to</th>
                  <th className="px-3 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 font-medium">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {loan.payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3 text-slate-600">{formatDisplayDate(payment.paidOn)}</td>
                    <td className="px-3 py-3 text-slate-600 tabular-nums">{formatPaise(payment.amount)}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {payment.type === 'reversal'
                        ? `Reverses ${payment.reverses}`
                        : payment.allocations?.map((item) => `#${item.instalmentNumber}`).join(', ') ||
                          (payment.instalmentNumber ? `#${payment.instalmentNumber}` : 'Not allocated')}
                    </td>
                    <td className="px-3 py-3 text-slate-600">{payment.method || 'Cash'}</td>
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
        <CardHeader title="Repayment schedule" description="Expected amounts stay fixed. Paid amounts are the sum of allocations." />
        <RepaymentSchedule schedule={loan.schedule} />
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
