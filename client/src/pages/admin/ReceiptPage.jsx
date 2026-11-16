import { Link, useParams } from 'react-router-dom'
import { PaymentReceipt } from '../../components/payments/PaymentReceipt'
import { ErrorState } from '../../components/ui/ErrorState'
import { PageHeader } from '../../components/ui/PageHeader'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { getLoan } from '../../services/loanService'
import { getTransaction } from '../../services/paymentService'
import { receiptBrand } from '../../services/settingsService'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate, formatTime } from '../../utils/datetime'
import { receiptBalances } from '../../utils/payments'
import { buildReceiptPdf } from '../../utils/receiptPdf'

export default function ReceiptPage() {
  const { paymentId } = useParams()
  const payment = getTransaction(paymentId)
  const loan = payment ? getLoan(payment.loanId) : null
  useDocumentTitle(payment ? payment.receiptNumber : 'Receipt')

  if (!payment || !loan) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState title="Receipt not found" message="This transaction is not in the browser payment store." />
        <Link to="/transactions" className={`${buttonClasses({ variant: 'secondary' })} mt-6`}>
          All transactions
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
      amountLabel: rupees(payment.amount),
      method: payment.method,
      reference: payment.reference,
      when: `${formatDisplayDate(payment.paidOn)}${payment.recordedAt ? `, ${formatTime(payment.recordedAt)}` : ''}`,
      previousLabel: rupees(balances.previousOutstanding),
      remainingLabel: rupees(balances.remainingOutstanding),
      unallocatedLabel: rupees(payment.unallocated || 0),
      collectorName: payment.collectorName,
      allocationText: allocationText(payment),
      ...receiptBrand(),
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
      payment.type === 'reversal' ? 'SAAJ reversal advice' : 'SAAJ payment receipt',
      `Receipt: ${payment.receiptNumber}`,
      `Transaction: ${payment.id}`,
      `Customer: ${payment.customerName} (${payment.customerId})`,
      `Loan: ${payment.loanId}`,
      `Amount: ${formatPaise(payment.amount)}`,
      `Method: ${payment.method}`,
      `Previous outstanding: ${formatPaise(balances.previousOutstanding)}`,
      `Remaining outstanding: ${formatPaise(balances.remainingOutstanding)}`,
      `Unallocated credit: ${formatPaise(payment.unallocated || 0)}`,
      `Collector: ${payment.collectorName}`,
    ].join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="saaj-app-chrome">
        <PageHeader
          eyebrow="Transactions"
          title={payment.receiptNumber}
          description={payment.type === 'reversal' ? 'Reversal advice for a posted receipt.' : 'Digital receipt for a stored payment.'}
          actions={
            <div className="flex flex-wrap gap-2">
              <button type="button" className={buttonClasses({ variant: 'secondary' })} onClick={download}>
                Download PDF
              </button>
              <button type="button" className={buttonClasses({ variant: 'secondary' })} onClick={() => window.print()}>
                Print
              </button>
              <button type="button" className={buttonClasses({ variant: 'secondary' })} onClick={share}>
                WhatsApp
              </button>
              {payment.type !== 'reversal' && payment.status !== 'Reversed' ? (
                <Link to={`/transactions/${payment.id}/reverse`} className={buttonClasses()}>
                  Reverse
                </Link>
              ) : null}
            </div>
          }
        />
      </div>
      <PaymentReceipt payment={payment} balances={balances} />
    </div>
  )
}

function allocationText(payment) {
  if (payment.type === 'reversal') return `Reverses ${payment.reverses}`
  const items = payment.allocations || []
  if (items.length === 0) return payment.instalmentNumber ? `Instalment ${payment.instalmentNumber}` : 'Not allocated'
  return items.map((item) => `Instalment ${item.instalmentNumber}`).join(', ')
}

function rupees(paise) {
  return formatPaise(paise).replace('₹', 'Rs. ')
}
