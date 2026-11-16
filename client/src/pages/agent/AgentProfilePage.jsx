import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AgentHeader } from '../../components/agent/AgentHeader'
import { Button } from '../../components/ui/Button'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { actor } from '../../services/access'
import { signOutAgent } from '../../services/authService'
import { listLoans } from '../../services/loanService'
import { agentBook } from '../../utils/agentBook'
import { formatPhone } from '../../utils/customers'
import { formatCount, formatPaise, formatPercent } from '../../utils/currency'

export default function AgentProfilePage() {
  const navigate = useNavigate()
  const session = actor()
  const book = agentBook(listLoans(), session.accountId)
  const [pending, setPending] = useState(false)
  useDocumentTitle('Agent profile')

  async function logout() {
    setPending(true)
    await signOutAgent()
    navigate('/agent/login', { replace: true })
  }

  return (
    <div>
      <AgentHeader />
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{session.name}</h1>
      <p className="mt-1 text-sm text-slate-500">Collection agent. This screen cannot change permissions.</p>
      <dl className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <Detail label="Contact number" value={formatPhone(session.phone)} />
        <Detail label="Email" value={session.email} />
        <Detail label="Assigned customers" value={formatCount(book.assignedCustomers)} />
        <Detail label="Daily target" value={formatPaise(book.target)} />
        <Detail label="Collection performance" value={`${formatPercent(book.percentage)} collected today`} />
      </dl>
      <Button className="mt-5 w-full" variant="secondary" disabled={pending} onClick={logout}>
        {pending ? 'Signing out' : 'Log out'}
      </Button>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-navy-900">{value}</dd>
    </div>
  )
}
