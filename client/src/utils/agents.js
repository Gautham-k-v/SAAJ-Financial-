import { parseRupeesToPaise } from './currency.js'
import { agentBook } from './agentBook.js'
import { collectionRows, summarizeCollection } from './collections.js'
import { LOAN_BOOK_DATE } from './loans.js'

export const AGENT_STATUSES = ['Active', 'Inactive']

const PHONE_PATTERN = /^[6-9]\d{9}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_PATTERN = /^[a-z][a-z0-9.]{2,31}$/
const AGENT_ID_PATTERN = /^AGT-(\d+)$/

export class AgentValidationError extends Error {
  constructor(fields) {
    super('Check the agent details.')
    this.name = 'AgentValidationError'
    this.fields = fields
  }
}

export function createAgentId(existingIds) {
  let highest = 0
  for (const id of existingIds) {
    const match = AGENT_ID_PATTERN.exec(id)
    if (match) highest = Math.max(highest, Number(match[1]))
  }
  return `AGT-${String(highest + 1).padStart(2, '0')}`
}

export function emptyAgentForm() {
  return {
    name: '',
    phone: '',
    email: '',
    address: '',
    username: '',
    password: '',
    dailyTarget: '',
    status: 'Active',
  }
}

export function toAgentForm(agent) {
  return {
    name: agent.name,
    phone: agent.phone,
    email: agent.email,
    address: agent.address || '',
    username: agent.username,
    password: '',
    dailyTarget: agent.dailyTargetPaise == null ? '' : String(agent.dailyTargetPaise / 100),
    status: agent.status,
  }
}

export function validateAgent(input, { agents = [], ignoreId = '', authMode = 'development' } = {}) {
  const errors = {}
  const name = String(input.name ?? '').trim()
  const phone = String(input.phone ?? '').replace(/\D/g, '')
  const email = String(input.email ?? '').trim().toLocaleLowerCase('en-IN')
  const username = String(input.username ?? '').trim().toLocaleLowerCase('en-IN')
  const address = String(input.address ?? '').trim()
  const password = String(input.password ?? '')
  const status = input.status

  if (name.length < 2) errors.name = 'Enter the agent’s full name.'
  if (!PHONE_PATTERN.test(phone)) errors.phone = 'Enter a 10-digit Indian mobile number.'
  if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.'
  if (!USERNAME_PATTERN.test(username)) errors.username = 'Use 3–32 letters, numbers, or dots, starting with a letter.'
  if (address.length > 160) errors.address = 'Keep the address within 160 characters.'
  if (!AGENT_STATUSES.includes(status)) errors.status = 'Choose a status.'

  if (authMode === 'development' && !ignoreId && password.length < 8) {
    errors.password = 'Enter a development password of at least 8 characters.'
  }
  if (password && password.length < 8) errors.password = 'Enter a development password of at least 8 characters.'

  let dailyTargetPaise = null
  if (String(input.dailyTarget ?? '').trim()) {
    const parsed = parseRupeesToPaise(input.dailyTarget)
    if (parsed.error) errors.dailyTarget = parsed.error
    else dailyTargetPaise = parsed.paise
  }

  const taken = agents.find((agent) => agent.id !== ignoreId && (agent.username === username || agent.email === email || agent.phone === phone))
  if (taken && taken.username === username) errors.username = 'This username is already used.'
  if (taken && taken.email === email) errors.email = 'This email is already used.'
  if (taken && taken.phone === phone) errors.phone = 'This phone number is already used.'

  return {
    errors,
    agent: { name, phone, email, address, username, status, dailyTargetPaise },
    password,
  }
}

export function hasAgentErrors(errors) {
  return Object.keys(errors).length > 0
}

export function agentDesk(agents, loans, asOf = LOAN_BOOK_DATE) {
  const rows = agents.map((agent) => {
    const book = agentBook(loans, agent.id, asOf)
    return {
      ...agent,
      customers: book.assignedCustomers,
      bookTarget: book.target,
      target: agent.dailyTargetPaise ?? book.target,
      collected: book.collected,
      remaining: Math.max((agent.dailyTargetPaise ?? book.target) - book.collected, 0),
    }
  })
  const summary = summarizeCollection(collectionRows(loans, asOf), loans, asOf)
  const openCustomers = new Set(loans.filter((loan) => loan.status === 'Active').map((loan) => loan.customerId))
  return {
    total: agents.length,
    active: agents.filter((agent) => agent.status !== 'Inactive').length,
    inactive: agents.filter((agent) => agent.status === 'Inactive').length,
    assignedCustomers: openCustomers.size,
    collected: summary.collected,
    expected: summary.expected,
    percentage: summary.percentage,
    rows,
  }
}
