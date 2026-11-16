import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AgentHeader } from '../../components/agent/AgentHeader'
import { CollectionStatusBadge } from '../../components/collections/CollectionStatusBadge'
import { EmptyState } from '../../components/ui/EmptyState'
import { SelectField } from '../../components/ui/SelectField'
import { TextField } from '../../components/ui/TextField'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { actor } from '../../services/access'
import { listCustomers } from '../../services/customerService'
import { listLoans } from '../../services/loanService'
import { agentBook, visibleAgentCollections } from '../../utils/agentBook'
import { COLLECTION_STATUSES } from '../../utils/collections'
import { formatPhone } from '../../utils/customers'
import { formatPaise } from '../../utils/currency'

export default function AgentCollectionsPage() {
  const session = actor()
  const book = agentBook(listLoans(), session.accountId)
  const customers = new Map(listCustomers().map((customer) => [customer.id, customer]))
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const status = params.get('status') || 'All'
  const rows = visibleAgentCollections(book.rows, { query, status })
  useDocumentTitle('Today’s collections')

  function update(next) {
    const following = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === 'All') following.delete(key)
      else following.set(key, value)
    }
    setParams(following)
  }

  return (
    <div>
      <AgentHeader />
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Collections</h1>
      <div className="mt-4 grid gap-3">
        <TextField
          id="agent-collection-search"
          label="Search customers"
          type="search"
          value={query}
          placeholder="Name or phone number"
          onChange={(event) => {
            setQuery(event.target.value)
            update({ q: event.target.value })
          }}
        />
        <SelectField id="agent-collection-status" label="Payment status" value={status} onChange={(event) => update({ status: event.target.value })}>
          <option value="All">All</option>
          {COLLECTION_STATUSES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </SelectField>
      </div>
      <p className="my-4 text-sm text-slate-500" role="status">
        {rows.length === 1 ? '1 instalment' : `${rows.length} instalments`}
      </p>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white">
          <EmptyState title="No assigned collections" description="Nothing in your book matches this search." />
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const customer = customers.get(row.customerId)
            return (
              <li key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy-900">{row.customerName}</p>
                    <p className="text-xs text-slate-500">{row.customerId} · {row.loanId}</p>
                  </div>
                  <CollectionStatusBadge status={row.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{formatPhone(row.phone)}</p>
                <p className="text-sm text-slate-600">{customer ? `${customer.address}, ${customer.place} ${customer.pinCode}` : row.place}</p>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <Field label="Expected" value={formatPaise(row.expected)} />
                  <Field label="Collected" value={formatPaise(row.collected)} />
                  <Field label="Remaining" value={formatPaise(row.remaining)} />
                </dl>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a className={buttonClasses({ variant: 'secondary', className: 'w-full' })} href={`tel:${row.phone}`}>
                    Call
                  </a>
                  <Link className={`${buttonClasses({ className: 'w-full' })}`} to={`/agent/collections/${row.loanId}/${row.instalmentNumber}/record`}>
                    Record payment
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-semibold text-navy-900 tabular-nums">{value}</dd>
    </div>
  )
}
