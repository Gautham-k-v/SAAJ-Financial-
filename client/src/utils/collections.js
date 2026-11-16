import { addIsoDays, LOAN_BOOK_DATE, paymentAllocations } from './loans.js'

export const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank transfer']

export const COLLECTION_STATUSES = ['Paid', 'Partial', 'Unpaid', 'Overdue']

export function collectionStatus({ dueDate, expected, collected }, asOf) {
  const covered = collected >= expected && expected > 0
  if (dueDate < asOf && !covered) return 'Overdue'
  if (covered) return 'Paid'
  if (collected > 0) return 'Partial'
  return 'Unpaid'
}

export function collectionRows(loans, asOf = LOAN_BOOK_DATE) {
  const rows = []

  for (const loan of loans) {
    if (loan.status !== 'Active' && loan.status !== 'Completed') continue

    for (const instalment of loan.schedule) {
      if (instalment.dueDate > asOf) continue
      const status = collectionStatus(
        { dueDate: instalment.dueDate, expected: instalment.expected, collected: instalment.paid },
        asOf,
      )
      if (instalment.dueDate < asOf && status !== 'Overdue') continue

      rows.push({
        id: `${loan.id}-${instalment.number}`,
        loanId: loan.id,
        instalmentNumber: instalment.number,
        customerId: loan.customerId,
        customerName: loan.customerName,
        phone: loan.customerPhone,
        place: loan.customerPlace,
        dueDate: instalment.dueDate,
        expected: instalment.expected,
        collected: instalment.paid,
        remaining: instalment.remaining,
        status,
        agentId: loan.agentId,
        agentName: loan.agentName,
      })
    }
  }

  return rows.sort(compareRows)
}

export function filterCollections(rows, { query = '', status = 'All', agentId = '' } = {}) {
  const text = query.trim().toLocaleLowerCase('en-IN')
  const digits = query.replace(/\D/g, '')

  return rows.filter((row) => {
    if (agentId && row.agentId !== agentId) return false
    if (status !== 'All' && row.status !== status) return false
    if (!text) return true
    const nameMatches = row.customerName.toLocaleLowerCase('en-IN').includes(text)
    const phoneMatches = digits.length > 0 && row.phone.replace(/\D/g, '').includes(digits)
    return nameMatches || phoneMatches
  })
}

export function paymentsOnDate(loans, asOf) {
  return loans.flatMap((loan) =>
    (loan.payments ?? [])
      .filter(
      (payment) =>
        payment.paidOn === asOf &&
        payment.type !== 'reversal' &&
        payment.status !== 'Reversed' &&
        Number.isInteger(payment.amount) &&
        payment.amount > 0,
    )
      .map((payment) => ({
        ...payment,
        loanId: loan.id,
        customerId: loan.customerId,
        customerName: loan.customerName,
        agentName: loan.agentName,
        method: PAYMENT_METHODS.includes(payment.method) ? payment.method : 'Cash',
      })),
  )
}

export function summarizeCollection(rows, loans, asOf = LOAN_BOOK_DATE) {
  const due = rows.filter((row) => row.dueDate === asOf)
  const expected = sum(due, (row) => row.expected)
  const collected = sum(paymentsOnDate(loans, asOf), (payment) => payment.amount)
  const overdueAmount = sum(
    rows.filter((row) => row.status === 'Overdue'),
    (row) => row.remaining,
  )

  return {
    asOf,
    expected,
    collected,
    pending: Math.max(expected - collected, 0),
    advance: Math.max(collected - expected, 0),
    overdueAmount,
    percentage: expected === 0 ? 0 : collected / expected,
    instalmentsDue: due.length,
  }
}

