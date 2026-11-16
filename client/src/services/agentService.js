import { agentSeed } from '../data/agentSeed.js'
import { assertAdmin } from './access.js'
import { AgentValidationError, createAgentId, hasAgentErrors, validateAgent } from '../utils/agents.js'
import { recordAgentCreated } from './notificationService.js'

const STORAGE_KEY = 'saaj.agents.v1'
const DEVELOPMENT_AUTH_KEY = 'saaj.agent.dev-auth.v1'

/**
 * Agent directory for this browser.
 * Issued accounts (the original four) sign in through the API.
 * Agents added here use a separate development password store.
 * That store is not production authentication.
 */
export function listStoredAgents() {
  return readAgents().map(publicAgent)
}

export function getStoredAgent(agentId) {
  const agent = readAgents().find((record) => record.id === agentId)
  return agent ? publicAgent(agent) : null
}

export function createAgent(input) {
  assertAdmin('create an agent')
  const agents = readAgents()
  const { errors, agent, password } = validateAgent(input, { agents, authMode: 'development' })
  if (hasAgentErrors(errors)) throw new AgentValidationError(errors)

  const record = {
    ...agent,
    id: createAgentId(agents.map((item) => item.id)),
    authMode: 'development',
    createdAt: '2026-11-16',
  }
  writeAgents([record, ...agents])
  writeDevelopmentPassword(record.id, password)
  const profile = publicAgent(record)
  recordAgentCreated(profile)
  return profile
}

export function updateAgent(agentId, input) {
  assertAdmin('edit an agent')
  const agents = readAgents()
  const current = agents.find((agent) => agent.id === agentId)
  if (!current) throw new Error('Agent not found.')

  const { errors, agent, password } = validateAgent(input, {
    agents,
    ignoreId: agentId,
    authMode: current.authMode,
  })
  if (hasAgentErrors(errors)) throw new AgentValidationError(errors)

  const record = {
    ...current,
    ...agent,
    username: current.authMode === 'server' ? current.username : agent.username,
    email: current.authMode === 'server' ? current.email : agent.email,
  }
  writeAgents(agents.map((item) => (item.id === agentId ? record : item)))
  if (current.authMode === 'development' && password) writeDevelopmentPassword(agentId, password)
  return publicAgent(record)
}

export function setAgentStatus(agentId, status) {
  assertAdmin('change an agent’s status')
  const agents = readAgents()
  const current = agents.find((agent) => agent.id === agentId)
  if (!current) throw new Error('Agent not found.')
  if (status !== 'Active' && status !== 'Inactive') throw new Error('Choose a status.')
  const record = { ...current, status }
  writeAgents(agents.map((item) => (item.id === agentId ? record : item)))
  return publicAgent(record)
}

/** Development sign-in for agents created by an administrator. Issued accounts return null. */
export function authenticateDevelopmentAgent(identifier, password) {
  const key = String(identifier ?? '').trim().toLocaleLowerCase('en-IN')
  const secret = String(password ?? '')
  if (!key || !secret) return null
  const agent = readAgents().find((item) => item.authMode === 'development' && (item.username === key || item.email === key))
  if (!agent || agent.status === 'Inactive') return null
  const passwords = readDevelopmentPasswords()
  if (passwords[agent.id] !== secret) return null
  return publicAgent(agent)
}

function publicAgent(agent) {
  return {
    id: agent.id,
    name: agent.name,
    phone: agent.phone,
    email: agent.email,
    address: agent.address || '',
    username: agent.username,
    dailyTargetPaise: agent.dailyTargetPaise ?? null,
    status: agent.status || 'Active',
    authMode: agent.authMode || 'server',
    createdAt: agent.createdAt || '2026-11-16',
  }
}

function seedAgents() {
  return agentSeed.map((agent) => ({
    ...agent,
    address: '',
    dailyTargetPaise: null,
    status: 'Active',
    authMode: 'server',
    createdAt: '2026-11-16',
  }))
}

function readAgents() {
  const stored = storage().getItem(STORAGE_KEY)
  if (!stored) {
    const seed = seedAgents()
    storage().setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
  try {
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) throw new Error('Agent records are unreadable.')
    return parsed
  } catch {
    const seed = seedAgents()
    storage().setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

function writeAgents(agents) {
  storage().setItem(STORAGE_KEY, JSON.stringify(agents))
}

function readDevelopmentPasswords() {
  const stored = storage().getItem(DEVELOPMENT_AUTH_KEY)
  if (!stored) return {}
  try {
    const parsed = JSON.parse(stored)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeDevelopmentPassword(agentId, password) {
  const passwords = readDevelopmentPasswords()
  passwords[agentId] = password
  storage().setItem(DEVELOPMENT_AUTH_KEY, JSON.stringify(passwords))
}

function storage() {
  if (typeof localStorage === 'undefined') {
    throw new Error('Agent records are stored in the browser for this stage.')
  }
  return localStorage
}
