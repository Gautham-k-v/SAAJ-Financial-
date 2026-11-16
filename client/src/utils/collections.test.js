import assert from 'node:assert/strict'
import test from 'node:test'
import { agentSeed } from '../data/agentSeed.js'
import { customerSeed } from '../data/customerSeed.js'
import { loanSeed } from '../data/loanSeed.js'
import { buildDashboardView } from './dashboardView.js'
import { presentLoan, settleLoan } from './loans.js'
import {
  buildDashboardSource,
  collectionRows,
  filterCollections,
  summarizeCollection,
  validatePaymentDraft,
} from './collections.js'

const loans = loanSeed.map((loan) =>
  presentLoan(
    loan,
    customerSeed.find((customer) => customer.id === loan.customerId),
    agentSeed.find((agent) => agent.id === loan.agentId),
  ),
)

test('derives instalment status from allocations, not from an unallocated payment', () => {
  const loan = settleLoan({
    schedule: [{ number: 1, dueDate: '2026-11-16', expected: 100000, paid: 999999, remaining: 0, status: 'Paid' }],
    payments: [
      { id: 'open', amount: 100000, paidOn: '2026-11-16' },
      {
        id: 'part',
        amount: 40000,
        paidOn: '2026-11-16',
        allocations: [{ instalmentNumber: 1, amount: 25000 }, { instalmentNumber: 1, amount: 15000 }],
      },
    ],
  })

  assert.equal(loan.schedule[0].paid, 40000)
  assert.equal(loan.schedule[0].status, 'Partial')
  assert.equal(loan.schedule[0].remaining, 60000)
})

test('covers an instalment only when the allocated payments reach the expected amount', () => {
  const loan = settleLoan({
    schedule: [{ number: 1, dueDate: '2026-11-16', expected: 100000, paid: 0, remaining: 100000, status: 'Unpaid' }],
    payments: [
      { id: 'a', amount: 40000, paidOn: '2026-11-16', allocations: [{ instalmentNumber: 1, amount: 40000 }] },
      { id: 'b', amount: 60000, paidOn: '2026-11-16', allocations: [{ instalmentNumber: 1, amount: 60000 }] },
    ],
  })

  assert.equal(loan.schedule[0].paid, 100000)
  assert.equal(loan.schedule[0].status, 'Paid')
})

test('splits the sample book into paid, partial, unpaid, and overdue rows', () => {
  const today = collectionRows(loans, '2026-11-16')
  const kavitha = today.find((row) => row.loanId === 'LN-2410')
  const joseph = today.find((row) => row.loanId === 'LN-1690')

  assert.equal(kavitha.status, 'Unpaid')
  assert.equal(kavitha.expected, 120000)
  assert.equal(joseph.status, 'Overdue')
  assert.equal(today.some((row) => row.loanId === 'LN-2501'), false)

  const earlier = collectionRows(loans, '2026-11-15')
  assert.equal(earlier.find((row) => row.loanId === 'LN-2410').status, 'Paid')
  assert.equal(earlier.find((row) => row.loanId === 'LN-2076').status, 'Partial')
  assert.equal(earlier.find((row) => row.loanId === 'LN-2076').collected, 50000)
  assert.equal(earlier.find((row) => row.loanId === 'LN-2020').status, 'Unpaid')

  const summary = summarizeCollection(today, loans, '2026-11-16')
  assert.equal(summary.expected, 565000)
  assert.equal(summary.collected, 0)
  assert.equal(summary.pending, 565000)
  assert.equal(summary.percentage, 0)
  assert.ok(summary.overdueAmount > joseph.remaining)
})

test('searches by name and phone and filters by agent', () => {
  const rows = collectionRows(loans, '2026-11-16')
  assert.deepEqual(
    filterCollections(rows, { query: 'kavitha' }).map((row) => row.loanId),
    ['LN-2410'],
  )
  assert.equal(filterCollections(rows, { query: '98410 13200' }).length, 1)
  assert.equal(filterCollections(rows, { status: 'Overdue', agentId: 'AGT-01' }).every((row) => row.agentId === 'AGT-01'), true)
})

test('feeds the dashboard from the same collection totals', () => {
  const source = buildDashboardSource(loans, '2026-11-16')
  const view = buildDashboardView(source)

  assert.equal(view.book.expectedToday, 565000)
  assert.equal(view.book.collectedToday, 0)
  assert.equal(view.pendingToday, 565000)
  assert.equal(view.series.at(-1).date, '2026-11-16')
  assert.equal(view.series.at(-1).expected, 565000)
  assert.equal(source.channels.reduce((sum, channel) => sum + channel.amount, 0), 0)
  assert.equal(view.overdueTotal, summarizeCollection(collectionRows(loans, '2026-11-16'), loans, '2026-11-16').overdueAmount)
})

test('checks a payment draft without posting it', () => {
  assert.equal(validatePaymentDraft({ amount: '', method: '', paidOn: '', remarks: '' }).ready, false)
  assert.equal(
    validatePaymentDraft({ amount: '1200', method: 'UPI', paidOn: '2026-11-16', remarks: '' }).ready,
    true,
  )
})
