import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectField } from '../../components/ui/SelectField'
import { TextArea } from '../../components/ui/TextArea'
import { TextField } from '../../components/ui/TextField'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { setAgentStatus } from '../../services/agentService'
import { listAgents, listLoans } from '../../services/loanService'
import { listTransactions } from '../../services/paymentService'
import {
  getSettings,
  requestPasswordChange,
  saveAdminProfile,
  saveBusinessProfile,
  saveLoanSettings,
  saveNotificationSettings,
  savePaymentSettings,
  setAdminStatus,
} from '../../services/settingsService'
import { agentBook } from '../../utils/agentBook'
import { PAYMENT_METHODS } from '../../utils/collections'
import { formatPaise } from '../../utils/currency'
import { formatPhone } from '../../utils/customers'
import {
  ACTIVATION_MODES,
  FINANCE_METHODS,
  SETTINGS_SECTIONS,
  SettingsValidationError,
  nextReceiptNumber,
} from '../../utils/settings'

export default function SettingsPage() {
  const { section } = useParams()
  const current = SETTINGS_SECTIONS.some(([id]) => id === section) ? section : 'business'
  const [revision, setRevision] = useState(0)
  const settings = getSettings()
  useDocumentTitle('Settings')

  function saved() {
    setRevision((value) => value + 1)
  }

  return (
    <div className="mx-auto max-w-[1600px]" data-revision={revision}>
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="These preferences are kept in this browser for development. They are not a server backup. Changing them does not rewrite loans or receipt numbers already on the book."
      />
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Settings">
          {SETTINGS_SECTIONS.map(([id, label]) => (
            <Link
              key={id}
              to={id === 'business' ? '/settings' : `/settings/${id}`}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-semibold ${current === id ? 'bg-navy-900 text-white' : 'bg-white text-navy-900 ring-1 ring-slate-200'}`}
              aria-current={current === id ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0">
          {current === 'business' ? <BusinessSection settings={settings} onSaved={saved} /> : null}
          {current === 'admins' ? <AdminsSection settings={settings} onSaved={saved} /> : null}
          {current === 'agents' ? <AgentsSection onSaved={saved} /> : null}
          {current === 'loans' ? <LoansSection settings={settings} onSaved={saved} /> : null}
          {current === 'payments' ? <PaymentsSection settings={settings} onSaved={saved} /> : null}
          {current === 'notifications' ? <NotificationsSection settings={settings} onSaved={saved} /> : null}
          {current === 'security' ? <SecuritySection settings={settings} onSaved={saved} /> : null}
        </div>
      </div>
    </div>
  )
}

function BusinessSection({ settings, onSaved }) {
  const [values, setValues] = useState(settings.business)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function onLogo(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 150 * 1024) {
      setErrors((current) => ({ ...current, logo: 'Use an image smaller than 150 KB.' }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => update('logo', String(reader.result))
    reader.readAsDataURL(file)
  }

  function handleSubmit(event) {
    event.preventDefault()
    try {
      saveBusinessProfile(values)
      setErrors({})
      setMessage('Saved in this browser. Existing receipts were not rewritten.')
      onSaved()
    } catch (error) {
      setMessage('')
      setErrors(error instanceof SettingsValidationError ? error.fields : { form: 'The profile could not be saved.' })
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      <SectionIntro title="Business profile" body="The name, address, and receipt line are used on new receipt downloads." />
      {message ? <Notice>{message}</Notice> : null}
      {errors.form ? <Alert>{errors.form}</Alert> : null}
      <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
        <TextField id="business-name" label="Business name" value={values.name} error={errors.name} onChange={(event) => update('name', event.target.value)} />
        <TextField id="business-phone" label="Contact number" inputMode="numeric" value={values.phone} error={errors.phone} onChange={(event) => update('phone', event.target.value)} />
        <TextField id="business-email" label="Email" type="email" value={values.email} error={errors.email} onChange={(event) => update('email', event.target.value)} />
        <TextField id="business-registration" label="Registration information" value={values.registration} error={errors.registration} hint="Optional" onChange={(event) => update('registration', event.target.value)} />
        <TextArea id="business-address" className="md:col-span-2" label="Business address" value={values.address} error={errors.address} onChange={(event) => update('address', event.target.value)} />
        <TextField id="business-footer" className="md:col-span-2" label="Receipt branding" value={values.receiptFooter} error={errors.receiptFooter} hint="Shown on new receipt downloads" onChange={(event) => update('receiptFooter', event.target.value)} />
        <div className="md:col-span-2">
          <label htmlFor="business-logo" className="mb-1.5 block text-sm font-medium text-navy-900">Logo</label>
          <input id="business-logo" type="file" accept="image/*" className="block text-sm text-slate-600" onChange={onLogo} />
          {errors.logo ? <p className="mt-1.5 text-sm text-rose-700">{errors.logo}</p> : null}
          {values.logo ? <img src={values.logo} alt="" className="mt-3 h-16 w-16 rounded-lg object-cover" /> : <p className="mt-2 text-sm text-slate-500">No logo uploaded. The wordmark is used.</p>}
        </div>
      </div>
      <Button type="submit">Save profile</Button>
    </form>
  )
}

function AdminsSection({ settings, onSaved }) {
  const [selected, setSelected] = useState(settings.admins[0].id)
  const admin = settings.admins.find((item) => item.id === selected) || settings.admins[0]
  const [values, setValues] = useState({ name: admin.name, phone: admin.phone })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const activeCount = settings.admins.filter((item) => item.status === 'Active').length

  function choose(id) {
    const next = settings.admins.find((item) => item.id === id)
    setSelected(id)
    setValues({ name: next.name, phone: next.phone })
    setErrors({})
    setMessage('')
  }

  function save(event) {
    event.preventDefault()
    try {
      saveAdminProfile(admin.id, values)
      setMessage('Profile saved in this browser. The email stays the account identity.')
      setErrors({})
      onSaved()
    } catch (error) {
      setErrors(error instanceof SettingsValidationError ? error.fields : { form: 'The profile could not be saved.' })
    }
  }

  function toggle() {
    try {
      setAdminStatus(admin.id, admin.status === 'Active' ? 'Inactive' : 'Active')
      setMessage(admin.status === 'Active' ? 'Administrator deactivated in this browser.' : 'Administrator activated in this browser.')
      setErrors({})
      onSaved()
    } catch (error) {
      setErrors(error instanceof SettingsValidationError ? error.fields : { form: 'The status could not be changed.' })
    }
  }

  return (
    <div className="space-y-5">
      <SectionIntro title="Admin accounts" body="Four administrators share the same permissions. There is no public registration, and an account is not deleted. The preview sign-in still opens the desk and does not reveal passwords." />
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 font-medium">Administrator</th>
              <th className="px-3 py-3 font-medium">Email</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Last login</th>
            </tr>
          </thead>
          <tbody>
            {settings.admins.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 last:border-0">
                <td className="px-5 py-3">
                  <button type="button" className="text-left font-semibold text-navy-900" onClick={() => choose(item.id)}>{item.name}</button>
                  <p className="text-xs text-slate-500">{item.id} · {item.role}</p>
                </td>
                <td className="px-3 py-3 text-slate-600">{item.email}</td>
                <td className="px-3 py-3"><Badge tone={item.status === 'Active' ? 'teal' : 'slate'}>{item.status}</Badge></td>
                <td className="px-5 py-3 text-slate-500">Not recorded per account</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2" noValidate onSubmit={save}>
        <p className="text-sm text-slate-600 md:col-span-2">{formatPhone(admin.phone)} · {admin.email}. {activeCount} of 4 administrators are active.</p>
        {message ? <div className="md:col-span-2"><Notice>{message}</Notice></div> : null}
        {errors.form || errors.status ? <div className="md:col-span-2"><Alert>{errors.form || errors.status}</Alert></div> : null}
        <TextField id="admin-name" label="Name" value={values.name} error={errors.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} />
        <TextField id="admin-phone" label="Phone" value={values.phone} error={errors.phone} onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))} />
        <TextField id="admin-email" label="Email" value={admin.email} disabled />
        <div className="flex flex-wrap items-end gap-3">
          <Button type="submit">Save profile</Button>
          <Button type="button" variant="secondary" onClick={toggle} disabled={admin.status === 'Active' && activeCount === 1}>
            {admin.status === 'Active' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function AgentsSection({ onSaved }) {
  const [message, setMessage] = useState('')
  const loans = listLoans()
  const agents = listAgents().map((agent) => ({ ...agent, customers: agentBook(loans, agent.id).assignedCustomers }))

  function toggle(agent) {
    setAgentStatus(agent.id, agent.status === 'Active' ? 'Inactive' : 'Active')
    setMessage(`${agent.name} is now ${agent.status === 'Active' ? 'inactive' : 'active'}.`)
    onSaved()
  }

  return (
    <div className="space-y-5">
      <SectionIntro title="Collection agents" body="These are the same agent records used by Collection Agents. This screen does not create a second directory." />
      {message ? <Notice>{message}</Notice> : null}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 font-medium">Agent</th>
              <th className="px-3 py-3 font-medium">Access</th>
              <th className="px-3 py-3 font-medium">Target</th>
              <th className="px-3 py-3 font-medium">Customers</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id} className="border-b border-slate-100 last:border-0">
                <td className="px-5 py-3">
                  <p className="font-semibold text-navy-900">{agent.name}</p>
                  <p className="text-xs text-slate-500">{agent.id} · <Badge tone={agent.status === 'Active' ? 'teal' : 'slate'}>{agent.status}</Badge></p>
                </td>
                <td className="px-3 py-3 text-slate-600">{agent.authMode === 'development' ? 'Development password' : 'API sign-in'}</td>
                <td className="px-3 py-3 text-slate-600">{agent.dailyTargetPaise == null ? 'Today’s book' : formatPaise(agent.dailyTargetPaise)}</td>
                <td className="px-3 py-3 tabular-nums text-slate-600">{agent.customers}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/agents/${agent.id}`} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>View</Link>
                    <Link to={`/agents/${agent.id}/edit`} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>Edit</Link>
                    <Link to={`/agents/${agent.id}/assign`} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>Assign</Link>
                    <button type="button" className={buttonClasses({ variant: 'secondary', size: 'sm' })} onClick={() => toggle(agent)}>
                      {agent.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LoansSection({ settings, onSaved }) {
  const [values, setValues] = useState(settings.loans)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  function save(event) {
    event.preventDefault()
    try {
      saveLoanSettings(values)
      setErrors({})
      setMessage('Defaults saved in this browser. Loans already on the book were not changed.')
      onSaved()
    } catch (error) {
      setErrors(error instanceof SettingsValidationError ? error.fields : { form: 'The loan defaults could not be saved.' })
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={save}>
      <SectionIntro title="Loan configuration" body="These defaults apply only when a new loan is opened. Active, completed, and pending contracts keep the terms already stored." />
      {message ? <Notice>{message}</Notice> : null}
      <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
        <SelectField id="loan-frequency" label="Default repayment frequency" value={values.frequency} error={errors.frequency} onChange={(event) => setValues((current) => ({ ...current, frequency: event.target.value }))}>
          <option value="Daily">Daily</option>
        </SelectField>
        <TextField id="loan-duration" label="Default loan duration (days)" inputMode="numeric" value={values.durationDays} error={errors.durationDays} hint="Prefilled on a new loan. The instalment must still divide the contract evenly." onChange={(event) => setValues((current) => ({ ...current, durationDays: event.target.value }))} />
        <SelectField id="loan-finance" label="Finance charge calculation" value={values.financeMethod} error={errors.financeMethod} onChange={(event) => setValues((current) => ({ ...current, financeMethod: event.target.value }))}>
          {FINANCE_METHODS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </SelectField>
        {values.financeMethod === 'percent' ? (
          <TextField id="loan-percent" label="Finance percent" value={values.financePercent} error={errors.financePercent} hint="Stored for a later loan service. It is not applied to open loans." onChange={(event) => setValues((current) => ({ ...current, financePercent: event.target.value }))} />
        ) : (
          <p className="text-sm leading-6 text-slate-600">Each loan still records the finance charge entered on its own form. Daily instalment × days must equal the total repayment.</p>
        )}
        <SelectField id="loan-activation" className="md:col-span-2" label="Loan activation" value={values.activation} error={errors.activation} onChange={(event) => setValues((current) => ({ ...current, activation: event.target.value }))}>
          {ACTIVATION_MODES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </SelectField>
      </div>
      <Button type="submit">Save loan defaults</Button>
    </form>
  )
}

function PaymentsSection({ settings, onSaved }) {
  const [values, setValues] = useState(settings.payments)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const receipts = listTransactions().map((payment) => payment.receiptNumber)
  const next = nextReceiptNumber(receipts, String(values.receiptPrefix || 'RCP').toUpperCase())

  function toggle(list, method) {
    const has = list.includes(method)
    return has ? list.filter((item) => item !== method) : [...list, method]
  }

  function save(event) {
    event.preventDefault()
    try {
      savePaymentSettings(values)
      setErrors({})
      setMessage('Saved in this browser. Issued transaction IDs and receipt numbers were not changed.')
      onSaved()
    } catch (error) {
      setErrors(error instanceof SettingsValidationError ? error.fields : { form: 'The payment settings could not be saved.' })
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={save}>
      <SectionIntro title="Payment settings" body="New receipts use the prefix below. The number continues after the highest receipt that already uses that prefix. TXN transaction IDs stay on their own sequence." />
      {message ? <Notice>{message}</Notice> : null}
      {errors.methods || errors.referenceMethods || errors.form ? <Alert>{errors.methods || errors.referenceMethods || errors.form}</Alert> : null}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <fieldset>
          <legend className="text-sm font-medium text-navy-900">Available methods</legend>
          <div className="mt-3 flex flex-wrap gap-4">
            {PAYMENT_METHODS.map((method) => (
              <label key={method} className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={values.methods.includes(method)} onChange={() => setValues((current) => ({ ...current, methods: toggle(current.methods, method) }))} />
                {method}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-medium text-navy-900">Reference required</legend>
          <div className="mt-3 flex flex-wrap gap-4">
            {PAYMENT_METHODS.map((method) => (
              <label key={method} className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={values.referenceMethods.includes(method)} onChange={() => setValues((current) => ({ ...current, referenceMethods: toggle(current.referenceMethods, method) }))} />
                {method}
              </label>
            ))}
          </div>
        </fieldset>
        <TextField id="receipt-prefix" label="Receipt prefix" value={values.receiptPrefix} error={errors.receiptPrefix} hint={`The next new receipt would be ${next}. Format: prefix, a hyphen, then four digits.`} onChange={(event) => setValues((current) => ({ ...current, receiptPrefix: event.target.value.toUpperCase() }))} />
        <p className="text-sm text-slate-600">Business name, address, phone, registration, and the receipt line from the business profile are added to a new PDF. Older downloaded files stay as they were.</p>
      </div>
      <Button type="submit">Save payment settings</Button>
    </form>
  )
}

function NotificationsSection({ settings, onSaved }) {
  const [values, setValues] = useState(settings.notifications)
  const [message, setMessage] = useState('')
  const items = [
    ['payment', 'Payment alerts'],
    ['overdue', 'Overdue notifications'],
    ['daily', 'Daily collection reminders'],
    ['agent', 'Agent activity notifications'],
  ]

  function save(event) {
    event.preventDefault()
    saveNotificationSettings(values)
    setMessage('Preferences saved in this browser. No notification was sent.')
    onSaved()
  }

  return (
    <form className="space-y-5" onSubmit={save}>
      <SectionIntro title="Notification preferences" body="These switches are stored here only. Email and push delivery are not connected." />
      {message ? <Notice>{message}</Notice> : null}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {items.map(([id, label]) => (
          <label key={id} className="flex min-h-11 items-center justify-between gap-4 text-sm font-medium text-navy-900">
            {label}
            <input type="checkbox" checked={values[id]} onChange={() => setValues((current) => ({ ...current, [id]: !current[id] }))} />
          </label>
        ))}
      </div>
      <Button type="submit">Save preferences</Button>
    </form>
  )
}

function SecuritySection({ settings, onSaved }) {
  const [password, setPassword] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [health, setHealth] = useState('checking')

  useEffect(() => {
    let active = true
    fetch('/api/health')
      .then((response) => response.json())
      .then((body) => {
        if (active) setHealth(body)
      })
      .catch(() => {
        if (active) setHealth(null)
      })
    return () => {
      active = false
    }
  }, [])

  function submit(event) {
    event.preventDefault()
    try {
      requestPasswordChange(password)
      setPassword({ password: '', confirm: '' })
      setErrors({})
      setMessage('The request was recorded. The password was not stored, and the preview sign-in is unchanged.')
      onSaved()
    } catch (error) {
      setMessage('')
      setErrors(error instanceof SettingsValidationError ? error.fields : { form: 'The request could not be recorded.' })
    }
  }

  const backup = health === 'checking'
    ? 'Checking the API.'
    : health?.database === 'not_connected'
      ? 'No backup is connected. Records in this browser are not copied to a server.'
      : health
        ? 'The API responded. A backup service is not part of this desk.'
        : 'The API did not respond. No backup is available.'

  return (
    <div className="space-y-5">
      <SectionIntro title="Security" body="Passwords and hashes are not shown. This preview session is not a production login." />
      <div className="grid gap-4 md:grid-cols-2">
        <Info title="Active session" body="This browser holds a development administrator preview. It has the same desk permissions as the other administrators. No session token is shown." />
        <Info title="Backup status" body={backup} />
      </div>
      <form className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2" noValidate onSubmit={submit}>
        <h2 className="text-sm font-semibold text-navy-900 md:col-span-2">Change password</h2>
        {message ? <div className="md:col-span-2"><Notice>{message}</Notice></div> : null}
        <TextField id="security-password" label="New password" type="password" autoComplete="new-password" value={password.password} error={errors.password} onChange={(event) => setPassword((current) => ({ ...current, password: event.target.value }))} />
        <TextField id="security-confirm" label="Confirm password" type="password" autoComplete="new-password" value={password.confirm} error={errors.confirm} onChange={(event) => setPassword((current) => ({ ...current, confirm: event.target.value }))} />
        <div>
          <Button type="submit">Record password request</Button>
        </div>
      </form>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-navy-900">Login and settings history</h2>
          <Link to="/audit-logs" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>Open audit logs</Link>
        </div>
        {settings.log.length === 0 ? <p className="mt-3 text-sm text-slate-500">No preview sign-in or settings change is recorded in this browser yet.</p> : (
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {settings.log.map((entry, index) => (
              <li key={`${entry.at}-${index}`}><span className="font-medium text-navy-900">{entry.action}</span> · {entry.at} · {entry.detail}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function SectionIntro({ title, body }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{body}</p>
    </div>
  )
}

function Notice({ children }) {
  return <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">{children}</p>
}

function Alert({ children }) {
  return <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{children}</p>
}

function Info({ title, body }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-navy-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </section>
  )
}
