import { parseRupeesToPaise } from './currency.js'

/** Sample book date shared with the dashboard so overdue examples stay stable. */
export const LOAN_BOOK_DATE = '2026-11-16'

export const LOAN_STATUSES = ['Pending', 'Active', 'Completed', 'Overdue', 'Cancelled']

export const INSTALMENT_STATUSES = ['Unpaid', 'Partial', 'Paid', 'Advance']

const MAX_PAISE = 500_000_000
const MAX_DAYS = 365
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export class LoanValidationError extends Error {
  constructor(fields) {
    super('Check the loan details.')
    this.name = 'LoanValidationError'
    this.fields = fields
  }
}

export class LoanStateError extends Error {
  constructor(message) {
    super(message)
    this.name = 'LoanStateError'
  }
}

export function addIsoDays(isoDate, days) {
  const match = DATE_PATTERN.exec(isoDate)
  if (!match) throw new Error('Invalid date.')
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date.')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function endDateFor(startDate, repaymentDays) {
  return addIsoDays(startDate, repaymentDays - 1)
}

export function instalmentPaymentStatus(paid, expected) {
  if (paid > expected) return 'Advance'
  if (paid === expected) return 'Paid'
  if (paid > 0) return 'Partial'
  return 'Unpaid'
}

export function buildSchedule({ startDate, repaymentDays, dailyInstalment }) {
  if (!Number.isInteger(repaymentDays) || repaymentDays < 1) {
    throw new Error('Repayment days must be a positive integer.')
  }
  if (!Number.isInteger(dailyInstalment) || dailyInstalment < 1) {
    throw new Error('Daily instalment must be a positive integer number of paise.')
  }

  return Array.from({ length: repaymentDays }, (_, index) => ({
    number: index + 1,
    dueDate: addIsoDays(startDate, index),
    expected: dailyInstalment,
    paid: 0,
    remaining: dailyInstalment,
    status: 'Unpaid',
  }))
}

export function withPayment(instalment, paid) {
  if (!Number.isInteger(paid) || paid < 0) {
    throw new Error('Paid amount must be a non-negative integer number of paise.')
  }

  return {
    ...instalment,
    paid,
    remaining: Math.max(0, instalment.expected - paid),
    status: instalmentPaymentStatus(paid, instalment.expected),
  }
}

const SAMPLE_METHODS = ['Cash', 'UPI', 'Bank transfer']

export function paymentAllocations(payment) {
  const source = Array.isArray(payment?.allocations)
    ? payment.allocations
    : Number.isInteger(payment?.instalmentNumber)
      ? [{ instalmentNumber: payment.instalmentNumber, amount: payment.amount }]
      : []

  return source.filter(
    (item) =>
      Number.isInteger(item?.instalmentNumber) &&
      Number.isInteger(item?.amount) &&
      item.amount > 0,
  )
}

export function allocatedPaise(payments, instalmentNumber) {
  return (payments ?? []).reduce((sum, payment) => {
    if (payment?.type === 'reversal' || payment?.status === 'Reversed') return sum
    return (
      sum +
      paymentAllocations(payment)
        .filter((item) => item.instalmentNumber === instalmentNumber)
        .reduce((inner, item) => inner + item.amount, 0)
    )
  }, 0)
}

/** Recompute instalment totals from allocations. A payment with no allocation does not count. */
export function settleLoan(loan) {
  const schedule = (loan.schedule ?? []).map((row) => withPayment({ ...row }, allocatedPaise(loan.payments, row.number)))
  return { ...loan, schedule }
}

export function samplePaymentsFor(loanId, schedule) {
  return schedule
    .filter((row) => row.paid > 0)
    .map((row) => ({
      id: `PMT-${loanId}-${String(row.number).padStart(2, '0')}`,
      instalmentNumber: row.number,
      amount: row.paid,
      paidOn: row.dueDate,
      method: SAMPLE_METHODS[(row.number - 1) % SAMPLE_METHODS.length],
      allocation: row.paid > row.expected ? 'Advance' : row.paid < row.expected ? 'Partial' : 'Full',
      allocations: [{ instalmentNumber: row.number, amount: row.paid }],
    }))
}

