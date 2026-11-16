import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AgentHeader } from '../../components/agent/AgentHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { TextField } from '../../components/ui/TextField'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { actor } from '../../services/access'
import { listCustomers } from '../../services/customerService'
import { listLoans } from '../../services/loanService'
import { agentBook } from '../../utils/agentBook'
import { formatPhone } from '../../utils/customers'
import { formatPaise } from '../../utils/currency'

export default function AgentCustomersPage() {
  const session = actor()
  const book = agentBook(listLoans(), session.accountId)
  const customers = listCustomers()
  const [query, setQuery] = useState('')
  const digits = query.replace(/\D/g, '')
  const text = query.trim().toLocaleLowerCase('en-IN')
  const rows = [...new Map(book.activeLoans.map((loan) => [loan.customerId, loan])).values()]
    .map((loan) => customers.find((customer) => customer.id === loan.customerId))
    .filter(Boolean)
    .filter((customer) => {
      if (!text) return true
      const name = customer.fullName.toLocaleLowerCase('en-IN').includes(text)
      const phone = digits.length > 0 && customer.phone.replace(/\D/g, '').includes(digits)
      return name || phone
    })
    .sort((left, right) => left.fullName.localeCompare(right.fullName, 'en-IN'))
  useDocumentTitle('Assigned customers')

  return (
    <div>
      <AgentHeader />
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Customers</h1>
      <div className="mt-4">
        <TextField id="agent-customer-search" label="Search" type="search" value={query} placeholder="Name or phone number" onChange={(event) => setQuery(event.target.value)} />
      </div>
      <p className="my-4 text-sm text-slate-500" role="status">{rows.length === 1 ? '1 customer' : `${rows.length} customers`}</p>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white">
          <EmptyState title="No assigned customers" description="Your book has no active customer with that name or phone." />
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((customer) => {
            const loans = book.activeLoans.filter((loan) => loan.customerId === customer.id)
            const outstanding = loans.reduce((sum, loan) => sum + loan.outstanding, 0)
            return (
              <li key={customer.id}>
                <Link to={`/agent/customers/${customer.id}`} className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="font-semibold text-navy-900">{customer.fullName}</p>
                  <p className="mt-1 text-sm text-slate-600">{customer.id} · {formatPhone(customer.phone)}</p>
                  <p className="mt-1 text-sm font-medium text-navy-900">Outstanding {formatPaise(outstanding)}</p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
