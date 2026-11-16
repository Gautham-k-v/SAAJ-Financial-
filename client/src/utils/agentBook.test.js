import assert from 'node:assert/strict'
import test from 'node:test'
import { agentSeed } from '../data/agentSeed.js'
import { customerSeed } from '../data/customerSeed.js'
import { loanSeed } from '../data/loanSeed.js'
import { agentBook, assignedCustomerLoans } from './agentBook.js'
import { presentLoan } from './loans.js'

const loans = loanSeed.map((loan) =>
  presentLoan(
    loan,
    customerSeed.find((customer) => customer.id === loan.customerId),
    agentSeed.find((agent) => agent.id === loan.agentId),
  ),
)

test('an agent book contains only that agent’s loans and today’s target', () => {
  const book = agentBook(loans, 'AGT-01')
  assert.ok(book.rows.every((row) => row.agentId === 'AGT-01'))
  assert.ok(book.activeLoans.every((loan) => loan.agentId === 'AGT-01'))
  assert.equal(book.target, book.dueToday.reduce((sum, row) => sum + row.expected, 0))
  assert.equal(book.remaining, Math.max(book.target - book.collected, 0))
  assert.equal(assignedCustomerLoans(loans, 'AGT-01', 'CUS-1320').length, 0)
  assert.ok(assignedCustomerLoans(loans, 'AGT-02', 'CUS-1320').length > 0)
})
