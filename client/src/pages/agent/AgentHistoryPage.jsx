import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AgentHeader } from '../../components/agent/AgentHeader'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { TextField } from '../../components/ui/TextField'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { actor } from '../../services/access'
import { listLoans } from '../../services/loanService'
import { filterTransactions, listTransactions } from '../../services/paymentService'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/datetime'

export default function AgentHistoryPage() {
  const session = actor()
  const loanIds = new Set(listLoans().filter((loan) => loan.agentId === session.accountId).map((loan) => loan.id))
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const rows = filterTransactions(
    listTransactions().filter((payment) => loanIds.has(payment.loanId)),
    { query, from, to },
  )
  useDocumentTitle('Collection history')

  return (
    <div>
      <AgentHeader />
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">History</h1>
      <div className="mt-4 grid gap-3">
        <TextField id="agent-history-search" label="Search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <TextField id="agent-history-from" label="From" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <TextField id="agent-history-to" label="To" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
      </div>
      <p className="my-4 text-sm text-slate-500" role="status">{rows.length === 1 ? '1 receipt' : `${rows.length} receipts`}</p>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white">
          <EmptyState title="No collections" description="No receipt on your assigned loans matches this search." />
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((payment) => (
            <li key={payment.id}>
              <Link to={`/agent/receipts/${payment.id}`} className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy-900">{payment.customerName}</p>
                    <p className="mt-1 text-xs text-slate-500">{payment.id} · {payment.receiptNumber}</p>
                  </div>
                  <Badge tone={payment.status === 'Reversed' || payment.type === 'reversal' ? 'rose' : 'teal'}>
                    {payment.type === 'reversal' ? 'Reversal' : payment.status}
                  </Badge>
                </div>
                <p className="mt-3 text-sm font-semibold text-navy-900 tabular-nums">{formatPaise(payment.amount)}</p>
                <p className="mt-1 text-sm text-slate-600">{payment.method} · {formatDisplayDate(payment.paidOn)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