export function assembleLoan(spec) {
  const schedule = buildSchedule(spec).map((row) => withPayment(row, spec.paid?.[row.number] ?? 0))
  return {
    id: spec.id,
    customerId: spec.customerId,
    principal: spec.principal,
    financeCharge: spec.financeCharge,
    totalRepayment: spec.totalRepayment,
    dailyInstalment: spec.dailyInstalment,
    repaymentDays: spec.repaymentDays,
    startDate: spec.startDate,
    endDate: endDateFor(spec.startDate, spec.repaymentDays),
    agentId: spec.agentId,
    status: spec.status,
    remarks: spec.remarks ?? '',
    createdAt: spec.createdAt,
    schedule,
    payments: samplePaymentsFor(spec.id, schedule),
    audit: spec.audit,
  }
}

export function displayLoanStatus(loan, today = LOAN_BOOK_DATE) {
  if (loan.status !== 'Active') return loan.status
  const missed = loan.schedule.some((row) => row.dueDate < today && row.paid < row.expected)
  return missed ? 'Overdue' : 'Active'
}

export function totalRepaidPaise(loan) {
  return loan.schedule.reduce((sum, row) => sum + row.paid, 0)
}

export function outstandingPaise(loan) {
  if (loan.status === 'Cancelled' && loan.schedule.every((row) => row.paid === 0)) return 0
  return loan.schedule.reduce((sum, row) => sum + row.remaining, 0)
}

export function overduePaise(loan, today = LOAN_BOOK_DATE) {
  if (loan.status !== 'Active') return 0
  return loan.schedule.reduce(
    (sum, row) => (row.dueDate < today ? sum + row.remaining : sum),
    0,
  )
}

export function presentLoan(loan, customer, agent, today = LOAN_BOOK_DATE) {
  const settled = settleLoan(loan)
  return {
    ...settled,
    customerName: customer?.fullName ?? 'Unknown customer',
    customerPhone: customer?.phone ?? '',
    customerPlace: customer?.place ?? '',
    customerStatus: customer?.status ?? '',
    agentName: agent?.name ?? 'Unassigned',
    displayStatus: displayLoanStatus(settled, today),
    totalRepaid: totalRepaidPaise(settled),
    outstanding: outstandingPaise(settled),
    overdueAmount: overduePaise(settled, today),
  }
}

export function createLoanId(existingIds) {
  let highest = 1000
  for (const id of existingIds) {
    const match = /^LN-(\d+)$/.exec(id)
    if (!match) continue
    highest = Math.max(highest, Number(match[1]))
  }
  return `LN-${String(highest + 1).padStart(4, '0')}`
}

export function emptyLoanForm() {
  return {
    customerId: '',
    principal: '',
    financeCharge: '',
    totalRepayment: '',
    dailyInstalment: '',
    repaymentDays: '',
    startDate: LOAN_BOOK_DATE,
    agentId: '',
    remarks: '',
  }
}

export function toLoanForm(loan) {
  return {
    customerId: loan.customerId,
    principal: formatStoredRupees(loan.principal),
    financeCharge: formatStoredRupees(loan.financeCharge),
    totalRepayment: formatStoredRupees(loan.totalRepayment),
    dailyInstalment: formatStoredRupees(loan.dailyInstalment),
    repaymentDays: String(loan.repaymentDays),
    startDate: loan.startDate,
    agentId: loan.agentId,
    remarks: loan.remarks,
  }
}

