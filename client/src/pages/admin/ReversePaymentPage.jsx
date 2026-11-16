import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../../components/ui/ErrorState'
import { PageHeader } from '../../components/ui/PageHeader'
import { TextArea } from '../../components/ui/TextArea'
import { Button } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { getTransaction, reversePayment } from '../../services/paymentService'
import { formatPaise } from '../../utils/currency'
import { PaymentStateError, PaymentValidationError } from '../../utils/payments'

export default function ReversePaymentPage() {
  const { paymentId } = useParams()
  const payment = getTransaction(paymentId)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [posted, setPosted] = useState(null)
  useDocumentTitle(payment ? `Reverse ${payment.receiptNumber}` : 'Reverse payment')

  if (!payment || payment.type === 'reversal') {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState title="Payment not found" message="Choose a posted receipt to reverse." />
        <Link to="/transactions" className={`${buttonClasses({ variant: 'secondary' })} mt-6`}>
          All transactions
        </Link>
      </div>
    )
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (posted) return
    try {
      setPosted(reversePayment(payment.id, { reason }))
      setError('')
    } catch (caught) {
      if (caught instanceof PaymentValidationError) setError(caught.fields.reason || caught.fields.payment || 'Check the reversal.')
      else if (caught instanceof PaymentStateError) setError(caught.message)
      else setError('The reversal could not be recorded.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={payment.receiptNumber}
        title="Reverse payment"
        description="The original receipt stays in the history. A reversal entry is added, and the allocation is removed from the schedule totals."
      />
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <p className="font-semibold text-navy-900">{payment.customerName}</p>
        <p className="mt-1 text-slate-600">
          {payment.loanId} · {formatPaise(payment.amount)} · {payment.method}
        </p>
        {payment.status === 'Reversed' ? <p className="mt-3 text-rose-700">This receipt has already been reversed.</p> : null}
      </section>

      {posted ? (
        <section className="rounded-2xl border border-teal-200 bg-teal-50 p-5" role="status">
          <h2 className="text-sm font-semibold text-navy-900">Reversal recorded</h2>
          <p className="mt-2 text-sm text-slate-700">
            {posted.id} restored {formatPaise(posted.amount)} to the outstanding balance. Receipt {payment.receiptNumber} was not deleted.
          </p>
          <Link to={`/transactions/${posted.id}`} className={`${buttonClasses()} mt-4`}>
            View reversal
          </Link>
        </section>
      ) : (
        <form className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" noValidate onSubmit={handleSubmit}>
          <TextArea id="reason" label="Reason" value={reason} error={error} onChange={(event) => setReason(event.target.value)} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={payment.status === 'Reversed'}>
              Confirm reversal
            </Button>
            <Link to={`/transactions/${payment.id}`} className={buttonClasses({ variant: 'secondary' })}>
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
