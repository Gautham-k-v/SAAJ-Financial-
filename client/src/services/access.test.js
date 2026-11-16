import assert from 'node:assert/strict'
import test from 'node:test'
import { AccessError, assertAdmin, assertCanPostPayment, endAgentSession, saveAgentSession } from './access.js'
import { createLoan } from './loanService.js'
import { postPayment, reversePayment } from './paymentService.js'

class MemoryStorage {
  constructor() {
    this.map = new Map()
  }

  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null
  }

  setItem(key, value) {
    this.map.set(key, String(value))
  }

  removeItem(key) {
    this.map.delete(key)
  }
}

test('a collection agent cannot create loans, reverse payments, or collect for another agent', () => {
  const previous = globalThis.sessionStorage
  globalThis.sessionStorage = new MemoryStorage()
  saveAgentSession({
    role: 'agent',
    accountId: 'AGT-01',
    name: 'Karthik Rajan',
    email: 'karthik.rajan@saaj.example',
    phone: '9841011001',
    token: 'abc',
  })

  try {
    assert.throws(() => createLoan({}), AccessError)
    assert.throws(() => reversePayment('TXN-1', { reason: 'Wrong receipt' }), AccessError)
    assert.throws(() => assertCanPostPayment({ agentId: 'AGT-02' }), AccessError)
    assert.equal(assertCanPostPayment({ agentId: 'AGT-01' }).accountId, 'AGT-01')
    assert.throws(() => assertAdmin('open reports'), AccessError)
    assert.equal(typeof postPayment, 'function')
  } finally {
    endAgentSession()
    globalThis.sessionStorage = previous
  }
})
