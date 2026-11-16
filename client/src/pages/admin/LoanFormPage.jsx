import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LoanForm } from '../../components/loans/LoanForm'
import { ErrorState } from '../../components/ui/ErrorState'
import { PageHeader } from '../../components/ui/PageHeader'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { createLoan, getLoan, listAgents, updatePendingLoan } from '../../services/loanService'
import { listCustomers } from '../../services/customerService'
import { getLoanSettings } from '../../services/settingsService'
import { LoanStateError, LoanValidationError, emptyLoanForm, hasLoanErrors, toLoanForm } from '../../utils/loans'

const fieldOrder = [
  'customerId',
  'principal',
  'financeCharge',
  'totalRepayment',
  'dailyInstalment',
  'repaymentDays',
  'startDate',
  'agentId',
  'remarks',
]

export default function LoanFormPage() {
  const { loanId } = useParams()
  const navigate = useNavigate()
  const existing = loanId ? getLoan(loanId) : null
  const routeKey = loanId ?? 'new'
  const mode = loanId ? 'edit' : 'create'
  const [draft, setDraft] = useState(() => createDraft(routeKey, existing))
  useDocumentTitle(mode === 'edit' ? 'Edit loan' : 'New loan')

  if (draft.routeKey !== routeKey) {
    setDraft(createDraft(routeKey, existing))
  }

  const { values, errors } = draft.routeKey === routeKey ? draft : createDraft(routeKey, existing)
  const customers = listCustomers()
    .filter((customer) => customer.status === 'Active' || customer.id === existing?.customerId)
    .sort((left, right) => left.fullName.localeCompare(right.fullName, 'en-IN'))

  if (loanId && !existing) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState title="Loan not found" message="This loan ID is not in the loan records." />
        <Link to="/loans" className={`${buttonClasses({ variant: 'secondary' })} mt-6`}>
          Back to loans
        </Link>
      </div>
    )
  }

  if (existing && existing.status !== 'Pending') {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow={existing.id}
          title="Loan terms are fixed"
          description="Terms stay as they were when the loan left pending. Activation, cancellation, and repayment do not rewrite the schedule."
        />
        <Link to={`/loans/${existing.id}`} className={buttonClasses({ variant: 'secondary' })}>
          Back to loan
        </Link>
      </div>
    )
  }

  function handleChange(updateValues) {
    setDraft((current) => ({
      routeKey,
      values: updateValues(current.routeKey === routeKey ? current.values : values),
      errors: {},
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    try {
      const saved = mode === 'edit' ? updatePendingLoan(loanId, values) : createLoan(values)
      navigate(`/loans/${saved.id}`, { replace: true })
    } catch (error) {
      if (error instanceof LoanValidationError) {
        setDraft((current) => ({ ...current, errors: error.fields }))
        requestAnimationFrame(() => focusFirstInvalid(error.fields))
        return
      }
      const message = error instanceof LoanStateError ? error.message : 'The loan could not be saved.'
      setDraft((current) => ({ ...current, errors: { form: message } }))
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Loans"
        title={mode === 'edit' ? 'Edit pending loan' : 'New loan'}
        description="Enter the contract in rupees. The schedule is generated from the daily instalment and the number of days, and it stays separate from payment receipts."
      />
      <LoanForm
        mode={mode}
        loanId={existing?.id}
        values={values}
        errors={errors}
        customers={customers}
        agents={listAgents()}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={() => navigate(mode === 'edit' ? `/loans/${loanId}` : '/loans')}
      />
    </div>
  )
}

function createDraft(routeKey, existing) {
  return {
    routeKey,
    values: existing ? toLoanForm(existing) : { ...emptyLoanForm(), repaymentDays: String(getLoanSettings().durationDays) },
    errors: {},
  }
}

function focusFirstInvalid(errors) {
  if (!hasLoanErrors(errors)) return
  const fieldId = fieldOrder.find((field) => errors[field])
  if (fieldId) document.getElementById(fieldId)?.focus()
}
