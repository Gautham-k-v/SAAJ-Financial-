import { SelectField } from '../ui/SelectField'
import { TextArea } from '../ui/TextArea'
import { TextField } from '../ui/TextField'
import { Button } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { RepaymentSchedule } from './RepaymentSchedule'
import { formatPaise, parseRupeesToPaise } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/datetime'
import { loanPreview } from '../../utils/loans'

export function LoanForm({
  mode,
  loanId,
  values,
  errors,
  customers,
  agents,
  onChange,
  onSubmit,
  onCancel,
}) {
  function update(field, value) {
    onChange((current) => ({ ...current, [field]: value }))
  }

  const principal = parseRupeesToPaise(values.principal)
  const financeCharge = parseRupeesToPaise(values.financeCharge)
  const totalHint =
    !principal.error && !financeCharge.error
      ? `Principal plus finance charge is ${formatPaise(principal.paise + financeCharge.paise)}.`
      : 'Must equal principal plus finance charge.'
  const preview = loanPreview(values)

  return (
    <form className="space-y-6" noValidate onSubmit={onSubmit}>
      {errors.form ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          {errors.form}
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {mode === 'edit' ? (
          <p className="mb-5 text-sm text-slate-500">
            Loan ID <span className="mt-1 block font-semibold text-navy-900">{loanId}</span>
          </p>
        ) : (
          <p className="mb-5 text-sm text-slate-500">A loan ID is assigned when the record is saved. The loan opens as pending.</p>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <SelectField
            id="customerId"
            className="md:col-span-2"
            label="Customer"
            value={values.customerId}
            error={errors.customerId}
            onChange={(event) => update('customerId', event.target.value)}
          >
            <option value="">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.fullName} · {customer.id}
              </option>
            ))}
          </SelectField>
          <TextField
            id="principal"
            label="Principal amount (₹)"
            inputMode="decimal"
            value={values.principal}
            error={errors.principal}
            onChange={(event) => update('principal', event.target.value)}
          />
          <TextField
            id="financeCharge"
            label="Finance charge (₹)"
            inputMode="decimal"
            value={values.financeCharge}
            error={errors.financeCharge}
            onChange={(event) => update('financeCharge', event.target.value)}
          />
          <TextField
            id="totalRepayment"
            label="Total repayment amount (₹)"
            inputMode="decimal"
            hint={errors.totalRepayment ? undefined : totalHint}
            value={values.totalRepayment}
            error={errors.totalRepayment}
            onChange={(event) => update('totalRepayment', event.target.value)}
          />
          <TextField
            id="dailyInstalment"
            label="Daily instalment (₹)"
            inputMode="decimal"
            value={values.dailyInstalment}
            error={errors.dailyInstalment}
            onChange={(event) => update('dailyInstalment', event.target.value)}
          />
          <TextField
            id="repaymentDays"
            label="Number of repayment days"
            inputMode="numeric"
            value={values.repaymentDays}
            error={errors.repaymentDays}
            onChange={(event) => update('repaymentDays', event.target.value)}
          />
          <TextField
            id="startDate"
            label="Start date"
            type="date"
            value={values.startDate}
            error={errors.startDate}
            onChange={(event) => update('startDate', event.target.value)}
          />
          <SelectField
            id="agentId"
            className="md:col-span-2"
            label="Assigned collection agent"
            value={values.agentId}
            error={errors.agentId}
            onChange={(event) => update('agentId', event.target.value)}
          >
            <option value="">Select an agent</option>
            {agents.filter((agent) => agent.status !== 'Inactive' || agent.id === values.agentId).map((agent) => (
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
            value={values.remarks}
            error={errors.remarks}
            onChange={(event) => update('remarks', event.target.value)}
          />
        </div>
      </section>

      {preview ? (
        <Card>
          <CardHeader
            title="Repayment schedule"
            description={`${preview.repaymentDays} unpaid instalments of ${formatPaise(preview.dailyInstalment)}, from ${formatDisplayDate(preview.startDate)} to ${formatDisplayDate(preview.endDate)}.`}
          />
          <RepaymentSchedule schedule={preview.schedule} />
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit">{mode === 'edit' ? 'Save changes' : 'Save loan'}</Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
