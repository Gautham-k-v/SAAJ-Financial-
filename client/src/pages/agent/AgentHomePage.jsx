import { AgentHeader } from '../../components/agent/AgentHeader'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { actor } from '../../services/access'
import { listLoans } from '../../services/loanService'
import { agentBook } from '../../utils/agentBook'
import { formatCount, formatPaise, formatPercent } from '../../utils/currency'

export default function AgentHomePage() {
  const session = actor()
  const book = agentBook(listLoans(), session.accountId)
  const progress = Math.max(0, Math.min(book.percentage, 1))
  useDocumentTitle('Field home')

  return (
    <div>
      <AgentHeader />
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Welcome, {session.name.split(' ')[0]}</h1>
      <p className="mt-1 text-sm text-slate-500">Today’s collection uses the loans assigned to you.</p>
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Collected</p>
            <p className="mt-1 text-3xl font-semibold text-navy-900 tabular-nums">{formatPaise(book.collected)}</p>
          </div>
          <p className="text-sm font-semibold text-teal-800">{formatPercent(book.percentage)}</p>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="Collection progress">
          <div className="h-full rounded-full bg-teal-700" style={{ width: `${progress * 100}%` }} />
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <Metric label="Daily target" value={formatPaise(book.target)} />
          <Metric label="Remaining" value={formatPaise(book.remaining)} />
          <Metric label="Assigned customers" value={formatCount(book.assignedCustomers)} />
          <Metric label="Completed today" value={formatCount(book.completed)} />
          <Metric label="Pending today" value={formatCount(book.pending)} />
        </dl>
      </section>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-navy-900 tabular-nums">{value}</dd>
    </div>
  )
}
