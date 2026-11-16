import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { AgentValidationError } from '../utils/agents.js'
import { getLoan, listLoans } from './loanService.js'
import { assignCustomerToAgent } from './loanService.js'
import {
  authenticateDevelopmentAgent,
  createAgent,
  listStoredAgents,
  setAgentStatus,
  updateAgent,
} from './agentService.js'

class MemoryStorage {
  #items = new Map()
  getItem(key) {
    return this.#items.has(key) ? this.#items.get(key) : null
  }
  setItem(key, value) {
    this.#items.set(key, String(value))
  }
}

const input = {
  name: 'Lakshmi Raman',
  phone: '9841099001',
  email: 'lakshmi.raman@saaj.example',
  address: '12, Lake View Road, Adyar',
  username: 'lakshmi',
  password: 'Fieldbook-05',
  dailyTarget: '2500',
  status: 'Active',
}

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage()
})

test('adds a development agent without storing the password on the profile', () => {
  assert.equal(listStoredAgents().length, 4)
  const created = createAgent(input)
  assert.equal(created.id, 'AGT-05')
  assert.equal(created.authMode, 'development')
  assert.equal(created.dailyTargetPaise, 250000)
  assert.equal('password' in created, false)
  assert.equal(authenticateDevelopmentAgent('lakshmi', 'Fieldbook-05')?.id, 'AGT-05')
  assert.equal(authenticateDevelopmentAgent('karthik', 'Fieldbook-01'), null)
  assert.throws(() => createAgent(input), AgentValidationError)
})

test('edits an agent, blocks an inactive development sign-in, and reassigns an open loan', () => {
  const created = createAgent(input)
  const edited = updateAgent(created.id, { ...input, name: 'Lakshmi R.', password: '', dailyTarget: '' })
  assert.equal(edited.name, 'Lakshmi R.')
  assert.equal(edited.dailyTargetPaise, null)
  setAgentStatus(created.id, 'Inactive')
  assert.equal(authenticateDevelopmentAgent('lakshmi', 'Fieldbook-05'), null)

  const before = getLoan('LN-2410')
  assert.equal(before.agentId, 'AGT-02')
  assignCustomerToAgent('CUS-1320', 'AGT-01')
  assert.equal(getLoan('LN-2410').agentId, 'AGT-01')
  assert.equal(listLoans().find((loan) => loan.id === 'LN-1540').agentId, 'AGT-02')
})
