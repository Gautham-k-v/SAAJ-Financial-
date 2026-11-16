import { Button } from '../ui/Button'
import { SelectField } from '../ui/SelectField'
import { TextArea } from '../ui/TextArea'
import { TextField } from '../ui/TextField'
import { AGENT_STATUSES } from '../../utils/agents'

export function AgentForm({ mode, agentId, authMode, values, errors, onChange, onSubmit, onCancel }) {
  const issued = authMode === 'server'

  function update(field, value) {
    onChange((current) => ({ ...current, [field]: value }))
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
            <TextField id="agent-id" label="Agent ID" value={agentId} disabled />
          ) : null}
          <TextField id="agent-name" label="Full name" value={values.name} error={errors.name} onChange={(event) => update('name', event.target.value)} />
          <TextField id="agent-phone" label="Phone number" inputMode="numeric" value={values.phone} error={errors.phone} onChange={(event) => update('phone', event.target.value)} />
          <TextField id="agent-email" label="Email" type="email" value={values.email} error={errors.email} disabled={issued} hint={issued ? 'Issued accounts keep the email checked by the API.' : undefined} onChange={(event) => update('email', event.target.value)} />
          <TextField id="agent-username" label="Username" value={values.username} error={errors.username} disabled={issued} autoComplete="off" hint={issued ? 'Issued accounts keep the username checked by the API.' : undefined} onChange={(event) => update('username', event.target.value)} />
          <TextArea id="agent-address" className="md:col-span-2" label="Address" value={values.address} error={errors.address} onChange={(event) => update('address', event.target.value)} />
          {issued ? (
            <p className="text-sm leading-6 text-slate-500 md:col-span-2">
              This agent signs in with the issued field password. That password stays on the API and is not stored in this browser.
            </p>
          ) : (
            <TextField
              id="agent-password"
              label="Password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              error={errors.password}
              hint={mode === 'edit' ? 'Leave blank to keep the current development password.' : 'Development password only. It is stored separately from production sign-in.'}
              onChange={(event) => update('password', event.target.value)}
            />
          )}
          <TextField id="agent-target" label="Daily collection target" inputMode="decimal" value={values.dailyTarget} error={errors.dailyTarget} hint="Optional. Leave blank to use today’s assigned book." onChange={(event) => update('dailyTarget', event.target.value)} />
          <SelectField id="agent-status" label="Status" value={values.status} error={errors.status} onChange={(event) => update('status', event.target.value)}>
            {AGENT_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </SelectField>
        </div>
      </section>
      <div className="flex flex-wrap gap-3">
        <Button type="submit">{mode === 'edit' ? 'Save agent' : 'Add agent'}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
