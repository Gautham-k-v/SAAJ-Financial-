import { CheckCircle2 } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { SaajWordmark } from '../../components/brand/SaajMark'
import { ErrorState } from '../../components/ui/ErrorState'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { actor } from '../../services/access'
import { getLoan } from '../../services/loanService'
import { getTransaction } from '../../services/paymentService'
import { receiptBrand } from '../../services/settingsService'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate, formatTime } from '../../utils/datetime'
import { receiptBalances } from '../../utils/payments'
import { buildReceiptPdf } from '../../utils/receiptPdf'

export default function AgentReceiptPage() {
  const { paymentId } = useParams()
  const location = useLocation()
  const session = actor()
  const payment = getTransaction(paymentId)
  const loan = payment ? getLoan(payment.loanId) : null
  const assigned = loan?.agentId === session.accountId
  const recorded = location.state?.recorded === true
  useDocumentTitle(payment ? payment.receiptNumber : 'Receipt')

  if (!payment || !loan || !assigned) {
    return (
      <div>
        <ErrorState title="Receipt not found" message="This receipt is not in your collection book." />
        <Link to="/agent/collections" className={`${buttonClasses({ variant: 'secondary' })} mt-6`}>
          Back to collections
        </Link>
      </div>
    )
  }

  const balances = receiptBalances(loan, payment)

  function download() {
    const bytes = buildReceiptPdf({
      receiptNumber: payment.receiptNumber,
      id: payment.id,
      status: payment.type === 'reversal' ? 'Reversal' : payment.status,
      customerName: payment.customerName,
      customerId: payment.customerId,
      customerPhone: payment.customerPhone,
      loanId: payment.loanId,
      amountLabel: formatPaise(payment.amount).replace('₹', 'Rs. '),
      method: payment.method,
      reference: payment.reference,
      when: `${formatDisplayDate(payment.paidOn)}${payment.recordedAt ? `, ${formatTime(payment.recordedAt)}` : ''}`,
      previousLabel: formatPaise(balances.previousOutstanding).replace('₹', 'Rs. '),
      remainingLabel: formatPaise(balances.remainingOutstanding).replace('₹', 'Rs. '),
      unallocatedLabel: formatPaise(payment.unallocated || 0).replace('₹', 'Rs. '),
      collectorName: payment.collectorName,
      ...receiptBrand(),
      allocationText: (payment.allocations || []).map((item) => `Instalment ${item.instalmentNumber}`).join(', '),
    })
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${payment.receiptNumber}.pdf`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function share() {
    const text = [
      'SAAJ payment receipt',
      `Receipt: ${payment.receiptNumber}`,
      `Transaction: ${payment.id}`,
      `Customer: ${payment.customerName}`,
      `Amount: ${formatPaise(payment.amount)}`,
      `Method: ${payment.method}`,
      `Remaining outstanding: ${formatPaise(balances.remainingOutstanding)}`,
    ].join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div>
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="bg-navy-900 px-5 py-5 text-white">
          <SaajWordmark light markTone="teal" />
          {recorded ? (
            <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-teal-200">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              Payment recorded
            </p>
          ) : (
            <p className="mt-4 text-sm">Receipt</p>
          )}
        </header>
        <dl className="grid gap-3 px-5 py-5 text-sm">
          <Detail label="Receipt number" value={payment.receiptNumber} />
          <Detail label="Transaction ID" value={payment.id} />
          <Detail label="Customer" value={payment.customerName} />
          <Detail label="Amount received" value={formatPaise(payment.amount)} />
          <Detail label="Payment method" value={payment.method} />
          <Detail label="Date and time" value={`${formatDisplayDate(payment.paidOn)}${payment.recordedAt ? `, ${formatTime(payment.recordedAt)}` : ''}`} />
          <Detail label="Remaining outstanding" value={formatPaise(balances.remainingOutstanding)} />
        </dl>
      </article>
      <div className="mt-4 grid gap-2">
        <button type="button" className={buttonClasses({ className: 'w-full' })} onClick={share}>
          Share on WhatsApp
        </button>
        <button type="button" className={buttonClasses({ variant: 'secondary', className: 'w-full' })} onClick={download}>
          Download PDF
        </button>
        <Link to="/agent/collections" className={buttonClasses({ variant: 'secondary', className: 'w-full' })}>
          Return to collections
        </Link>
      </div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-navy-900">{value}</dd>
    </div>
  )
}
