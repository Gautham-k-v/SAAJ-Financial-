import assert from 'node:assert/strict'
import test from 'node:test'
import { agentSeed } from '../data/agentSeed.js'
import { customerSeed } from '../data/customerSeed.js'
import { loanSeed } from '../data/loanSeed.js'
import { presentLoan, buildSchedule, settleLoan } from './loans.js'
import { applyReversalStatus } from './payments.js'
import { buildStatementPdf } from './statementPdf.js'
import {
  accountEntries,
  buildStatement,
  customerPosition,
  filterEntries,
  instalmentAllocations,
  ledgerBook,
  pageOf,
  scheduleRows,
  statementCsv,
} from './ledger.js'

const loans = loanSeed.map((loan) =>
  presentLoan(
    loan,
    customerSeed.find((customer) => customer.id === loan.customerId),
    agentSeed.find((agent) => agent.id === loan.agentId),
  ),
)
const customer = (id) => customerSeed.find((item) => item.id === id)

test('reconciles one active loan with its payment allocations', () => {
  const kavitha = customer('CUS-1320')
  const position = customerPosition(kavitha, loans)
  const entries = accountEntries(loans, kavitha.id)

  assert.equal(position.activeLoans, 1)
  assert.equal(position.principal, 1000000)
  assert.equal(position.agreed, 1200000)
  assert.equal(position.repaid, 840000)
  assert.equal(position.outstanding, 360000)
  assert.equal(entries.at(-1).balance, position.outstanding)
  assert.equal(entries.filter((entry) => entry.credit > 0).reduce((sum, entry) => sum + entry.credit, 0), 840000)
})

test('keeps a second loan in its own balance and the customer total', () => {
  const first = loans.find((loan) => loan.id === 'LN-2410')
  const second = {
    ...first,
    id: 'LN-9001',
    principal: 200000,
    financeCharge: 40000,
    totalRepayment: 240000,
    outstanding: 240000,
    totalRepaid: 0,
    payments: [],
    startDate: '2026-11-20',
  }
  const position = customerPosition(customer('CUS-1320'), [first, second])
  const entries = accountEntries([first, second], 'CUS-1320')

  assert.equal(position.activeLoans, 2)
  assert.equal(position.outstanding, first.outstanding + second.outstanding)
  assert.equal(entries.at(-1).balance, position.outstanding)
  assert.equal(accountEntries([first, second], 'CUS-1320', 'LN-9001').at(-1).balance, 240000)
})

test('reports a completed loan, a partial payment, and overdue instalments', () => {
  const imran = customerPosition(customer('CUS-1608'), loans)
  assert.equal(imran.completedLoans, 1)
  assert.equal(imran.outstanding, 0)
  assert.equal(accountEntries(loans, 'CUS-1608').at(-1).balance, 0)

  const abdul = loans.find((loan) => loan.id === 'LN-2076')
  const partial = abdul.schedule.find((row) => row.status === 'Partial')
  assert.equal(partial.paid, 50000)
  assert.equal(partial.remaining, 50000)
  assert.equal(accountEntries(loans, abdul.customerId).at(-1).balance, abdul.outstanding)

  const joseph = loans.find((loan) => loan.id === 'LN-1690')
  const overdue = scheduleRows(joseph).filter((row) => row.paymentStatus === 'Overdue')
  assert.equal(overdue.length, 6)
  assert.ok(overdue.every((row) => row.remaining === 60000))
})

test('records an advance once and restores the balance after reversal', () => {
  const schedule = buildSchedule({ startDate: '2026-11-16', repaymentDays: 10, dailyInstalment: 100000 })
  const base = {
    id: 'LN-ADV',
    customerId: 'CUS-1502',
    status: 'Active',
    principal: 800000,
    financeCharge: 200000,
    totalRepayment: 1000000,
    dailyInstalment: 100000,
    startDate: '2026-11-16',
    endDate: '2026-11-25',
    agentId: 'AGT-01',
    payments: [
      {
        id: 'TXN-ADV',
        receiptNumber: 'RCP-ADV',
        amount: 150000,
        paidOn: '2026-11-16',
        method: 'UPI',
        allocation: 'Advance',
        collectorName: 'Karthik Rajan',
        allocations: [
          { instalmentNumber: 1, amount: 100000 },
          { instalmentNumber: 2, amount: 50000 },
        ],
      },
    ],
    schedule,
  }
  const advanced = presentLoan(settleLoan(base), customer('CUS-1502'), agentSeed[0])
  assert.equal(advanced.totalRepaid, 150000)
  assert.equal(advanced.outstanding, 850000)
  assert.equal(accountEntries([advanced], advanced.customerId).at(-1).balance, 850000)
  assert.equal(instalmentAllocations(advanced, 2).reduce((sum, item) => sum + item.amount, 0), 50000)

  const reversed = presentLoan(
    settleLoan({
      ...base,
      payments: applyReversalStatus([
        ...base.payments,
        { id: 'REV-ADV', type: 'reversal', reverses: 'TXN-ADV', amount: 150000, paidOn: '2026-11-16', reason: 'Wrong loan' },
      ]),
    }),
    customer('CUS-1502'),
    agentSeed[0],
  )
  assert.equal(reversed.outstanding, 1000000)
  const entries = accountEntries([reversed], reversed.customerId)
  assert.equal(entries.some((entry) => entry.kind === 'Reversal'), true)
  assert.equal(entries.at(-1).balance, 1000000)
})

test('filters a statement by date and exports pdf and csv that match the balance', () => {
  const entries = accountEntries(loans, 'CUS-1320')
  const statement = buildStatement(entries, { from: '2026-11-15', to: '2026-11-15' })
  assert.equal(statement.opening + statement.debit - statement.credit, statement.closing)
  assert.equal(statement.entries.length, 1)
  assert.equal(filterEntries(entries, { type: 'Disbursement' }).length, 1)
  assert.equal(pageOf(Array.from({ length: 9 }, (_, index) => index), 2).items.length, 1)

  const csv = statementCsv(statement)
  assert.match(csv, /Opening/)
  assert.match(csv, /Closing/)
  const pdf = new TextDecoder().decode(
    buildStatementPdf({
      customerName: 'Kavitha Natarajan',
      customerId: 'CUS-1320',
      loanLabel: 'All loans',
      period: '15 Nov 2026 – 15 Nov 2026',
      openingLabel: 'Rs. 4800.00',
      debitLabel: 'Rs. 0.00',
      creditLabel: 'Rs. 1200.00',
      closingLabel: 'Rs. 3600.00',
      rows: [{ date: '2026-11-15', kind: 'Payment', detail: 'RCP' }],
    }),
  )
  assert.match(pdf, /^%PDF-1\.4/)
  const book = ledgerBook(customerSeed, loans, { query: '98410 13200', sort: 'outstanding' })
  assert.equal(book[0].customer.id, 'CUS-1320')
})
