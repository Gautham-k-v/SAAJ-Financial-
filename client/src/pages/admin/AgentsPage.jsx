import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HandCoins, Landmark, UserRound, Users } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { TextField } from '../../components/ui/TextField'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { setAgentStatus } from '../../services/agentService'
import { listAgents, listLoans } from '../../services/loanService'
import { agentDesk } from '../../utils/agents'
import { formatCount, formatPaise, formatPercent } from '../../utils/currency'
import { formatPhone } from '../../utils/customers'

export default function AgentsPage() {
  const [query, setQuery] = useState('')
  const [revision, setRevision] = useState(0)
  const desk = agentDesk(listAgents(), listLoans())
  const text = query.trim().toLocaleLowerCase('en-IN')
  const rows = desk.rows.filter((agent) => {
    if (!text) return true
    return [agent.id, agent.name, agent.phone, agent.email, agent.username].join(' ').toLocaleLowerCase('en-IN').includes(text)
  })
  useDocumentTitle('Collection Agents')

  function toggleStatus(agent) {
    setAgentStatus(agent.id, agent.status === 'Active' ? 'Inactive' : 'Active')
    setRevision((current) => current + 1)
  }

  return (
    <div className="mx-auto max-w-[1600px]" data-revision={revision}>
      <PageHeader
        eyebrow="Field"
        title="Collection Agents"
        description="Agents added here use a development password in this browser. The four issued accounts still sign in through the API."
        actions={
          <Link to="/agents/new" className={buttonClasses()}>
            Add agent
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total agents" value={formatCount(desk.total)} hint="Issued and added accounts" icon={Users} />
        <StatCard label="Active agents" value={formatCount(desk.active)} hint="Able to sign in" icon={UserRound} tone="teal" />
        <StatCard label="Inactive agents" value={formatCount(desk.inactive)} hint="Sign-in is blocked" icon={UserRound} tone="amber" />
        <StatCard label="Assigned customers" value={formatCount(desk.assignedCustomers)} hint="Customers with an open loan" icon={Landmark} />
        <StatCard label="Today’s collection" value={formatPercent(desk.percentage)} hint={`${formatPaise(desk.collected)} of ${formatPaise(desk.expected)}`} icon={HandCoins} tone="teal" />
      </div>

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <TextField id="agent-search" label="Search" type="search" value={query} placeholder="Name, phone, or agent ID" onChange={(event) => setQuery(event.target.value)} />
      </div>

      <p className="mb-4 text-sm text-slate-500" role="status">
        {rows.length === 1 ? '1 agent' : `${rows.length} agents`}
      </p>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 font-medium">Agent</th>
              <th className="px-3 py-3 font-medium">Phone</th>
              <th className="px-3 py-3 font-medium">Email</th>
              <th className="px-3 py-3 font-medium">Customers</th>
              <th className="px-3 py-3 font-medium">Target</th>
              <th className="px-3 py-3 font-medium">Collected today</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((agent) => (
              <tr key={agent.id} className="border-b border-slate-100 last:border-0">
                <td className="px-5 py-3">
                  <p className="font-semibold text-navy-900">{agent.name}</p>
                  <p className="text-xs text-slate-500">{agent.id}</p>
                </td>
                <td className="px-3 py-3 text-slate-600">{formatPhone(agent.phone)}</td>
                <td className="px-3 py-3 text-slate-600">{agent.email}</td>
                <td className="px-3 py-3 tabular-nums text-slate-600">{agent.customers}</td>
                <td className="px-3 py-3 tabular-nums text-slate-600">{formatPaise(agent.target)}</td>
                <td className="px-3 py-3 tabular-nums text-navy-900">{formatPaise(agent.collected)}</td>
                <td className="px-3 py-3">
                  <Badge tone={agent.status === 'Active' ? 'teal' : 'slate'}>{agent.status}</Badge>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/agents/${agent.id}`} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>View</Link>
                    <Link to={`/agents/${agent.id}/edit`} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>Edit</Link>
                    <Link to={`/agents/${agent.id}/assign`} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>Assign</Link>
                    <button type="button" className={buttonClasses({ variant: 'secondary', size: 'sm' })} onClick={() => toggleStatus(agent)}>
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