export function validateLoanInput(input, { customers = [], agents = [] } = {}) {
  const errors = {}
  const customer = customers.find((record) => record.id === input.customerId)

  if (!input.customerId) errors.customerId = 'Select a customer.'
  else if (!customer || customer.status !== 'Active') errors.customerId = 'Select an active customer.'

  const principal = readMoney(input.principal, 'principal')
  const financeCharge = readMoney(input.financeCharge, 'finance charge')
  const totalRepayment = readMoney(input.totalRepayment, 'total repayment')
  const dailyInstalment = readMoney(input.dailyInstalment, 'daily instalment')

  if (principal.error) errors.principal = principal.error
  else if (principal.paise <= 0) errors.principal = 'Enter a principal greater than zero.'
  else if (principal.paise > MAX_PAISE) errors.principal = 'Enter a principal of ₹50,00,000 or less.'

  if (financeCharge.error) errors.financeCharge = financeCharge.error
  else if (financeCharge.paise > MAX_PAISE) errors.financeCharge = 'Enter a finance charge of ₹50,00,000 or less.'

  if (totalRepayment.error) errors.totalRepayment = totalRepayment.error
  else if (
    !errors.principal &&
    !errors.financeCharge &&
    totalRepayment.paise !== principal.paise + financeCharge.paise
  ) {
    errors.totalRepayment = 'Total repayment must equal principal plus finance charge.'
  }

  if (dailyInstalment.error) errors.dailyInstalment = dailyInstalment.error
  else if (dailyInstalment.paise <= 0) errors.dailyInstalment = 'Enter a daily instalment greater than zero.'

  const days = parseDays(input.repaymentDays)
  if (days.error) errors.repaymentDays = days.error

  if (
    !errors.dailyInstalment &&
    !errors.repaymentDays &&
    !errors.totalRepayment &&
    !errors.principal &&
    !errors.financeCharge &&
    dailyInstalment.paise * days.days !== totalRepayment.paise
  ) {
    errors.dailyInstalment = 'Daily instalment × repayment days must equal the total repayment.'
  }

  if (!input.startDate) errors.startDate = 'Choose a start date.'
  else if (!isAllowedDate(input.startDate)) errors.startDate = 'Choose a start date between 2020 and 2028.'

  if (!agents.some((agent) => agent.id === input.agentId)) errors.agentId = 'Choose a collection agent.'

  const remarks = String(input.remarks ?? '').trim()
  if (remarks.length > 240) errors.remarks = 'Keep remarks within 240 characters.'

  const terms =
    hasLoanErrors(errors)
      ? null
      : {
          customerId: input.customerId,
          principal: principal.paise,
          financeCharge: financeCharge.paise,
          totalRepayment: totalRepayment.paise,
          dailyInstalment: dailyInstalment.paise,
          repaymentDays: days.days,
          startDate: input.startDate,
          endDate: endDateFor(input.startDate, days.days),
          agentId: input.agentId,
          remarks,
        }

  return { errors, terms }
}

export function hasLoanErrors(errors) {
  return Object.values(errors).some(Boolean)
}

export function loanPreview(input) {
  const customerId = input.customerId || 'preview'
  const agentId = input.agentId || 'preview'
  const { terms } = validateLoanInput(
    { ...input, customerId, agentId },
    {
      customers: [{ id: customerId, status: 'Active' }],
      agents: [{ id: agentId }],
    },
  )
  if (!terms) return null
  return { ...terms, schedule: buildSchedule(terms) }
}

export function filterLoans(loans, { query = '', status = 'All' } = {}) {
  const text = query.trim().toLocaleLowerCase('en-IN')
  return loans.filter((loan) => {
    if (status !== 'All' && loan.displayStatus !== status) return false
    if (!text) return true
    return (
      loan.id.toLocaleLowerCase('en-IN').includes(text) ||
      loan.customerName.toLocaleLowerCase('en-IN').includes(text)
    )
  })
}

function readMoney(value, label) {
  const parsed = parseRupeesToPaise(value)
  if (parsed.error) {
    return { error: parsed.error === 'Enter an amount.' ? `Enter the ${label}.` : parsed.error }
  }
  return parsed
}

function parseDays(value) {
  const trimmed = String(value ?? '').trim()
  if (!/^\d+$/.test(trimmed)) return { error: 'Enter the number of repayment days.' }
  const days = Number(trimmed)
  if (days < 1) return { error: 'Enter at least 1 repayment day.' }
  if (days > MAX_DAYS) return { error: 'Enter 365 repayment days or fewer.' }
  return { days }
}

function isAllowedDate(value) {
  if (!DATE_PATTERN.test(value)) return false
  return value >= '2020-01-01' && value <= '2028-12-31'
}

function formatStoredRupees(paise) {
  const whole = Math.trunc(paise / 100)
  const fraction = paise % 100
  if (fraction === 0) return String(whole)
  return `${whole}.${String(fraction).padStart(2, '0')}`
}
