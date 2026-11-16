import assert from 'node:assert/strict'
import test from 'node:test'
import { agentSeed } from '../data/agentSeed.js'
import { customerSeed } from '../data/customerSeed.js'
import { loanSeed } from '../data/loanSeed.js'
import { collectionRows, summarizeCollection } from './collections.js'
import { LOAN_BOOK_DATE, presentLoan } from './loans.js'
import { buildReportPdf } from './reportPdf.js'
import {
  agentPerformance,
  bookPosition,
  dailyReport,
  monthlySeries,
  paymentBreakdown,
  periodCollections,
  rangeForPreset,
  reportCsv,
} from './reports.js'

const loans = loanSeed.map((loan) =>
  presentLoan(
    loan,
    customerSeed.find((customer) => customer.id === loan.customerId),
    agentSeed.find((agent) => agent.id === loan.agentId),
  ),
)

test('daily report matches the collection summary and a date preset', () => {
  const summary = summarizeCollection(collectionRows(loans, LOAN_BOOK_DATE), loans, LOAN_BOOK_DATE)
  const daily = dailyReport(loans, LOAN_BOOK_DATE)
  assert.equal(daily.expected, summary.expected)
  assert.equal(daily.collected, summary.collected)
  assert.equal(daily.pending, summary.pending)
  assert.equal(daily.percentage, summary.percentage)
  assert.equal(rangeForPreset('today').from, LOAN_BOOK_DATE)
  assert.equal(rangeForPreset('7').from, '2026-11-10')
  const previous = rangeForPreset('previous')
  assert.equal(previous.from, '2026-10-01')
  assert.equal(previous.to, '2026-10-31')
})

test('book outstanding matches funded loans and reversed receipts are not collected', () => {
  const position = bookPosition(loans, LOAN_BOOK_DATE)
  const funded = loans.filter((loan) => loan.status !== 'Pending' && !(loan.status === 'Cancelled' && loan.totalRepaid === 0 && loan.outstanding === 0))
  assert.equal(position.outstanding, funded.reduce((sum, loan) => sum + loan.outstanding, 0))
  assert.equal(position.principal, funded.reduce((sum, loan) => sum + loan.principal, 0))

  const source = loans.find((loan) => loan.id === 'LN-2410')
  const reversed = {
    ...source,
    payments: [
      ...source.payments,
      { id: 'TXN-9', type: 'payment', amount: 50000, paidOn: '2026-11-16', method: 'Cash', status: 'Reversed', allocations: [{ instalmentNumber: 8, amount: 50000 }] },
      { id: 'REV-9', type: 'reversal', reverses: 'TXN-9', amount: 50000, paidOn: '2026-11-16', method: 'Cash' },
    ],
  }
  const mixed = loans.map((loan) => (loan.id === reversed.id ? reversed : loan))
  const withReversal = periodCollections(mixed, '2026-11-16', '2026-11-16')
  const without = periodCollections(loans, '2026-11-16', '2026-11-16')
  assert.equal(withReversal.collected, without.collected)
})

test('monthly, agent, and payment totals reconcile with the period receipts', () => {
  const period = periodCollections(loans, '2026-11-01', '2026-11-16')
  const agents = agentPerformance(loans, agentSeed, '2026-11-01', '2026-11-16')
  const methods = paymentBreakdown(loans, '2026-11-01', '2026-11-16')
  assert.equal(agents.reduce((sum, agent) => sum + agent.collected, 0), period.collected)
  assert.equal(methods.reduce((sum, method) => sum + method.amount, 0), period.collected)
  assert.equal(methods.reduce((sum, method) => sum + method.count, 0), period.payments.length)

  const november = monthlySeries(loans, 2026).find((point) => point.key === '2026-11')
  assert.equal(november.collected, period.collected)
  assert.ok(november.disbursed > 0)
  assert.equal(november.outstanding, bookPosition(loans, '2026-11-16').outstanding)

  const csv = reportCsv([
    ['Period', '2026-11-01 to 2026-11-16'],
    ['Collected', (period.collected / 100).toFixed(2)],
  ])
  assert.match(csv, /Collected/)
  assert.equal(Buffer.from(buildReportPdf({ title: 'Overview', period: '16 Nov 2026', rows: [{ label: 'Collected', value: 'Rs. 0' }] })).subarray(0, 8).toString(), '%PDF-1.4')
})
