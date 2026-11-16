import { Link, useParams, useSearchParams } from 'react-router-dom'
import { SaajWordmark } from '../../components/brand/SaajMark'
import { ErrorState } from '../../components/ui/ErrorState'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectField } from '../../components/ui/SelectField'
import { TextField } from '../../components/ui/TextField'
import { Button } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { getCustomer } from '../../services/customerService'
import { listLoans } from '../../services/loanService'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/datetime'
import { accountEntries, buildStatement, statementCsv } from '../../utils/ledger'
import { buildStatementPdf } from '../../utils/statementPdf'

export default function StatementPage() {
  const { customerId } = useParams()
  const customer = getCustomer(customerId)
  const loans = listLoans().filter((loan) => loan.customerId === customerId)
  const [params, setParams] = useSearchParams()
  const loanId = params.get('loan') || ''
  const from = params.get('from') || ''
  const to = params.get('to') || ''
  const generated = params.get('generated') === '1'
  useDocumentTitle(customer ? `${customer.fullName} statement` : 'Statement')

  if (!customer) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState title="Customer not found" message="Choose a customer from the ledger." />
        <Link to="/ledger" className={`${buttonClasses({ variant: 'secondary' })} mt-6`}>All customers</Link>
      </div>
    )
  }

  const entries = accountEntries(loans, customer.id, loanId)
  const statement = buildStatement(entries, { from, to })
  const loanLabel = loanId || 'All loans'
  const period = `${from ? formatDisplayDate(from) : 'Start'} – ${to ? formatDisplayDate(to) : 'Latest'}`

  function update(next) {
    const following = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (!value) following.delete(key)
      else following.set(key, value)
    }
    following.delete('generated')
    setParams(following)
  }

  function downloadPdf() {
    const bytes = buildStatementPdf({
      customerName: customer.fullName,
      customerId: customer.id,
      loanLabel,
      period,
      openingLabel: money(statement.opening),
      debitLabel: money(statement.debit),
      creditLabel: money(statement.credit),
      closingLabel: money(statement.closing),
      rows: statement.entries.map((entry) => ({
        date: formatDisplayDate(entry.date),
        kind: entry.kind,
        detail: `${entry.receiptNumber} ${entry.description}`,
      })),
    })
    saveFile(bytes, `${customer.id}-statement.pdf`, 'application/pdf')
  }

  function downloadCsv() {
    saveFile(new TextEncoder().encode(statementCsv(statement)), `${customer.id}-statement.csv`, 'text/csv')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="saaj-app-chrome">
        <PageHeader
          eyebrow="Account statement"
          title={customer.fullName}
          description="The statement is prepared from the customer ledger. It does not create a second set of transactions."
          actions={<Link to={`/ledger/${customer.id}`} className={buttonClasses({ variant: 'secondary' })}>Back to ledger</Link>}
        />
        <form
          className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            const following = new URLSearchParams(params)
            following.set('generated', '1')
            setParams(following)
          }}
        >
          <SelectField id="statement-loan" label="Loan" value={loanId} onChange={(event) => update({ loan: event.target.value })}>
            <option value="">All loans</option>
            {loans.map((loan) => (
              <option key={loan.id} value={loan.id}>{loan.id}</option>
            ))}
          </SelectField>
          <div className="hidden md:block" />
          <TextField id="statement-from" label="From" type="date" value={from} onChange={(event) => update({ from: event.target.value })} />
          <TextField id="statement-to" label="To" type="date" value={to} onChange={(event) => update({ to: event.target.value })} />
          <Button type="submit">Generate statement</Button>
        </form>
      </div>

      {generated ? (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between gap-4 bg-navy-900 px-5 py-5 text-white sm:px-8">
            <SaajWordmark light markTone="teal" />
            <p className="text-sm">Account statement</p>
          </header>
          <div className="px-5 py-6 sm:px-8">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Customer" value={`${customer.fullName} · ${customer.id}`} />
              <Detail label="Loans" value={loanLabel} />
              <Detail label="Period" value={period} />
              <Detail label="Opening balance" value={formatPaise(statement.opening)} />
              <Detail label="Debits" value={formatPaise(statement.debit)} />
              <Detail label="Credits" value={formatPaise(statement.credit)} />
              <Detail label="Closing balance" value={formatPaise(statement.closing)} />
            </dl>
            <ul className="mt-6 divide-y divide-slate-100 text-sm">
              {statement.entries.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-3 py-2">
                  <span>
                    <span className="font-medium text-navy-900">{formatDisplayDate(entry.date)} · {entry.kind}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{entry.description}</span>
                  </span>
                  <span className="font-medium text-navy-900 tabular-nums">{formatPaise(entry.balance)}</span>
                </li>
              ))}
            </ul>
            <div className="saaj-app-chrome mt-6 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={downloadPdf}>Download PDF</Button>
              <Button variant="secondary" onClick={() => window.print()}>Print</Button>
              <Button variant="secondary" onClick={downloadCsv}>Export CSV</Button>
            </div>
          </div>
        </article>
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

function money(paise) {
  return formatPaise(paise).replace('₹', 'Rs. ')
}

function saveFile(bytes, name, type) {
  const url = URL.createObjectURL(new Blob([bytes], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}
