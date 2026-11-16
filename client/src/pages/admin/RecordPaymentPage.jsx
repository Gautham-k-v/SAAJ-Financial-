import { useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ErrorState } from '../../components/ui/ErrorState'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectField } from '../../components/ui/SelectField'
import { TextArea } from '../../components/ui/TextArea'
import { TextField } from '../../components/ui/TextField'
import { Button } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { getCollectionLine } from '../../services/collectionService'
import { collectorOptions, postPayment } from '../../services/paymentService'
import { PAYMENT_METHODS } from '../../utils/collections'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/datetime'
import { LOAN_BOOK_DATE } from '../../utils/loans'
import { PaymentStateError, PaymentValidationError, planAllocation, validatePaymentInput } from '../../utils/payments'

export default function RecordPaymentPage() {
  const { loanId, instalmentNumber } = useParams()
  const [params] = useSearchParams()
  const date = params.get('date') || LOAN_BOOK_DATE
  const record = getCollectionLine(loanId, instalmentNumber, date)
  const idempotencyKey = useRef(crypto.randomUUID())
  const agents = collectorOptions()
  const [draft, setDraft] = useState(() => ({
    amount: '',
    method: '',
    paidOn: date,
    reference: '',
    collectorId: record?.loan.agentId ?? '',
    remarks: '',
  }))
  const [errors, setErrors] = useState({})
  const [reviewed, setReviewed] = useState(null)
  const [posted, setPosted] = useState(null)
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState('')
  useDocumentTitle(record ? 'Record payment' : 'Collection')

  if (!record) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState title="Collection not found" message="This instalment is not on the loan schedule." />
        <Link to={`/collections?date=${date}`} className={`${buttonClasses({ variant: 'secondary' })} mt-6`}>
          Back to collections
        </Link>
      </div>
    )
  }

  const { loan, line } = record

  function update(field, value) {
    if (posted) return
    setDraft((current) => ({ ...current, [field]: value }))
    setReviewed(null)
    setErrors({})
    setFailure('')
  }

  function handleReview(event) {
    event.preventDefault()
    if (posted) return
    const result = validatePaymentInput(
      { ...draft, loanId: loan.id, idempotencyKey: idempotencyKey.current },
      { loan, agents },
    )
    setErrors(result.errors)
    if (!result.ready) {
      const fieldId = ['amount', 'method', 'paidOn', 'reference', 'collectorId', 'remarks'].find((field) => result.errors[field])
      if (fieldId) document.getElementById(fieldId)?.focus()
      return
    }
    setReviewed({
      ...result.draft,
      plan: planAllocation(loan.schedule, result.draft.paise),
      previousOutstanding: loan.outstanding,
    })
  }

  function handleConfirm() {
    if (!reviewed || posted || saving) return
    setSaving(true)
    setFailure('')
    try {
      const payment = postPayment({
        loanId: loan.id,
        amount: draft.amount,
        method: reviewed.method,
        paidOn: reviewed.paidOn,
        reference: reviewed.reference,
        collectorId: reviewed.collectorId,
        remarks: reviewed.remarks,
        idempotencyKey: reviewed.idempotencyKey,
      })
      setPosted(payment)
    } catch (error) {
      if (error instanceof PaymentValidationError) setErrors(error.fields)
      else if (error instanceof PaymentStateError) setFailure(error.message)
      else setFailure('The payment could not be recorded.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Daily collections"
        title="Record payment"
        description="The amount is checked, then allocated to the earliest outstanding instalments. A receipt is issued only after the payment is stored."
      />

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Customer name" value={line.customerName} />
          <Detail label="Customer ID" value={line.customerId} />
          <Detail label="Loan ID" value={line.loanId} />
          <Detail label="Expected instalment" value={formatPaise(line.expected)} />
          <Detail label="Already allocated" value={formatPaise(line.collected)} />
          <Detail label="Loan outstanding" value={formatPaise(posted ? posted.remainingOutstanding : loan.outstanding)} />
        </dl>
      </section>

      <form className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" noValidate onSubmit={handleReview}>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            id="amount"
            label="Amount received (₹)"
            inputMode="decimal"
            value={draft.amount}
            error={errors.amount}
            disabled={Boolean(posted)}
            onChange={(event) => update('amount', event.target.value)}
          />
          <SelectField
            id="method"
            label="Payment method"
            value={draft.method}
            error={errors.method}
            disabled={Boolean(posted)}
            onChange={(event) => update('method', event.target.value)}
          >
            <option value="">Select a method</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </SelectField>
          <TextField
            id="paidOn"
            label="Payment date"
            type="date"
            value={draft.paidOn}
            error={errors.paidOn}
            disabled={Boolean(posted)}
            onChange={(event) => update('paidOn', event.target.value)}
          />
          <TextField
            id="reference"
            label="Transaction reference"
            hint={draft.method === 'Cash' ? 'Optional for cash' : 'Required for UPI and bank transfer'}
            value={draft.reference}
            error={errors.reference}
            disabled={Boolean(posted)}
            onChange={(event) => update('reference', event.target.value)}
          />
          <SelectField
            id="collectorId"
            label="Collector name"
            value={draft.collectorId}
            error={errors.collectorId}
            disabled={Boolean(posted)}
            onChange={(event) => update('collectorId', event.target.value)}
          >
            <option value="">Select a collector</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </SelectField>
          <TextArea
            id="remarks"
            className="md:col-span-2"
            label="Remarks"
            hint="Optional"
            value={draft.remarks}
            error={errors.remarks}
            disabled={Boolean(posted)}
            onChange={(event) => update('remarks', event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={Boolean(posted)}>
            Review allocation
          </Button>
          <Link
            to={`/collections/${line.loanId}/${line.instalmentNumber}?date=${date}`}
            className={buttonClasses({ variant: 'secondary' })}
          >
            Cancel
          </Link>
        </div>
      </form>

      {failure ? (
        <p className="mt-4 text-sm font-medium text-rose-700" role="alert">
          {failure}
        </p>
      ) : null}

      {reviewed && !posted ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-navy-900">Allocation preview</h2>
          <p className="mt-2 text-sm text-slate-600">
            {formatPaise(reviewed.paise)} will be applied to the earliest open instalments. Nothing has been recorded yet.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {reviewed.plan.allocations.map((item) => (
              <li key={item.instalmentNumber}>
                Instalment {item.instalmentNumber} · {formatDisplayDate(item.dueDate)} · {formatPaise(item.amount)}
              </li>
            ))}
          </ul>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <Detail label="Previous outstanding" value={formatPaise(reviewed.previousOutstanding)} />
            <Detail label="Remaining outstanding" value={formatPaise(reviewed.previousOutstanding - reviewed.paise)} />
            <Detail label="Unallocated credit" value={formatPaise(reviewed.plan.unallocated)} />
          </dl>
          <Button className="mt-5" disabled={saving} onClick={handleConfirm}>
            {saving ? 'Recording…' : 'Confirm payment'}
          </Button>
        </section>
      ) : null}

      {posted ? (
        <section className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-5" role="status">
          <h2 className="text-sm font-semibold text-navy-900">Payment recorded</h2>
          <p className="mt-2 text-sm text-slate-700">
            Receipt {posted.receiptNumber} · Transaction {posted.id}. The instalment status, outstanding balance, and today’s collection totals now include this receipt.
          </p>
          <Link to={`/transactions/${posted.id}`} className={`${buttonClasses()} mt-4`}>
            View receipt
          </Link>
        </section>
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
