import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { listLoans } from './loanService.js'
import { listStoredAgents } from './agentService.js'
import {
  hideNotice,
  listForRecipient,
  markAllRead,
  markNoticeRead,
  publishNotice,
  syncOperationalNotices,
} from './notificationService.js'
import { saveNotificationSettings } from './settingsService.js'
import { filterNotifications } from '../utils/notifications.js'

class MemoryStorage {
  #items = new Map()
  getItem(key) {
    return this.#items.has(key) ? this.#items.get(key) : null
  }
  setItem(key, value) {
    this.#items.set(key, String(value))
  }
}

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage()
})

test('keeps a separate read state for each administrator and ignores a repeated event', () => {
  const first = publishNotice({
    eventKey: 'customer:CUS-1',
    category: 'System',
    title: 'Customer created',
    description: 'Meena was added.',
    customerName: 'Meena',
    recipients: 'admins',
  })
  assert.equal(publishNotice({
    eventKey: 'customer:CUS-1',
    category: 'System',
    title: 'Customer created',
    description: 'Meena was added.',
    recipients: 'admins',
  }), null)
  markNoticeRead('ADM-01', first.id)
  assert.equal(listForRecipient('ADM-01').find((item) => item.id === first.id).read, true)
  assert.equal(listForRecipient('ADM-02').find((item) => item.id === first.id).read, false)
  markAllRead('ADM-02')
  assert.equal(listForRecipient('ADM-02').every((item) => item.read), true)
  hideNotice('ADM-01', first.id)
  assert.equal(listForRecipient('ADM-01').some((item) => item.id === first.id), false)
  assert.equal(listForRecipient('ADM-02').some((item) => item.id === first.id), true)
})

test('filters notices and shows an agent only their own', () => {
  publishNotice({ eventKey: 'pay:1', category: 'Payments', title: 'Payment received', description: 'Cash from Kavitha', customerName: 'Kavitha', recipients: 'admins' })
  publishNotice({ eventKey: 'agent:1', category: 'Collections', title: 'Daily collection reminder', description: 'Three stops remain', recipients: ['AGT-01'] })
  const admins = filterNotifications(listForRecipient('ADM-01'), { query: 'kavitha', category: 'Payments' })
  assert.equal(admins.length, 1)
  assert.equal(listForRecipient('AGT-01').length, 1)
  assert.equal(listForRecipient('AGT-02').length, 0)
  assert.equal(listForRecipient('ADM-01').some((item) => item.title === 'Daily collection reminder'), false)
})

test('records one overdue notice per instalment and honours a turned-off payment alert', () => {
  const loans = listLoans()
  syncOperationalNotices(loans, listStoredAgents())
  const first = listForRecipient('ADM-01').filter((item) => item.category === 'Overdue').length
  syncOperationalNotices(loans, listStoredAgents())
  assert.equal(listForRecipient('ADM-01').filter((item) => item.category === 'Overdue').length, first)
  assert.ok(first > 0)
  saveNotificationSettings({ payment: false, overdue: true, daily: true, agent: false })
  assert.equal(publishNotice({
    eventKey: 'pay:off',
    category: 'Payments',
    title: 'Payment received',
    description: 'Skipped',
    recipients: 'admins',
  }), null)
})
