import { Link, useParams } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { ErrorState } from '../../components/ui/ErrorState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { getStoredAgent } from '../../services/agentService'
import { listCustomers } from '../../services/customerService'
import { listLoans } from '../../services/loanService'
import { listTransactions } from '../../services/paymentService'
import { agentBook } from '../../utils/agentBook'
import { formatCount, formatPaise, formatPercent } from '../../utils/currency'
import { formatPhone } from '../../utils/customers'
import { formatDisplayDate } from '../../utils/datetime'
import { LOAN_BOOK_DATE } from '../../utils/loans'
import { periodCollections } from '../../utils/reports'
import { HandCoins, Landmark, Users } from 'lucide-react'

export default function AgentDetailPage() {
  const { agentId } = useParams()
  const agent = getStoredAgent(agentId)
  const loans = listLoans().filter((loan) => loan.agentId === agentId)
  const book = agent ? agentBook(listLoans(), agent.id) : null
  const monthStart = `${LOAN_BOOK_DATE.slice(0, 7)}-01`
  const month = periodCollections(loans, monthStart, LOAN_BOOK_DATE)
  const customers = assignedCustomers(loans)
  const history = listTransactions().filter((payment) => loans.some((loan) => loan.id === payment.loanId)).slice(0, 12)
  useDocumentTitle(agent ? agent.name : 'Agent')

  if (!agent || !book) {
    return (
      <div className="mx-auto max-w-[1600px]">
        <ErrorState title="Agent not found" message="This agent ID is not in the directory." />
        <Link to="/agents" className={`${buttonClasses({ variant: 'secondary' })} mt-6`}>Back to agents</Link>
      </div>
    )
  }

  const target = agent.dailyTargetPaise ?? book.target

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        eyebrow={agent.id}
        title={agent.name}
        description={agent.authMode === 'development' ? 'Development account. The password is stored in this browser.' : 'Issued account. Sign-in is checked by the API.'}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={`/agents/${agent.id}/edit`} className={buttonClasses({ variant: 'secondary' })}>Edit</Link>
            <Link to={`/agents/${agent.id}/assign`} className={buttonClasses()}>Assign customer</Link>
          </div>
        }
      />

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={agent.status === 'Active' ? 'teal' : 'slate'}>{agent.status}</Badge>
          <p className="text-sm text-slate-600">{formatPhone(agent.phone)}</p>
          <p className="text-sm text-slate-600">{agent.email}</p>
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Username</dt>
            <dd className="mt-1 text-sm text-navy-900">{agent.username}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Address</dt>
            <dd className="mt-1 text-sm text-navy-900">{agent.address || '—'}</dd>
          </div>
        </dl>
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned customers" value={formatCount(book.assignedCustomers)} hint="Open loans" icon={Users} />
        <StatCard label="Today’s target" value={formatPaise(target)} hint={agent.dailyTargetPaise == null ? 'Taken from today’s book' : 'Set by the desk'} icon={Landmark} />
        <StatCard label="Collected today" value={formatPaise(book.collected)} hint={`${formatPercent(book.percentage)} of the book`} icon={HandCoins} tone="teal" />
        <StatCard label="This month" value={formatPaise(month.collected)} hint={`${formatPercent(month.percentage)} of ${formatPaise(month.expected)} expected`} icon={HandCoins} tone="teal" />
      </div>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-navy-900">Assigned customers</h2>
        <RecordTable
          empty="No open loans are assigned to this agent."
          columns={['Customer', 'Phone', 'Loans', 'Outstanding']}
          rows={customers.map((row) => [
            row.customer.fullName,
            formatPhone(row.customer.phone),
            row.loans.map((loan) => loan.id).join(', '),
            formatPaise(row.loans.reduce((sum, loan) => sum + loan.outstanding, 0)),
          ])}
        />
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-navy-900">Assigned loans</h2>
        <RecordTable
          empty="No loans are assigned to this agent."
          columns={['Loan', 'Customer', 'Status', 'Outstanding']}
          rows={loans.map((loan) => [loan.id, loan.customerName, loan.displayStatus || loan.status, formatPaise(loan.outstanding)])}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-navy-900">Collection history</h2>
        <RecordTable
          empty="No receipts are stored on these loans."
          columns={['Date', 'Receipt', 'Customer', 'Amount', 'Method']}
          rows={history.map((payment) => [
            formatDisplayDate(payment.paidOn),
            payment.receiptNumber || payment.id,
            payment.customerName,
            formatPaise(payment.amount),
            payment.method,
          ])}
        />
      </section>
    </div>
  )
}

function assignedCustomers(loans) {
  const open = loans.filter((loan) => loan.status === 'Active' || loan.status === 'Pending')
  const ids = [...new Set(open.map((loan) => loan.customerId))]
  return ids.map((customerId) => ({
    customer: listCustomers().find((customer) => customer.id === customerId) || { fullName: customerId, phone: '' },
    loans: open.filter((loan) => loan.customerId === customerId),
  }))
}

function RecordTable({ columns, rows, empty }) {
  if (rows.length === 0) return <p className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-500">{empty}</p>
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-slate-500">
          <tr className="border-b border-slate-100">
            {columns.map((column) => (
              <th key={column} className="px-5 py-3 font-medium">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-slate-100 last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-5 py-3 text-slate-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
