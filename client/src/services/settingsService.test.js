import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { createLoan, getLoan } from './loanService.js'
import {
  getSettings,
  requestPasswordChange,
  saveBusinessProfile,
  saveLoanSettings,
  savePaymentSettings,
  setAdminStatus,
} from './settingsService.js'
import { SettingsValidationError, nextReceiptNumber } from '../utils/settings.js'

class MemoryStorage {
  #items = new Map()
  getItem(key) {
    return this.#items.has(key) ? this.#items.get(key) : null
  }
  setItem(key, value) {
    this.#items.set(key, String(value))
  }
}

const business = {
  name: 'SAAJ',
  logo: '',
  address: '41, Anna Salai, Chennai',
  phone: '9841000001',
  email: 'admin@saaj.example',
  registration: 'REG-100',
  receiptFooter: 'Daily loan collections',
}

const loanInput = {
  customerId: 'CUS-1502',
  principal: '10000',
  financeCharge: '2000',
  totalRepayment: '12000',
  dailyInstalment: '1200',
  repaymentDays: '10',
  startDate: '2026-11-16',
  agentId: 'AGT-01',
  remarks: '',
}

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage()
})

test('saves the business profile in the browser store and keeps four administrators', () => {
  assert.throws(() => saveBusinessProfile({ ...business, name: '' }), SettingsValidationError)
  const saved = saveBusinessProfile(business)
  assert.equal(saved.address, '41, Anna Salai, Chennai')
  assert.equal(getSettings().admins.length, 4)
  assert.equal(getSettings().admins.filter((admin) => admin.status === 'Active').length, 4)
})

test('refuses to deactivate the last administrator and does not store a password', () => {
  const admins = getSettings().admins
  setAdminStatus(admins[1].id, 'Inactive')
  setAdminStatus(admins[2].id, 'Inactive')
  setAdminStatus(admins[3].id, 'Inactive')
  assert.throws(() => setAdminStatus(admins[0].id, 'Inactive'), SettingsValidationError)
  requestPasswordChange({ password: 'desk-secret', confirm: 'desk-secret' })
  assert.equal(JSON.stringify(getSettings()).includes('desk-secret'), false)
  assert.equal(getSettings().log[0].action, 'Password change requested')
})

test('loan defaults do not rewrite an open loan, and a new receipt prefix does not renumber old receipts', () => {
  const created = createLoan(loanInput)
  saveLoanSettings({ frequency: 'Daily', durationDays: '50', financeMethod: 'amount', financePercent: '', activation: 'manual' })
  assert.equal(getLoan(created.id).schedule.length, 10)
  assert.equal(getLoan(created.id).status, 'Pending')
  savePaymentSettings({ methods: ['Cash', 'UPI', 'Bank transfer'], referenceMethods: ['UPI', 'Bank transfer'], receiptPrefix: 'SAJ' })
  assert.equal(nextReceiptNumber(['RCP-1003', 'TXN-1003'], 'SAJ'), 'SAJ-1001')
  assert.equal(nextReceiptNumber(['RCP-1003', 'TXN-1003'], 'RCP'), 'RCP-1004')
})
