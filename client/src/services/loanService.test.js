import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { LoanStateError, LoanValidationError } from '../utils/loans.js'
import { activateLoan, cancelLoan, createLoan, getLoan, updatePendingLoan } from './loanService.js'

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
  customerId: 'CUS-1502',
  principal: '10000',
  financeCharge: '2000',
  totalRepayment: '12000',
  dailyInstalment: '1200',
  repaymentDays: '10',
  startDate: '2026-11-16',
  agentId: 'AGT-01',
  remarks: 'Desk sample',
}

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage()
})

test('opens a pending loan and generates an unpaid schedule', () => {
  const created = createLoan(input)

  assert.equal(created.id, 'LN-2502')
  assert.equal(created.customerName, 'Geetha Raman')
  assert.equal(created.status, 'Pending')
  assert.equal(created.schedule.length, 10)
  assert.equal(created.schedule[0].dueDate, '2026-11-16')
  assert.equal(created.schedule[9].dueDate, '2026-11-25')
  assert.equal(created.schedule.every((row) => row.paid === 0 && row.expected === 120000), true)
  assert.equal(created.payments.length, 0)
  assert.equal(created.outstanding, 1200000)
  assert.equal(created.audit[0].action, 'Loan created')
})

test('keeps terms and schedule unchanged when a loan is activated', () => {
  const created = createLoan(input)
  const active = activateLoan(created.id)

  assert.equal(active.displayStatus, 'Active')
  assert.deepEqual(
    active.schedule.map((row) => [row.dueDate, row.expected, row.paid]),
    created.schedule.map((row) => [row.dueDate, row.expected, row.paid]),
  )
  assert.equal(active.audit.at(-1).action, 'Loan activated')
  assert.throws(() => updatePendingLoan(created.id, input), LoanStateError)
  assert.deepEqual(getLoan(created.id).schedule.map((row) => row.expected), created.schedule.map((row) => row.expected))
})

test('replaces pending terms explicitly and refuses an uneven contract', () => {
  const updated = updatePendingLoan('LN-2501', { ...input, repaymentDays: '12', dailyInstalment: '1000' })
  assert.equal(updated.id, 'LN-2501')
  assert.equal(updated.repaymentDays, 12)
  assert.equal(updated.schedule.length, 12)
  assert.equal(updated.audit.at(-1).action, 'Loan terms updated')

  assert.throws(() => createLoan({ ...input, totalRepayment: '10000' }), LoanValidationError)
  assert.throws(() => createLoan({ ...input, customerId: 'CUS-0762' }), LoanValidationError)
})

test('cancels a loan without rewriting its instalments', () => {
  const before = getLoan('LN-2501')
  const cancelled = cancelLoan('LN-2501')

  assert.equal(cancelled.status, 'Cancelled')
  assert.equal(cancelled.outstanding, 0)
  assert.deepEqual(
    cancelled.schedule.map((row) => row.expected),
    before.schedule.map((row) => row.expected),
  )
  assert.equal(cancelled.audit.at(-1).action, 'Loan cancelled')
})

test('reports the sample overdue loan from missed instalments', () => {
  const joseph = getLoan('LN-1690')
  assert.equal(joseph.displayStatus, 'Overdue')
  assert.equal(joseph.customerName, 'Joseph Raj')
  assert.equal(joseph.agentName, 'Karthik Rajan')
  assert.equal(joseph.overdueAmount, 360000)
  assert.equal(joseph.outstanding, 360000)
  assert.equal(joseph.totalRepaid, 240000)
  assert.equal(joseph.payments.length, 4)
})
