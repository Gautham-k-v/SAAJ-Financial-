import { parseRupeesToPaise, formatPaise } from './currency.js'
import { PAYMENT_METHODS } from './collections.js'

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export class PaymentValidationError extends Error {
  constructor(fields) {
    super('Check the payment details.')
    this.name = 'PaymentValidationError'
    this.fields = fields
  }
}

export class PaymentStateError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PaymentStateError'
  }
}

/** Earliest outstanding instalments take the money first. Nothing is written here. */
export function planAllocation(schedule, amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Allocation amount must be a positive integer number of paise.')
  }

  let remainingMoney = amount
  const allocations = []

  for (const row of [...schedule].sort((left, right) => left.number - right.number)) {
    if (remainingMoney === 0) break
    const open = Math.max(0, row.expected - row.paid)
    if (open === 0) continue
    const taken = Math.min(open, remainingMoney)
    allocations.push({ instalmentNumber: row.number, dueDate: row.dueDate, amount: taken })
    remainingMoney -= taken
  }

  return {
    allocations,
    allocated: amount - remainingMoney,
    unallocated: remainingMoney,
  }
}

export function allocationLabel(payment, paidOn) {
  const allocations = payment.allocations ?? []
  const allocated = allocations.reduce((sum, item) => sum + item.amount, 0)
  if (allocated === 0) return 'Unallocated'
  if (allocated < payment.amount) return 'Partial'
  if (allocations.length > 1) return 'Advance'
  if (paidOn && allocations.some((item) => item.dueDate && item.dueDate > paidOn)) return 'Advance'
  if (payment.coversInstalment === false) return 'Partial'
  return payment.allocationHint || 'Full'
}

export function validatePaymentInput(input, { loan, agents = [], enabledMethods, referenceMethods } = {}) {
  const errors = {}

  if (!loan) errors.loanId = 'Choose a loan.'
  else if (loan.status !== 'Active') errors.loanId = 'Record payments only on an active loan.'

  const parsed = parseRupeesToPaise(input.amount)
  let paise = 0
  if (parsed.error) errors.amount = parsed.error === 'Enter an amount.' ? 'Enter the amount received.' : parsed.error
  else if (parsed.paise <= 0) errors.amount = 'Enter an amount greater than zero.'
  else if (parsed.paise > 500_000_000) errors.amount = 'Enter ₹50,00,000 or less.'
  else if (loan && parsed.paise > loan.outstanding) {
    errors.amount = `${formatPaise(parsed.paise)} is more than the ${formatPaise(loan.outstanding)} still outstanding. An advance payment can cover later instalments, but it cannot go beyond the loan balance.`
  } else paise = parsed.paise

  const allowedMethods = enabledMethods || PAYMENT_METHODS
  if (!PAYMENT_METHODS.includes(input.method) || !allowedMethods.includes(input.method)) {
    errors.method = 'Choose a payment method.'
  }
  if (!isAllowedDate(input.paidOn)) errors.paidOn = 'Choose a payment date between 2020 and 2028.'

  const reference = String(input.reference ?? '').trim()
  const methodsNeedingReference = referenceMethods || ['UPI', 'Bank transfer']
  if (methodsNeedingReference.includes(input.method) && !reference) {
    errors.reference = 'Enter the transaction reference.'
  } else if (reference && !/^[A-Za-z0-9][A-Za-z0-9 ./_-]{0,39}$/.test(reference)) {
    errors.reference = 'Use letters, numbers, spaces, or . / - _ and keep it within 40 characters.'
  }

  const collector = agents.find((agent) => agent.id === input.collectorId)
  if (!collector) errors.collectorId = 'Choose the collector.'

  const remarks = String(input.remarks ?? '').trim()
  if (remarks.length > 240) errors.remarks = 'Keep remarks within 240 characters.'

  const idempotencyKey = String(input.idempotencyKey ?? '').trim()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    errors.idempotencyKey = 'The payment form needs a fresh submission key.'
  }

  const fields = Object.fromEntries(Object.entries(errors).filter(([, value]) => value))
  return {
    errors: fields,
    ready: Object.keys(fields).length === 0,
    draft: Object.keys(fields).length
      ? null
      : {
          paise,
          method: input.method,
          paidOn: input.paidOn,
          reference,
          collectorId: collector.id,
          collectorName: collector.name,
          remarks,
          idempotencyKey,
        },
  }
}

export function validateReversal(input, payment) {
  const errors = {}
  if (!payment) errors.payment = 'This transaction was not found.'
  else if (payment.type === 'reversal') errors.payment = 'A reversal cannot be reversed again.'
  else if (payment.status === 'Reversed') errors.payment = 'This payment has already been reversed.'

  const reason = String(input.reason ?? '').trim()
  if (!reason) errors.reason = 'Enter the reason for the reversal.'
  else if (reason.length > 240) errors.reason = 'Keep the reason within 240 characters.'

  const fields = Object.fromEntries(Object.entries(errors).filter(([, value]) => value))
  return { errors: fields, ready: Object.keys(fields).length === 0, reason }
}

