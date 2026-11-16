import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { activateLoan, createLoan, getLoan } from './loanService.js'
import { PAYMENT_STORAGE_KEY, readPaymentRecords } from './paymentStore.js'
import { getTransaction, postPayment, reversePayment } from './paymentService.js'
import { getCollectionBook } from './collectionService.js'
import { buildReceiptPdf } from '../utils/receiptPdf.js'
import { ledgerForCustomer, planAllocation } from '../utils/payments.js'
import { PaymentValidationError } from '../utils/payments.js'

class MemoryStorage {
  #items = new Map()

  getItem(key) {
    return this.#items.has(key) ? this.#items.get(key) : null
  }

  setItem(key, value) {
    this.#items.set(key, String(value))
  }
}

const contract = {
  customerId: 'CUS-1502',
  principal: '8000',
  financeCharge: '2000',
  totalRepayment: '10000',
  dailyInstalment: '1000',
  repaymentDays: '10',
  startDate: '2026-11-16',
  agentId: 'AGT-01',
  remarks: '',
}

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage()
})

test('allocates an advance across the earliest outstanding instalments once', () => {
  const plan = planAllocation(
    [
      { number: 1, dueDate: '2026-11-16', expected: 100000, paid: 0, remaining: 100000 },
      { number: 2, dueDate: '2026-11-17', expected: 100000, paid: 0, remaining: 100000 },
    ],
    150000,
  )

  assert.deepEqual(
    plan.allocations.map((item) => item.amount),
    [100000, 50000],
  )
  assert.equal(plan.unallocated, 0)
  assert.equal(plan.allocated, 150000)
})

test('records a full instalment and keeps the schedule expected amount', async () => {
  const loan = openLoan()
  const before = getCollectionBook('2026-11-16')
  const payment = postPayment(draft(loan.id, '1000'))
  const after = getLoan(loan.id)
  const book = getCollectionBook('2026-11-16')

  assert.equal(payment.id, 'TXN-1001')
  assert.equal(payment.receiptNumber, 'RCP-1001')
  assert.equal(payment.previousOutstanding, 1000000)
  assert.equal(payment.remainingOutstanding, 900000)
  assert.equal(after.schedule[0].status, 'Paid')
  assert.equal(after.schedule[0].expected, 100000)
  assert.equal(after.outstanding, 900000)
  assert.equal(book.summary.collected, before.summary.collected + 100000)
  assert.match(new TextDecoder().decode(buildReceiptPdf(pdfReceipt(payment))), /^%PDF-1\.4/)
})

test('records a partial payment of five hundred against a one thousand instalment', () => {
  const loan = openLoan()
  const payment = postPayment(draft(loan.id, '500'))
  const updated = getLoan(loan.id)
  const line = getCollectionBook('2026-11-16').rows.find((row) => row.loanId === loan.id && row.instalmentNumber === 1)

  assert.equal(payment.amount, 50000)
  assert.equal(payment.allocation, 'Partial')
  assert.equal(updated.schedule[0].paid, 50000)
  assert.equal(updated.schedule[0].remaining, 50000)
  assert.equal(updated.schedule[0].status, 'Partial')
  assert.equal(line.status, 'Partial')
  assert.equal(updated.outstanding, 950000)
})

test('records an advance without counting it twice', () => {
  const loan = openLoan()
  const payment = postPayment(draft(loan.id, '1500'))
  const updated = getLoan(loan.id)

  assert.equal(payment.allocation, 'Advance')
  assert.equal(payment.unallocated, 0)
  assert.equal(updated.schedule[0].status, 'Paid')
  assert.equal(updated.schedule[1].paid, 50000)
  assert.equal(updated.schedule[1].status, 'Partial')
  assert.equal(updated.totalRepaid, 150000)
  assert.equal(updated.outstanding, 850000)
})

test('keeps two payments on the same day and ignores a repeated submission', () => {
  const loan = openLoan()
  const key = crypto.randomUUID()
  const first = postPayment(draft(loan.id, '400', { idempotencyKey: key }))
  const repeat = postPayment(draft(loan.id, '400', { idempotencyKey: key }))
  const second = postPayment(draft(loan.id, '600'))
  const updated = getLoan(loan.id)

  assert.equal(first.id, repeat.id)
  assert.notEqual(first.id, second.id)
  assert.equal(readPaymentRecords().length, 2)
  assert.equal(updated.schedule[0].paid, 100000)
  assert.equal(updated.schedule[0].status, 'Paid')
})

test('rejects a zero, negative, or over-balance amount before writing', () => {
  const loan = openLoan()
  assert.throws(() => postPayment(draft(loan.id, '0')), PaymentValidationError)
  assert.throws(() => postPayment(draft(loan.id, '-5')), PaymentValidationError)
  assert.throws(() => postPayment(draft(loan.id, '10001')), PaymentValidationError)
  assert.equal(readPaymentRecords().length, 0)
  assert.equal(getLoan(loan.id).outstanding, 1000000)
})

test('updates the customer ledger and restores it after a controlled reversal', () => {
  const loan = openLoan()
  const payment = postPayment(draft(loan.id, '500', { method: 'UPI', reference: 'UPI123' }))
  const paid = getLoan(loan.id)
  const ledger = ledgerForCustomer([paid], paid.customerId)
  assert.equal(ledger.at(-1).balance, paid.outstanding)

  const reversal = reversePayment(payment.id, { reason: 'Collected against the wrong loan.' })
  const restored = getLoan(loan.id)
  const stored = JSON.parse(localStorage.getItem(PAYMENT_STORAGE_KEY))
  const original = stored.find((record) => record.id === payment.id)

  assert.equal(original.amount, 50000)
  assert.deepEqual(original.allocations, [{ instalmentNumber: 1, amount: 50000, dueDate: '2026-11-16' }])
  assert.equal(getTransaction(payment.id).status, 'Reversed')
  assert.equal(reversal.type, 'reversal')
  assert.equal(restored.schedule[0].status, 'Unpaid')
  assert.equal(restored.outstanding, 1000000)
  assert.equal(ledgerForCustomer([restored], restored.customerId).at(-1).balance, 1000000)
  assert.throws(() => reversePayment(payment.id, { reason: 'Again' }), PaymentValidationError)
  assert.equal(stored.filter((record) => record.type === 'reversal').length, 1)
})

function openLoan() {
  const created = createLoan(contract)
  return activateLoan(created.id)
}

function draft(loanId, amount, overrides = {}) {
  return {
    loanId,
    amount,
    method: 'Cash',
    paidOn: '2026-11-16',
    reference: '',
    collectorId: 'AGT-01',
    remarks: '',
    idempotencyKey: crypto.randomUUID(),
    ...overrides,
  }
}

function pdfReceipt(payment) {
  return {
    ...payment,
    status: 'Posted',
    amountLabel: 'Rs. 1,000',
    previousLabel: 'Rs. 10,000',
    remainingLabel: 'Rs. 9,000',
    unallocatedLabel: 'Rs. 0',
    when: '16 Nov 2026, 2:00 pm',
    allocationText: 'Instalment 1',
  }
}
