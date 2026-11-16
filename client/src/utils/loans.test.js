import assert from 'node:assert/strict'
import test from 'node:test'
import { assembleLoan, buildSchedule, createLoanId, displayLoanStatus, filterLoans, hasLoanErrors, outstandingPaise, overduePaise, validateLoanInput, withPayment } from './loans.js'

const activeCustomer = { id: 'CUS-1502', status: 'Active', fullName: 'Geetha Raman' }
const inactiveCustomer = { id: 'CUS-0762', status: 'Inactive', fullName: 'Joseph Raj' }
const agents = [{ id: 'AGT-01' }]

const validInput = {
  customerId: 'CUS-1502',
  principal: '10,000',
  financeCharge: '2,000',
  totalRepayment: '12000',
  dailyInstalment: '1200',
  repaymentDays: '10',
  startDate: '2026-11-16',
  agentId: 'AGT-01',
  remarks: '',
}

test('builds one instalment per day without changing the daily amount', () => {
  const schedule = buildSchedule({
    startDate: '2026-11-16',
    repaymentDays: 10,
    dailyInstalment: 120000,
  })

  assert.equal(schedule.length, 10)
  assert.equal(schedule[0].dueDate, '2026-11-16')
  assert.equal(schedule[9].dueDate, '2026-11-25')
  assert.equal(schedule.every((row) => row.expected === 120000 && row.paid === 0 && row.status === 'Unpaid'), true)
  assert.equal(
    schedule.reduce((sum, row) => sum + row.expected, 0),
    1200000,
  )
})

test('keeps a partial payment on its own instalment', () => {
  const row = withPayment({ number: 2, expected: 100000, paid: 0, remaining: 100000, status: 'Unpaid' }, 50000)
  assert.equal(row.status, 'Partial')
  assert.equal(row.remaining, 50000)
  assert.equal(withPayment(row, 120000).status, 'Advance')
})

test('rejects a total that does not match principal plus finance charge', () => {
  const { errors } = validateLoanInput(
    { ...validInput, totalRepayment: '10000' },
    { customers: [activeCustomer], agents },
  )
  assert.equal(errors.totalRepayment, 'Total repayment must equal principal plus finance charge.')
})

test('rejects a daily instalment that does not divide the contract evenly', () => {
  const { errors } = validateLoanInput(
    { ...validInput, dailyInstalment: '1000' },
    { customers: [activeCustomer], agents },
  )
  assert.equal(errors.dailyInstalment, 'Daily instalment × repayment days must equal the total repayment.')
})

test('rejects an inactive customer and an empty loan', () => {
  const inactive = validateLoanInput(
    { ...validInput, customerId: 'CUS-0762' },
    { customers: [inactiveCustomer], agents },
  )
  assert.equal(inactive.errors.customerId, 'Select an active customer.')

  const empty = validateLoanInput(
    {
      customerId: '',
      principal: '',
      financeCharge: '',
      totalRepayment: '',
      dailyInstalment: '',
      repaymentDays: '',
      startDate: '',
      agentId: '',
      remarks: '',
    },
    { customers: [activeCustomer], agents },
  )
  assert.equal(hasLoanErrors(empty.errors), true)
  assert.equal(empty.terms, null)
})

test('marks a missed active instalment as overdue without rewriting the stored status', () => {
  const loan = assembleLoan({
    id: 'LN-1690',
    customerId: 'CUS-0762',
    principal: 500000,
    financeCharge: 100000,
    totalRepayment: 600000,
    dailyInstalment: 60000,
    repaymentDays: 10,
    startDate: '2026-11-06',
    agentId: 'AGT-01',
    status: 'Active',
    createdAt: '2026-11-06',
    paid: { 1: 60000, 2: 60000, 3: 60000, 4: 60000 },
    audit: [],
  })

  assert.equal(loan.status, 'Active')
  assert.equal(displayLoanStatus(loan), 'Overdue')
  assert.equal(overduePaise(loan), 360000)
  assert.equal(outstandingPaise(loan), 360000)
  assert.equal(loan.payments.length, 4)
  assert.equal(loan.payments[0].amount, 60000)
  assert.equal(loan.endDate, '2026-11-15')
})

test('creates the next loan id and filters by displayed status', () => {
  assert.equal(createLoanId(['LN-1690', 'LN-2501']), 'LN-2502')

  const loans = [
    { id: 'LN-1690', customerName: 'Joseph Raj', displayStatus: 'Overdue' },
    { id: 'LN-2501', customerName: 'Geetha Raman', displayStatus: 'Pending' },
  ]
  assert.deepEqual(filterLoans(loans, { query: 'joseph' }).map((loan) => loan.id), ['LN-1690'])
  assert.deepEqual(filterLoans(loans, { status: 'Pending' }).map((loan) => loan.id), ['LN-2501'])
})
