import { collectionRows, PAYMENT_METHODS, paymentsOnDate, summarizeCollection } from './collections.js'
import {
  addIsoDays,
  displayLoanStatus,
  LOAN_BOOK_DATE,
  outstandingPaise,
  settleLoan,
  totalRepaidPaise,
} from './loans.js'

export const REPORT_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7', label: 'Last 7 days' },
  { id: '30', label: 'Last 30 days' },
  { id: 'month', label: 'This month' },
  { id: 'previous', label: 'Previous month' },
  { id: 'custom', label: 'Custom' },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function rangeForPreset(preset, today = LOAN_BOOK_DATE, custom = {}) {
  if (preset === 'yesterday') {
    const day = addIsoDays(today, -1)
    return { from: day, to: day }
  }
  if (preset === '7') return { from: addIsoDays(today, -6), to: today }
  if (preset === '30') return { from: addIsoDays(today, -29), to: today }
  if (preset === 'month') return { from: monthStart(today), to: today }
  if (preset === 'previous') {
    const end = addIsoDays(monthStart(today), -1)
    return { from: monthStart(end), to: end }
  }
  if (preset === 'custom') {
    const from = custom.from || today
    const to = custom.to || today
    return from <= to ? { from, to } : { from: to, to: from }
  }
  return { from: today, to: today }
}

export function bookPosition(loans, asOf = LOAN_BOOK_DATE) {
  const positions = loans.map((loan) => positionAsOf(loan, asOf)).filter(Boolean)
  return {
    asOf,
    principal: sum(positions, (loan) => loan.principal),
    finance: sum(positions, (loan) => loan.financeCharge),
    agreed: sum(positions, (loan) => loan.totalRepayment),
    outstanding: sum(positions, (loan) => loan.outstanding),
    active: positions.filter((loan) => loan.status === 'Active').length,
    completed: positions.filter((loan) => loan.status === 'Completed').length,
    overdue: positions.filter((loan) => loan.displayStatus === 'Overdue').length,
    loans: positions,
  }
}

export function periodCollections(loans, from, to) {
  const payments = collectedPayments(loans, from, to)
  const expected = expectedInRange(loans, from, to)
  const collected = sum(payments, (payment) => payment.amount)
  return {
    from,
    to,
    expected,
    collected,
    pending: Math.max(expected - collected, 0),
    percentage: expected === 0 ? 0 : collected / expected,
    payments,
    customersCollected: new Set(payments.map((payment) => payment.customerId)).size,
  }
}

export function dailyReport(loans, date = LOAN_BOOK_DATE) {
  const rows = collectionRows(loans, date)
  const summary = summarizeCollection(rows, loans, date)
  const due = rows.filter((row) => row.dueDate === date)
  return {
    ...summary,
    customersCollected: new Set(paymentsOnDate(loans, date).map((payment) => payment.customerId)).size,
    customersPending: new Set(due.filter((row) => row.status !== 'Paid').map((row) => row.customerId)).size,
  }
}

export function dailySeries(loans, endDate = LOAN_BOOK_DATE, days = 14) {
  return Array.from({ length: days }, (_, index) => {
    const date = addIsoDays(endDate, index - (days - 1))
    const report = dailyReport(loans, date)
    return { date, expected: report.expected, collected: report.collected }
  })
}

export function monthlySeries(loans, year, today = LOAN_BOOK_DATE) {
  const points = []
  for (let month = 1; month <= 12; month += 1) {
    const from = `${year}-${pad(month)}-01`
    if (from > today) break
    const end = monthEnd(year, month)
    const to = end > today ? today : end
    const collected = periodCollections(loans, from, to)
    const disbursed = loans
      .filter((loan) => loan.startDate >= from && loan.startDate <= to && positionAsOf(loan, to))
      .reduce((total, loan) => total + loan.principal, 0)
    points.push({
      key: from.slice(0, 7),
      label: `${MONTHS[month - 1]} ${year}`,
      collected: collected.collected,
      expected: collected.expected,
      disbursed,
      outstanding: bookPosition(loans, to).outstanding,
      percentage: collected.percentage,
    })
  }
  return points
}

export function agentPerformance(loans, agents, from, to) {
  return agents.map((agent) => {
    const mine = loans.filter((loan) => loan.agentId === agent.id)
    const active = mine.filter((loan) => loan.status === 'Active')
    const period = periodCollections(mine, from, to)
    return {
      id: agent.id,
      name: agent.name,
      customers: new Set(active.map((loan) => loan.customerId)).size,
      target: period.expected,
      collected: period.collected,
      pending: period.pending,
      successful: period.payments.length,
      percentage: period.percentage,
    }
  })
}

export function paymentBreakdown(loans, from, to) {
  const payments = collectedPayments(loans, from, to)
  return PAYMENT_METHODS.map((method) => {
    const rows = payments.filter((payment) => payment.method === method)
    return {
      method,
      amount: sum(rows, (payment) => payment.amount),
      count: rows.length,
    }
  })
}

export function reportCsv(rows) {
  return rows.map((row) => row.map(csvCell).join(',')).join('\n')
}

function positionAsOf(loan, asOf) {
  if (!loan || loan.status === 'Pending' || loan.startDate > asOf) return null
  const settled = settleLoan({ ...loan, payments: paymentsThrough(loan, asOf) })
  const outstanding = outstandingPaise(settled)
  const totalRepaid = totalRepaidPaise(settled)
  if (loan.status === 'Cancelled' && totalRepaid === 0 && outstanding === 0) return null
  return {
    ...settled,
    status: loan.status,
    totalRepaid,
    outstanding,
    displayStatus: loan.status === 'Active' ? displayLoanStatus(settled, asOf) : loan.status,
  }
}

function paymentsThrough(loan, asOf) {
  const reversed = new Set(
    (loan.payments ?? [])
      .filter((payment) => payment.type === 'reversal' && (payment.paidOn || '') <= asOf)
      .map((payment) => payment.reverses),
  )
  return (loan.payments ?? []).filter(
    (payment) =>
      payment.type !== 'reversal' &&
      (payment.paidOn || '') <= asOf &&
      !reversed.has(payment.id) &&
      Number.isInteger(payment.amount) &&
      payment.amount > 0,
  )
}

function collectedPayments(loans, from, to) {
  return loans.flatMap((loan) =>
    paymentsThrough(loan, to)
      .filter((payment) => (payment.paidOn || '') >= from)
      .map((payment) => ({
        ...payment,
        loanId: loan.id,
        customerId: loan.customerId,
        agentId: loan.agentId,
        method: PAYMENT_METHODS.includes(payment.method) ? payment.method : 'Cash',
      })),
  )
}

function expectedInRange(loans, from, to) {
  return loans
    .filter((loan) => loan.status === 'Active' || loan.status === 'Completed')
    .flatMap((loan) => loan.schedule ?? [])
    .filter((row) => row.dueDate >= from && row.dueDate <= to)
    .reduce((total, row) => total + row.expected, 0)
}

function monthStart(isoDate) {
  return `${isoDate.slice(0, 7)}-01`
}

function monthEnd(year, month) {
  const next = month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`
  return addIsoDays(next, -1)
}

function pad(month) {
  return String(month).padStart(2, '0')
}

function sum(items, read) {
  return items.reduce((total, item) => total + read(item), 0)
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}