export function buildDashboardSource(loans, asOf = LOAN_BOOK_DATE) {
  const rows = collectionRows(loans, asOf)
  const summary = summarizeCollection(rows, loans, asOf)
  const openLoans = loans.filter((loan) => loan.status === 'Active')
  const dayPayments = paymentsOnDate(loans, asOf)
  const series = Array.from({ length: 14 }, (_, index) => {
    const date = addIsoDays(asOf, index - 13)
    const dayRows = collectionRows(loans, date).filter((row) => row.dueDate === date)
    return {
      date,
      expected: sum(dayRows, (row) => row.expected),
      collected: sum(paymentsOnDate(loans, date), (payment) => payment.amount),
    }
  })

  return {
    asOf,
    book: {
      expectedToday: summary.expected,
      collectedToday: summary.collected,
      outstanding: sum(openLoans, (loan) => loan.outstanding),
      activeCustomers: new Set(openLoans.map((loan) => loan.customerId)).size,
      activeLoans: openLoans.length,
      instalmentsDue: summary.instalmentsDue,
      receiptsPosted: dayPayments.length,
    },
    channels: PAYMENT_METHODS.map((method) => ({
      method,
      amount: sum(
        dayPayments.filter((payment) => payment.method === method),
        (payment) => payment.amount,
      ),
    })),
    series,
    transactions: dayPayments.slice(0, 8).map((payment, index) => ({
      id: payment.id,
      receiptNumber: payment.receiptNumber || payment.id,
      customerId: payment.customerId,
      customerName: payment.customerName,
      loanId: payment.loanId,
      amount: payment.amount,
      method: payment.method,
      collectorName: payment.collectorName || payment.agentName,
      recordedAt: payment.recordedAt || `${payment.paidOn}T09:${String(index).padStart(2, '0')}:00+05:30`,
      allocation: payment.allocation || allocationLabel(payment),
    })),
    overdue: overdueAlerts(rows, asOf),
  }
}

export function validatePaymentDraft(input) {
  const errors = {}
  const amount = String(input.amount ?? '').trim()
  if (!amount) errors.amount = 'Enter the amount received.'
  else if (!/^\d+(\.\d{1,2})?$/.test(amount.replace(/[₹,\s]/g, ''))) {
    errors.amount = 'Enter the amount in rupees, with up to 2 decimal places.'
  } else {
    const cleaned = amount.replace(/[₹,\s]/g, '')
    const [whole, fraction = ''] = cleaned.split('.')
    const paise = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
    if (!Number.isSafeInteger(paise) || paise <= 0) errors.amount = 'Enter an amount greater than zero.'
    else if (paise > 500_000_000) errors.amount = 'Enter ₹50,00,000 or less.'
    else errors.paise = undefined
  }

  if (!PAYMENT_METHODS.includes(input.method)) errors.method = 'Choose a payment method.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.paidOn || '')) errors.paidOn = 'Choose the payment date.'
  if (String(input.remarks ?? '').trim().length > 240) errors.remarks = 'Keep remarks within 240 characters.'

  const fields = Object.fromEntries(Object.entries(errors).filter(([, value]) => value))
  return { errors: fields, ready: Object.keys(fields).length === 0 }
}

function allocationLabel(payment) {
  const allocated = paymentAllocations(payment).reduce((sum, item) => sum + item.amount, 0)
  if (allocated === 0) return 'Unallocated'
  if (allocated < payment.amount) return 'Partial'
  return 'Full'
}

function overdueAlerts(rows, asOf) {
  const grouped = new Map()

  for (const row of rows) {
    if (row.status !== 'Overdue') continue
    const current = grouped.get(row.loanId)
    if (!current) {
      grouped.set(row.loanId, { ...row, amount: row.remaining, oldest: row.dueDate })
      continue
    }
    current.amount += row.remaining
    if (row.dueDate < current.oldest) current.oldest = row.dueDate
  }

  return [...grouped.values()]
    .map((item) => {
      const daysOverdue = daysBetween(item.oldest, asOf)
      return {
        loanId: item.loanId,
        customerId: item.customerId,
        customerName: item.customerName,
        locality: item.place,
        daysOverdue,
        amount: item.amount,
        collectorName: item.agentName,
        severity: daysOverdue >= 5 ? 'high' : daysOverdue >= 2 ? 'medium' : 'low',
      }
    })
    .sort((left, right) => right.daysOverdue - left.daysOverdue || right.amount - left.amount)
}

function compareRows(left, right) {
  const rank = { Overdue: 0, Unpaid: 1, Partial: 2, Paid: 3 }
  if (rank[left.status] !== rank[right.status]) return rank[left.status] - rank[right.status]
  if (left.dueDate !== right.dueDate) return left.dueDate.localeCompare(right.dueDate)
  return left.customerName.localeCompare(right.customerName, 'en-IN')
}

function sum(items, read) {
  return items.reduce((total, item) => total + read(item), 0)
}

function daysBetween(earlier, later) {
  const start = Date.parse(`${earlier}T00:00:00Z`)
  const end = Date.parse(`${later}T00:00:00Z`)
  return Math.round((end - start) / 86_400_000)
}
