import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AgentForm } from '../../components/agents/AgentForm'
import { ErrorState } from '../../components/ui/ErrorState'
import { PageHeader } from '../../components/ui/PageHeader'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { createAgent, getStoredAgent, updateAgent } from '../../services/agentService'
import { AgentValidationError, emptyAgentForm, toAgentForm } from '../../utils/agents'

export default function AgentFormPage() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const existing = agentId ? getStoredAgent(agentId) : null
  const mode = agentId ? 'edit' : 'create'
  const [values, setValues] = useState(() => (existing ? toAgentForm(existing) : emptyAgentForm()))
  const [errors, setErrors] = useState({})
  useDocumentTitle(mode === 'edit' ? 'Edit agent' : 'Add agent')

  if (agentId && !existing) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState title="Agent not found" message="This agent ID is not in the directory." />
        <Link to="/agents" className={`${buttonClasses({ variant: 'secondary' })} mt-6`}>Back to agents</Link>
      </div>
    )
  }

  function handleSubmit(event) {
    event.preventDefault()
    try {
      const saved = mode === 'edit' ? updateAgent(agentId, values) : createAgent(values)
      navigate(`/agents/${saved.id}`, { replace: true })
    } catch (error) {
      if (error instanceof AgentValidationError) {
        setErrors(error.fields)
        return
      }
      setErrors({ form: 'The agent could not be saved.' })
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Collection agents"
        title={mode === 'edit' ? 'Edit agent' : 'Add agent'}
        description={
          mode === 'edit'
            ? 'Update the agent record. Issued accounts keep the username and email used by the API.'
            : 'Add an agent to the directory. The password is a development password stored in this browser.'
        }
      />
      <AgentForm
        mode={mode}
        agentId={existing?.id}
        authMode={existing?.authMode}
        values={values}
        errors={errors}
        onChange={setValues}
        onSubmit={handleSubmit}
        onCancel={() => navigate(existing ? `/agents/${existing.id}` : '/agents')}
      />
    </div>
  )
}
