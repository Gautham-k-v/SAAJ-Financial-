import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CustomerForm } from '../../components/customers/CustomerForm'
import { ErrorState } from '../../components/ui/ErrorState'
import { PageHeader } from '../../components/ui/PageHeader'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { createCustomer, getCustomer, updateCustomer } from '../../services/customerService'
import {
  CustomerValidationError,
  emptyCustomerForm,
  hasCustomerErrors,
  toCustomerForm,
} from '../../utils/customers'

const fieldOrder = ['fullName', 'phone', 'alternatePhone', 'address', 'place', 'pinCode', 'status', 'photograph']

export default function CustomerFormPage() {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const existing = customerId ? getCustomer(customerId) : null
  const routeKey = customerId ?? 'new'
  const mode = customerId ? 'edit' : 'create'
  const [draft, setDraft] = useState(() => createDraft(routeKey, existing))
  useDocumentTitle(mode === 'edit' ? 'Edit customer' : 'Add customer')

  if (draft.routeKey !== routeKey) {
    setDraft(createDraft(routeKey, existing))
  }

  const { values, errors } = draft.routeKey === routeKey ? draft : createDraft(routeKey, existing)

  if (customerId && !existing) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState title="Customer not found" message="This customer ID is not in the customer records." />
        <Link to="/customers" className={`${buttonClasses({ variant: 'secondary' })} mt-6`}>
          Back to customers
        </Link>
      </div>
    )
  }

  function handleChange(updateValues, photoError) {
    setDraft((current) => ({
      routeKey,
      values: updateValues(current.routeKey === routeKey ? current.values : values),
      errors: photoError ?? {},
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    try {
      const saved = mode === 'edit' ? updateCustomer(customerId, values) : createCustomer(values)
      navigate(`/customers/${saved.id}`, { replace: true })
    } catch (error) {
      if (error instanceof CustomerValidationError) {
        setDraft((current) => ({ ...current, errors: error.fields }))
        requestAnimationFrame(() => focusFirstInvalid(error.fields, values.kycDocuments))
        return
      }
      setDraft((current) => ({ ...current, errors: { form: 'The customer could not be saved.' } }))
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Customers"
        title={mode === 'edit' ? 'Edit customer' : 'Add customer'}
        description={
          mode === 'edit'
            ? 'Update the customer record. The customer ID and created date stay the same.'
            : 'Add a customer to the lending book. The customer ID is generated on save.'
        }
      />
      <CustomerForm
        mode={mode}
        customerId={existing?.id}
        createdAt={existing?.createdAt}
        values={values}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={() => navigate(mode === 'edit' ? `/customers/${customerId}` : '/customers')}
      />
    </div>
  )
}

function createDraft(routeKey, existing) {
  return {
    routeKey,
    values: existing ? toCustomerForm(existing) : emptyCustomerForm(),
    errors: {},
  }
}

function focusFirstInvalid(errors, kycDocuments) {
  if (!hasCustomerErrors(errors)) return

  const fieldId = fieldOrder.find((field) => errors[field])
  if (fieldId === 'photograph') {
    document.getElementById('photograph-error')?.focus()
    return
  }
  if (fieldId) {
    document.getElementById(fieldId)?.focus()
    return
  }

  const kycIndex = kycDocuments.findIndex((document) => errors.kyc?.[document.key])
  if (kycIndex >= 0) {
    const row = errors.kyc[kycDocuments[kycIndex].key]
    const suffix = row.type ? 'type' : 'reference'
    document.getElementById(`kyc-${kycIndex}-${suffix}`)?.focus()
  }
}
