import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AgentHeader } from '../../components/agent/AgentHeader'
import { ErrorState } from '../../components/ui/ErrorState'
import { SelectField } from '../../components/ui/SelectField'
import { TextArea } from '../../components/ui/TextArea'
import { TextField } from '../../components/ui/TextField'
import { Button } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { AccessError, actor } from '../../services/access'
import { getLoan } from '../../services/loanService'
import { postPayment } from '../../services/paymentService'
import { PaymentValidationError } from '../../utils/payments'
import { PAYMENT_METHODS } from '../../utils/collections'
import { formatPaise } from '../../utils/currency'
import { LOAN_BOOK_DATE } from '../../utils/loans'

export default function AgentRecordPage() {
  const { loanId, instalmentNumber } = useParams()
  const navigate = useNavigate()
  const session = actor()
  const loan = getLoan(loanId)
  const instalment = loan?.schedule.find((row) => row.number === Number(instalmentNumber))
  const assigned = loan?.agentId === session.accountId
  const key = useRef(crypto.randomUUID())
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('')
  const [reference, setReference] = useState('')
  const [remarks, setRemarks] = useState('')
  const [errors, setErrors] = useState({})
  const [pending, setPending] = useState(false)
  useDocumentTitle('Record payment')

  if (!loan || !instalment || !assigned || loan.status !== 'Active') {
    return (
      <div>
        <AgentHeader />
        <ErrorState title="Payment is not available" message="This instalment is not on an active loan assigned to you." />
        <Link to="/agent/collections" className={`${buttonClasses({ variant: 'secondary' })} mt-6`}>
          Back to collections
        </Link>
      </div>
    )
  }

  function submit(event) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    try {
      const payment = postPayment({
        loanId: loan.id,
        amount,
        method,
        paidOn: LOAN_BOOK_DATE,
        reference,
        collectorId: session.accountId,
        remarks,
        idempotencyKey: key.current,
      })
      navigate(`/agent/receipts/${payment.id}`, { replace: true, state: { recorded: true } })
    } catch (caught) {
      if (caught instanceof PaymentValidationError) setErrors(caught.fields)
      else if (caught instanceof AccessError) setErrors({ form: caught.message })
      else setErrors({ form: 'The payment was not recorded.' })
      setPending(false)
    }
  }

  return (
    <div>
      <AgentHeader />
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Record payment</h1>
      <p className="mt-1 text-sm text-slate-500">This uses the same receipt book as the administrator desk.</p>
      <form className="mt-5 space-y-4" noValidate onSubmit={submit}>
        <Readout label="Customer" value={`${loan.customerName} · ${loan.customerId}`} />
        <Readout label="Loan" value={loan.id} />
        <Readout label="Expected amount" value={formatPaise(instalment.expected)} />
        <Readout label="Collector" value={session.name} />
        <TextField id="agent-amount" label="Amount received" inputMode="decimal" value={amount} error={errors.amount} onChange={(event) => setAmount(event.target.value)} />
        <SelectField id="agent-method" label="Payment method" value={method} error={errors.method} onChange={(event) => setMethod(event.target.value)}>
          <option value="">Choose a method</option>
          {PAYMENT_METHODS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </SelectField>
        <TextField id="agent-reference" label="Transaction reference" value={reference} error={errors.reference} hint="Required for UPI and bank transfer." onChange={(event) => setReference(event.target.value)} />
        <TextArea id="agent-remarks" label="Remarks" value={remarks} error={errors.remarks} onChange={(event) => setRemarks(event.target.value)} />
        {errors.form ? <p className="text-sm text-rose-700">{errors.form}</p> : null}
        <Button type="submit" className="w-full scroll-mb-28" disabled={pending}>
          {pending ? 'Recording payment' : 'Confirm payment'}
        </Button>
      </form>
    </div>
  )
}

function Readout({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-navy-900">{value}</p>
    </div>
  )
}
