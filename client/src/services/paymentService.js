import { formatPaise } from '../utils/currency.js'
import {
  PaymentStateError,
  PaymentValidationError,
  allocationLabel,
  nextNumberedId,
  planAllocation,
  validatePaymentInput,
  validateReversal,
} from '../utils/payments.js'
import { assertAdmin, assertCanPostPayment } from './access.js'
import { appendLoanAudit, getLoan, listAgents, listLoans } from './loanService.js'
import { getPaymentSettings } from './settingsService.js'
import { recordPaymentConfirmation, recordPaymentReceived, recordPaymentReversed } from './notificationService.js'
import { readPaymentRecords, writePaymentRecords } from './paymentStore.js'

export function listTransactions() {
  return listLoans()
    .flatMap((loan) => loan.payments.map((payment) => presentTransaction(payment, loan)))
    .sort(compareTransactions)
}

export function getTransaction(paymentId) {
  return listTransactions().find((payment) => payment.id === paymentId) ?? null
}

export function filterTransactions(transactions, { query = '', method = '', customerId = '', from = '', to = '' } = {}) {
  const text = query.trim().toLocaleLowerCase('en-IN')
  return transactions.filter((payment) => {
    if (method && payment.method !== method) return false
    if (customerId && payment.customerId !== customerId) return false
    if (from && (payment.paidOn || '') < from) return false
    if (to && (payment.paidOn || '') > to) return false
    if (!text) return true
    return [payment.id, payment.receiptNumber, payment.customerName, payment.loanId, payment.reference]
      .join(' ')
      .toLocaleLowerCase('en-IN')
      .includes(text)
  })
}

/**
 * Append one receipt and one loan audit entry.
 * A repeated submission key returns the original receipt and does not post again.
 * If the audit write fails, the receipt write is restored.
 */
export function postPayment(input) {
  const loan = getLoan(input.loanId)
  const current = assertCanPostPayment(loan)
  const submission = current.role === 'agent' ? { ...input, collectorId: current.accountId } : input
  const paymentSettings = getPaymentSettings()
  const { errors, draft } = validatePaymentInput(submission, {
    loan,
    agents: listAgents(),
    enabledMethods: paymentSettings.methods,
    referenceMethods: paymentSettings.referenceMethods,
  })
  if (!draft) throw new PaymentValidationError(errors)

  const existing = readPaymentRecords()
  const duplicate = existing.find((payment) => payment.idempotencyKey === draft.idempotencyKey)
  if (duplicate) return getTransaction(duplicate.id)

  const plan = planAllocation(loan.schedule, draft.paise)
  if (plan.unallocated > 0) {
    throw new PaymentValidationError({
      amount: 'The amount is more than the instalments still outstanding.',
    })
  }

  const identifiers = listTransactions().flatMap((payment) => [payment.id, payment.receiptNumber])
  const only = plan.allocations.length === 1 ? plan.allocations[0] : null
  const onlyRow = only ? loan.schedule.find((row) => row.number === only.instalmentNumber) : null
  const coversTarget = Boolean(onlyRow && only.amount >= onlyRow.remaining)
  const payment = {
    id: nextNumberedId('TXN', identifiers),
    receiptNumber: nextNumberedId(paymentSettings.receiptPrefix || 'RCP', identifiers),
    type: 'payment',
    loanId: loan.id,
    customerId: loan.customerId,
    customerName: loan.customerName,
    customerPhone: loan.customerPhone,
    place: loan.customerPlace,
    amount: draft.paise,
    paidOn: draft.paidOn,
    method: draft.method,
    reference: draft.reference,
    collectorId: draft.collectorId,
    collectorName: draft.collectorName,
    remarks: draft.remarks,
    recordedAt: recordedAtStamp(),
    idempotencyKey: draft.idempotencyKey,
    allocations: plan.allocations.map(({ instalmentNumber, amount, dueDate }) => ({ instalmentNumber, amount, dueDate })),
    allocation: allocationLabel(
      { amount: draft.paise, allocations: plan.allocations, allocationHint: coversTarget ? 'Full' : 'Partial' },
      draft.paidOn,
    ),
    previousOutstanding: loan.outstanding,
    remainingOutstanding: loan.outstanding - draft.paise,
    unallocated: plan.unallocated,
  }

  writePaymentRecords([...existing, payment])
  try {
    appendLoanAudit(
      loan.id,
      'Payment recorded',
      `${payment.receiptNumber} for ${formatPaise(payment.amount)} by ${payment.method}. Schedule expected amounts were not changed.`,
    )
  } catch (error) {
    writePaymentRecords(existing)
    throw error
  }

  const posted = getTransaction(payment.id)
  recordPaymentReceived(posted)
  recordPaymentConfirmation(posted)
  return posted
}

/** Append a reversal. The original receipt amount and allocations stay as first written. */
export function reversePayment(paymentId, input) {
  assertAdmin('reverse or delete a payment')
  const payment = getTransaction(paymentId)
  const { errors, ready, reason } = validateReversal(input, payment)
  if (!ready) throw new PaymentValidationError(errors)

  const existing = readPaymentRecords()
  if (existing.some((record) => record.type === 'reversal' && record.reverses === payment.id)) {
    throw new PaymentStateError('This payment has already been reversed.')
  }

  const loan = getLoan(payment.loanId)
  const reversal = {
    id: nextNumberedId('REV', listTransactions().map((record) => record.id)),
    receiptNumber: payment.receiptNumber,
    type: 'reversal',
    reverses: payment.id,
    loanId: payment.loanId,
    customerId: payment.customerId,
    customerName: payment.customerName,
    amount: payment.amount,
    paidOn: payment.paidOn,
    method: payment.method,
    reason,
    collectorName: payment.collectorName,
    recordedAt: recordedAtStamp(),
    previousOutstanding: loan?.outstanding ?? payment.amount,
    remainingOutstanding: (loan?.outstanding ?? 0) + payment.amount,
  }

  const next = [...existing, reversal]
  writePaymentRecords(next)
  try {
    appendLoanAudit(payment.loanId, 'Payment reversed', `${payment.receiptNumber} reversed. ${reason}`)
  } catch (error) {
    writePaymentRecords(existing)
    throw error
  }

  const posted = getTransaction(reversal.id)
  recordPaymentReversed(posted)
  return posted
}

function presentTransaction(payment, loan) {
  const reversal = loan.payments.find((item) => item.type === 'reversal' && item.reverses === payment.id)
  return {
    ...payment,
    loanId: loan.id,
    customerId: loan.customerId,
    customerName: payment.customerName || loan.customerName,
    customerPhone: payment.customerPhone || loan.customerPhone,
    place: payment.place || loan.customerPlace,
    receiptNumber: payment.receiptNumber || payment.id,
    method: payment.method || 'Cash',
    collectorName: payment.collectorName || loan.agentName,
    reference: payment.reference || '',
    status: payment.status || 'Posted',
    reversalReason: reversal?.reason || '',
    dailyInstalment: loan.dailyInstalment,
    totalRepayment: loan.totalRepayment,
  }
}

function compareTransactions(left, right) {
  const leftAt = left.recordedAt || left.paidOn || ''
  const rightAt = right.recordedAt || right.paidOn || ''
  if (leftAt !== rightAt) return rightAt.localeCompare(leftAt)
  return right.id.localeCompare(left.id)
}

function recordedAtStamp() {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(new Date())
  return `${date}T${time}+05:30`
}

export function collectorOptions() {
  return listAgents().filter((agent) => agent.status !== 'Inactive')
}
