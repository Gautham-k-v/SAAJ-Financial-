import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { SelectField } from '../ui/SelectField'
import { TextArea } from '../ui/TextArea'
import { TextField } from '../ui/TextField'
import { buttonClasses } from '../ui/buttonStyles'
import { CustomerPhoto } from './CustomerPhoto'
import { CUSTOMER_STATUSES, KYC_DOCUMENT_TYPES, createKycRow } from '../../utils/customers'
import { formatDisplayDate } from '../../utils/datetime'

const MAX_PHOTO_BYTES = 400 * 1024

export function CustomerForm({
  mode,
  customerId,
  createdAt,
  values,
  errors,
  onChange,
  onSubmit,
  onCancel,
}) {
  function update(field, value) {
    onChange((current) => ({ ...current, [field]: value }))
  }

  function updateKyc(key, field, value) {
    onChange((current) => ({
      ...current,
      kycDocuments: current.kycDocuments.map((document) =>
        document.key === key ? { ...document, [field]: value } : document,
      ),
    }))
  }

  function addKyc() {
    onChange((current) => ({ ...current, kycDocuments: [...current.kycDocuments, createKycRow()] }))
  }

  function removeKyc(key) {
    onChange((current) => ({
      ...current,
      kycDocuments: current.kycDocuments.filter((document) => document.key !== key),
    }))
  }

  function onPhotograph(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      onChange((current) => current, { photograph: 'Choose an image file.' })
      return
    }

    if (file.size > MAX_PHOTO_BYTES) {
      onChange((current) => current, { photograph: 'Use a photograph smaller than 400 KB.' })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const photograph = String(reader.result)
      onChange((current) => ({ ...current, photograph }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <form className="space-y-6" noValidate onSubmit={onSubmit}>
      {errors.form ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          {errors.form}
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 md:grid-cols-2">
          {mode === 'edit' ? (
            <div className="md:col-span-2 grid gap-3 rounded-xl bg-canvas px-4 py-3 sm:grid-cols-2">
              <p className="text-sm text-slate-500">
                Customer ID <span className="mt-1 block font-semibold text-navy-900">{customerId}</span>
              </p>
              <p className="text-sm text-slate-500">
                Created <span className="mt-1 block font-semibold text-navy-900">{formatDisplayDate(createdAt)}</span>
              </p>
            </div>
          ) : (
            <p className="md:col-span-2 text-sm text-slate-500">
              A customer ID is assigned when the record is saved.
            </p>
          )}

          <TextField
            id="fullName"
            className="md:col-span-2"
            label="Full name"
            autoComplete="name"
            value={values.fullName}
            error={errors.fullName}
            onChange={(event) => update('fullName', event.target.value)}
          />
          <TextField
            id="phone"
            label="Phone number"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="10-digit mobile number"
            value={values.phone}
            error={errors.phone}
            onChange={(event) => update('phone', event.target.value)}
          />
          <TextField
            id="alternatePhone"
            label="Alternate phone"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="Optional"
            value={values.alternatePhone}
            error={errors.alternatePhone}
            onChange={(event) => update('alternatePhone', event.target.value)}
          />
          <TextArea
            id="address"
            className="md:col-span-2"
            label="Address"
            autoComplete="street-address"
            value={values.address}
            error={errors.address}
            onChange={(event) => update('address', event.target.value)}
          />
          <TextField
            id="place"
            label="Place"
            value={values.place}
            error={errors.place}
            onChange={(event) => update('place', event.target.value)}
          />
          <TextField
            id="pinCode"
            label="PIN code"
            inputMode="numeric"
            autoComplete="postal-code"
            value={values.pinCode}
            error={errors.pinCode}
            onChange={(event) => update('pinCode', event.target.value)}
          />
          <SelectField
            id="status"
            label="Customer status"
            value={values.status}
            error={errors.status}
            onChange={(event) => update('status', event.target.value)}
          >
            {CUSTOMER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </SelectField>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-sm font-semibold text-navy-900">Photograph</h2>
        <p className="mt-1 text-sm text-slate-500">Optional. Use an image up to 400 KB.</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <CustomerPhoto name={values.fullName} photograph={values.photograph} />
          <div className="flex flex-wrap gap-2">
            <label className={`${buttonClasses({ variant: 'secondary', size: 'sm' })} cursor-pointer`}>
              {values.photograph ? 'Replace photograph' : 'Upload photograph'}
              <input type="file" accept="image/*" className="sr-only" onChange={onPhotograph} />
            </label>
            {values.photograph ? (
              <Button variant="secondary" size="sm" onClick={() => update('photograph', null)}>
                Remove
              </Button>
            ) : null}
          </div>
        </div>
        {errors.photograph ? (
          <p id="photograph-error" tabIndex={-1} className="mt-3 text-sm text-rose-700" role="alert">
            {errors.photograph}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-navy-900">KYC document references</h2>
            <p className="mt-1 text-sm text-slate-500">Optional. Record the document type and its reference.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={addKyc}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add reference
          </Button>
        </div>

        {values.kycDocuments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No document references added.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {values.kycDocuments.map((document, index) => {
              const rowErrors = errors.kyc?.[document.key] ?? {}
              return (
                <li key={document.key} className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_1fr_auto] md:items-start">
                  <SelectField
                    id={`kyc-${index}-type`}
                    label="Document type"
                    value={document.type}
                    error={rowErrors.type}
                    onChange={(event) => updateKyc(document.key, 'type', event.target.value)}
                  >
                    <option value="">Select type</option>
                    {KYC_DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </SelectField>
                  <TextField
                    id={`kyc-${index}-reference`}
                    label="Reference"
                    value={document.reference}
                    error={rowErrors.reference}
                    onChange={(event) => updateKyc(document.key, 'reference', event.target.value)}
                  />
                  <div className="md:pt-7">
                    <Button variant="secondary" size="sm" onClick={() => removeKyc(document.key)}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Remove
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit">{mode === 'edit' ? 'Save changes' : 'Save customer'}</Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
