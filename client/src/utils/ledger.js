import { collectionStatus } from './collections.js'
import { LOAN_BOOK_DATE, paymentAllocations } from './loans.js'
import { ledgerForCustomer } from './payments.js'

export const LEDGER_PAGE_SIZE = 8

export const LEDGER_ENTRY_TYPES = [
  'Disbursement',
  'Payment',
  'Partial payment',
  'Advance payment',
  'Reversal',
  'Adjustment',
]

/** Customer totals come from settled loans, not from amounts typed in the page. */
export function customerPosition(customer, loans) {
  const mine = loans.filter((loan) => loan.customerId === customer.id)
  const counted = mine.filter(countsTowardBalance)
  return {
    customer,
    loans: mine,
    principal: sum(counted, (loan) => loan.principal),
    agreed: sum(counted, (loan) => loan.totalRepayment),
    repaid: sum(counted, (loan) => loan.totalRepaid),
    outstanding: sum(counted, (loan) => loan.outstanding),
    activeLoans: mine.filter((loan) => loan.status === 'Active').length,
    completedLoans: mine.filter((loan) => loan.status === 'Completed').length,
  }
}

export function ledgerBook(customers, loans, { query = '', status = 'All', sort = 'outstanding' } = {}) {
  const text = query.trim().toLocaleLowerCase('en-IN')
  const digits = query.replace(/\D/g, '')
  const rows = customers
    .map((customer) => customerPosition(customer, loans))
    .filter((row) => {
      if (status !== 'All' && row.customer.status !== status) return false
      if (!text) return true
      const name = row.customer.fullName.toLocaleLowerCase('en-IN').includes(text)
      const phone = digits.length > 0 && `${row.customer.phone}${row.customer.alternatePhone || ''}`.includes(digits)
      return name || phone
    })

  return rows.sort((left, right) => {
    if (sort === 'name') return left.customer.fullName.localeCompare(right.customer.fullName, 'en-IN')
    if (left.outstanding !== right.outstanding) return right.outstanding - left.outstanding
    return left.customer.fullName.localeCompare(right.customer.fullName, 'en-IN')
  })
}

export function accountEntries(loans, customerId, loanId = '') {
  const source = loanId ? loans.filter((loan) => loan.id === loanId) : loans
  return ledgerForCustomer(source, customerId)
}

export function filterEntries(entries, { query = '', type = '', from = '', to = '' } = {}) {
  const text = query.trim().toLocaleLowerCase('en-IN')
  return entries.filter((entry) => {
    if (from && entry.date < from) return false
    if (to && entry.date > to) return false
    if (type === 'Payments' && !entry.kind.toLowerCase().endsWith('payment')) return false
    if (type && type !== 'Payments' && entry.kind !== type) return false
    if (!text) return true
    return [entry.description, entry.transactionId, entry.receiptNumber, entry.loanId, entry.kind]
      .join(' ')
      .toLocaleLowerCase('en-IN')
      .includes(text)
  })
}

export function pageOf(items, page = 1, size = LEDGER_PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(Math.max(Number(page) || 1, 1), pages)
  const start = (current - 1) * size
  return { page: current, pages, total: items.length, items: items.slice(start, start + size) }
}

export function buildStatement(entries, { from = '', to = '' } = {}) {
  const selected = entries.filter((entry) => (!from || entry.date >= from) && (!to || entry.date <= to))
  const prior = from ? entries.filter((entry) => entry.date < from) : []
  const opening = prior.length ? prior.at(-1).balance : 0
  const debit = sum(selected, (entry) => entry.debit)
  const credit = sum(selected, (entry) => entry.credit)
  const closing = selected.length ? selected.at(-1).balance : opening
  return { from, to, opening, debit, credit, closing, entries: selected }
}

export function scheduleRows(loan, asOf = LOAN_BOOK_DATE) {
  return loan.schedule.map((row) => ({
    ...row,
    paymentStatus: collectionStatus({ dueDate: row.dueDate, expected: row.expected, collected: row.paid }, asOf),
  }))
}

export function instalmentAllocations(loan, instalmentNumber) {
  return (loan.payments ?? []).flatMap((payment) => {
    if (payment.type === 'reversal') return []
    return paymentAllocations(payment)
      .filter((item) => item.instalmentNumber === Number(instalmentNumber))
      .map((item) => ({
        paymentId: payment.id,
        receiptNumber: payment.receiptNumber || payment.id,
        paidOn: payment.paidOn,
        method: payment.method || 'Cash',
        amount: item.amount,
        status: payment.status || 'Posted',
        counts: payment.status !== 'Reversed',
      }))
  })
}

export function statementCsv(statement) {
  const header = ['Date', 'Transaction ID', 'Receipt Number', 'Description', 'Debit', 'Credit', 'Running Balance', 'Payment Method', 'Collector']
  const lines = [
    header,
    ['Opening', '', '', '', '', '', rupees(statement.opening), '', ''],
    ...statement.entries.map((entry) => [
      entry.date,
      entry.transactionId || '',
      entry.receiptNumber || '',
      entry.description,
      rupees(entry.debit),
      rupees(entry.credit),
      rupees(entry.balance),
      entry.method || '',
      entry.collector || '',
    ]),
    ['Closing', '', '', '', rupees(statement.debit), rupees(statement.credit), rupees(statement.closing), '', ''],
  ]
  return lines.map((row) => row.map(csvCell).join(',')).join('\n')
}

function countsTowardBalance(loan) {
  if (loan.status === 'Pending') return false
  if (loan.status === 'Cancelled' && loan.totalRepaid === 0 && loan.outstanding === 0) return false
  return true
}

function sum(items, read) {
  return items.reduce((total, item) => total + read(item), 0)
}

function rupees(paise) {
  return (paise / 100).toFixed(2)
}

function csvCell(value) {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`
  return text
}
