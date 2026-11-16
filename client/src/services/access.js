const AGENT_SESSION_KEY = 'saaj.agent.session'
const ADMIN_SESSION_KEY = 'saaj.preview.admin'

export class AccessError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AccessError'
    this.status = 403
  }
}

export function actor() {
  const store = browserSession()
  if (!store) return { role: 'system' }

  const raw = store.getItem(AGENT_SESSION_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed?.role === 'agent' && parsed.accountId) return parsed
    } catch {
      store.removeItem(AGENT_SESSION_KEY)
    }
  }

  if (store.getItem(ADMIN_SESSION_KEY) === '1') return { role: 'admin' }
  return { role: 'system' }
}

export function hasAgentSession() {
  return actor().role === 'agent'
}

export function saveAgentSession(session) {
  browserSession()?.setItem(
    AGENT_SESSION_KEY,
    JSON.stringify({
      role: 'agent',
      accountId: session.accountId,
      name: session.name,
      email: session.email,
      phone: session.phone,
      token: session.token || '',
    }),
  )
}

export function endAgentSession() {
  browserSession()?.removeItem(AGENT_SESSION_KEY)
}

export function agentToken() {
  const current = actor()
  return current.role === 'agent' ? current.token || '' : ''
}

export function assertAdmin(action) {
  if (actor().role === 'agent') {
    throw new AccessError(`Collection agents cannot ${action}.`)
  }
}

export function assertCanPostPayment(loan) {
  const current = actor()
  if (current.role !== 'agent') return current
  if (!loan || loan.agentId !== current.accountId) {
    throw new AccessError('This customer is not assigned to you.')
  }
  return current
}

function browserSession() {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage
}
