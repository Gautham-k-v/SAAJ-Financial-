import { applyReversalStatus } from '../utils/payments.js'

/**
 * Development payment store.
 * Receipts live here, separate from each loan's repayment schedule.
 * localStorage is not production financial storage. The UI talks to paymentService,
 * so a later MongoDB transaction can replace these two functions without a page rewrite.
 */
export const PAYMENT_STORAGE_KEY = 'saaj.payments.v1'

export function readPaymentRecords() {
  const stored = storage().getItem(PAYMENT_STORAGE_KEY)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function writePaymentRecords(records) {
  storage().setItem(PAYMENT_STORAGE_KEY, JSON.stringify(records))
}

/** Join posted receipts onto a loan without copying them into the schedule. */
export function attachPayments(loan) {
  const stored = readPaymentRecords().filter((payment) => payment.loanId === loan.id)
  const known = new Set((loan.payments ?? []).map((payment) => payment.id))
  const combined = [...(loan.payments ?? []), ...stored.filter((payment) => !known.has(payment.id))]
  return { ...loan, payments: applyReversalStatus(combined) }
}

function storage() {
  if (typeof localStorage === 'undefined') {
    throw new Error('Payments are stored in the browser for this development stage.')
  }
  return localStorage
}