export function applyReversalStatus(payments) {
  const reversedIds = new Set(
    (payments ?? []).filter((payment) => payment.type === 'reversal').map((payment) => payment.reverses),
  )

  return (payments ?? []).map((payment) => {
    if (payment.type === 'reversal') return { ...payment, status: 'Posted' }
    if (reversedIds.has(payment.id)) return { ...payment, status: 'Reversed' }
    return { ...payment, status: payment.status || 'Posted' }
  })
}

export function receiptBalances(loan, payment) {
  if (Number.isInteger(payment.previousOutstanding) && Number.isInteger(payment.remainingOutstanding)) {
    return {
      previousOutstanding: payment.previousOutstanding,
      remainingOutstanding: payment.remainingOutstanding,
    }
  }

  let cursor = loan.schedule.reduce((sum, row) => sum + row.expected, 0)
  const ordered = [...loan.payments].sort(
    (left, right) => (left.paidOn || '').localeCompare(right.paidOn || '') || left.id.localeCompare(right.id),
  )

  for (const item of ordered) {
    if (item.id === payment.id) {
      return item.type === 'reversal'
        ? { previousOutstanding: cursor, remainingOutstanding: cursor + item.amount }
        : { previousOutstanding: cursor, remainingOutstanding: cursor - item.amount }
    }
    if (item.type === 'reversal') cursor += item.amount
    else cursor -= item.amount
  }

  return { previousOutstanding: loan.outstanding, remainingOutstanding: loan.outstanding }
}

export function describeMovement(payment) {
  if (payment.type === 'reversal') return 'Reversal'
  if (payment.allocation === 'Advance') return 'Advance payment'
  if (payment.allocation === 'Partial') return 'Partial payment'
  return 'Payment'
}

export function ledgerForCustomer(loans, customerId) {
  const entries = []

  for (const loan of loans.filter((item) => item.customerId === customerId)) {
    if (loan.status === 'Pending') continue
    entries.push({
      id: `contract-${loan.id}`,
      at: `${loan.startDate}T00:00:00+05:30`,
      sort: `${loan.startDate}-0-${loan.id}`,
      loanId: loan.id,
      kind: 'Disbursement',
      description: `Loan ${loan.id} opened. Total to collect ${formatPaise(loan.totalRepayment)}.`,
      debit: loan.totalRepayment,
      credit: 0,
      transactionId: loan.id,
      receiptNumber: '—',
      method: '—',
      collector: loan.agentName || '—',
    })

    for (const payment of loan.payments) {
      const at = payment.recordedAt || `${payment.paidOn}T12:00:00+05:30`
      if (payment.type === 'reversal') {
        entries.push({
          id: payment.id,
          at,
          sort: `${payment.paidOn || at.slice(0, 10)}-3-${payment.id}`,
          loanId: loan.id,
          kind: 'Reversal',
          description: `Reversal of ${payment.reverses}. ${payment.reason || ''}`.trim(),
          debit: payment.amount,
          credit: 0,
          transactionId: payment.id,
          receiptNumber: payment.receiptNumber || '—',
          method: payment.method || '—',
          collector: payment.collectorName || loan.agentName || '—',
        })
        continue
      }

      entries.push({
        id: payment.id,
        at,
        sort: `${payment.paidOn}-2-${payment.id}`,
        loanId: loan.id,
        kind: describeMovement(payment),
        description: `${payment.receiptNumber || payment.id} · ${payment.method || 'Cash'}${payment.status === 'Reversed' ? ' · later reversed' : ''}`,
        debit: 0,
        credit: payment.amount,
        transactionId: payment.id,
        receiptNumber: payment.receiptNumber || payment.id,
        method: payment.method || 'Cash',
        collector: payment.collectorName || loan.agentName || '—',
      })
    }

    if (loan.status === 'Cancelled' && loan.outstanding === 0) {
      const net = loan.payments.reduce((sum, payment) => {
        if (payment.type === 'reversal') return sum - payment.amount
        return sum + payment.amount
      }, 0)
      const wiped = loan.totalRepayment - net
      if (wiped > 0) {
        entries.push({
          id: `cancel-${loan.id}`,
          at: `${loan.startDate}T23:59:00+05:30`,
          sort: `${loan.startDate}-9-${loan.id}`,
          loanId: loan.id,
          kind: 'Adjustment',
          description: `Loan ${loan.id} cancelled. Unpaid contract removed from the balance.`,
          debit: 0,
          credit: wiped,
          transactionId: `ADJ-${loan.id}`,
          receiptNumber: '—',
          method: '—',
          collector: '—',
        })
      }
    }
  }

  let balance = 0
  return entries
    .sort((left, right) => left.sort.localeCompare(right.sort))
    .map((entry) => {
      balance += entry.debit - entry.credit
      return { ...entry, balance, date: entry.at.slice(0, 10) }
    })
}

export function nextNumberedId(prefix, existing) {
  let highest = 1000
  const pattern = new RegExp(`^${prefix}-(\\d+)$`)
  for (const value of existing) {
    const match = pattern.exec(value || '')
    if (!match) continue
    highest = Math.max(highest, Number(match[1]))
  }
  return `${prefix}-${String(highest + 1).padStart(4, '0')}`
}

function isAllowedDate(value) {
  return DATE_PATTERN.test(value || '') && value >= '2020-01-01' && value <= '2028-12-31'
}
