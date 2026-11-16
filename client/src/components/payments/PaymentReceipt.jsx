import { SaajWordmark } from '../brand/SaajMark'
import { formatPhone } from '../../utils/customers'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate, formatTime } from '../../utils/datetime'

export function PaymentReceipt({ payment, balances }) {
  const reversed = payment.status === 'Reversed'
  const reversal = payment.type === 'reversal'

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-4 bg-navy-900 px-5 py-5 text-white sm:px-8">
        <SaajWordmark light markTone="teal" />
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-100">
            {reversal ? 'Reversal advice' : 'Payment receipt'}
          </p>
          <p className="mt-1 text-sm text-white">{payment.receiptNumber}</p>
        </div>
      </header>

      <div className="px-5 py-6 sm:px-8">
        {reversed ? (
          <p className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
            This receipt was reversed{payment.reversalReason ? `: ${payment.reversalReason}` : '.'} The original amount is unchanged.
          </p>
        ) : null}
        {reversal ? (
          <p className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This advice reverses {payment.reverses}. {payment.reason}
          </p>
        ) : null}

        <dl className="grid gap-5 sm:grid-cols-2">
          <Field label="Transaction ID" value={payment.id} />
          <Field label="Status" value={reversal ? 'Reversal' : payment.status} />
          <Field label="Customer" value={`${payment.customerName} · ${payment.customerId}`} />
          <Field label="Phone" value={payment.customerPhone ? formatPhone(payment.customerPhone) : '—'} />
          <Field label="Loan" value={payment.loanId} />
          <Field label="Amount" value={formatPaise(payment.amount)} />
          <Field label="Payment method" value={payment.method} />
          <Field label="Transaction reference" value={payment.reference || '—'} />
          <Field label="Payment date" value={formatDisplayDate(payment.paidOn)} />
          <Field label="Recorded at" value={payment.recordedAt ? formatTime(payment.recordedAt) : '—'} />
          <Field label="Previous outstanding" value={formatPaise(balances.previousOutstanding)} />
          <Field label="Remaining outstanding" value={formatPaise(balances.remainingOutstanding)} />
          <Field label="Unallocated credit" value={formatPaise(payment.unallocated || 0)} />
          <Field label="Collector" value={payment.collectorName} />
        </dl>

        <h2 className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Allocation</h2>
        {reversal ? (
          <p className="mt-2 text-sm text-slate-700">The reversed receipt’s allocations were removed from the schedule totals.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {(payment.allocations || []).map((item) => (
              <li key={`${item.instalmentNumber}-${item.amount}`} className="flex justify-between gap-3 py-2">
                <span className="text-slate-600">
                  Instalment {item.instalmentNumber}
                  {item.dueDate ? ` · ${formatDisplayDate(item.dueDate)}` : ''}
                </span>
                <span className="font-medium text-navy-900 tabular-nums">{formatPaise(item.amount)}</span>
              </li>
            ))}
          </ul>
        )}
        {payment.remarks ? <p className="mt-4 text-sm text-slate-600">Remarks: {payment.remarks}</p> : null}
        <p className="mt-6 text-xs text-slate-500">
          Development receipt stored in this browser, separate from the repayment schedule. This is not a production ledger.
        </p>
      </div>
    </article>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-navy-900">{value}</dd>
    </div>
  )
}
