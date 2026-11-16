import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '../../components/ui/ErrorState'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectField } from '../../components/ui/SelectField'
import { Button } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { getStoredAgent } from '../../services/agentService'
import { assignCustomerToAgent, listAgents, listLoans } from '../../services/loanService'
import { listCustomers } from '../../services/customerService'
import { LoanStateError } from '../../utils/loans'

export default function AgentAssignPage() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const agent = getStoredAgent(agentId)
  const loans = listLoans()
  const customers = listCustomers()
    .map((customer) => {
      const open = loans.filter((loan) => loan.customerId === customer.id && (loan.status === 'Active' || loan.status === 'Pending'))
      const current = listAgents().find((item) => item.id === open[0]?.agentId)
      return { customer, open, current }
    })
    .filter((row) => row.open.length > 0)
  const [customerId, setCustomerId] = useState(customers.find((row) => row.current?.id !== agentId)?.customer.id || customers[0]?.customer.id || '')
  const [error, setError] = useState('')
  useDocumentTitle('Assign customer')

  if (!agent) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState title="Agent not found" message="This agent ID is not in the directory." />
        <Link to="/agents" className={`${buttonClasses({ variant: 'secondary' })} mt-6`}>Back to agents</Link>
      </div>
    )
  }

  const selected = customers.find((row) => row.customer.id === customerId)

  function handleSubmit(event) {
    event.preventDefault()
    try {
      assignCustomerToAgent(customerId, agent.id)
      navigate(`/agents/${agent.id}`, { replace: true })
    } catch (caught) {
      setError(caught instanceof LoanStateError ? caught.message : 'The customer could not be assigned.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={agent.id}
        title={`Assign customers to ${agent.name}`}
        description="Open loans move to this agent. Completed and cancelled loans stay with the agent who held them."
      />
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p> : null}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SelectField id="assign-customer" label="Customer" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            {customers.map((row) => (
              <option key={row.customer.id} value={row.customer.id}>
                {row.customer.fullName} · {row.customer.id} · {row.current?.name || 'Unassigned'}
              </option>
            ))}
          </SelectField>
          {selected ? (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {selected.open.length === 1 ? '1 open loan' : `${selected.open.length} open loans`}: {selected.open.map((loan) => loan.id).join(', ')}.
              Currently with {selected.current?.name || 'no agent'}.
            </p>
          ) : null}
        </section>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={agent.status === 'Inactive' || !customerId}>Assign customer</Button>
          <Link to={`/agents/${agent.id}`} className={buttonClasses({ variant: 'secondary' })}>Cancel</Link>
        </div>
      </form>
    </div>
  )
}
