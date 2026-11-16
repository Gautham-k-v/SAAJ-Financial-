import { agentBook } from '../utils/agentBook.js'
import { collectionRows } from '../utils/collections.js'
import { LOAN_BOOK_DATE } from '../utils/loans.js'
import { nextNumberedId } from '../utils/payments.js'
import { preferenceAllows } from '../utils/notifications.js'
import { getSettings } from './settingsService.js'

const STORAGE_KEY = 'saaj.notifications.v1'
const VIEWER_KEY = 'saaj.desk.admin'

/**
 * Development notice board for this browser.
 * Notices are not payments, loans, or customers.
 * Replace these reads and writes when a notification API exists.
 */
export function publishNotice(input, { force = false } = {}) {
  const preferences = getSettings().notifications
  if (!force && !preferenceAllows(input.category, preferences)) return null
  const data = read()
  if (data.events.some((event) => event.eventKey === input.eventKey)) return null
  const recipients = input.recipients === 'admins' ? adminIds() : input.recipients
  if (!recipients?.length) return null
  const notice = {
    id: nextNumberedId('NTF', data.events.map((event) => event.id)),
    eventKey: input.eventKey,
    title: input.title,
    description: input.description,
    category: input.category,
    at: stamp(),
    customerId: input.customerId || '',
    customerName: input.customerName || '',
    loanId: input.loanId || '',
    transactionId: input.transactionId || '',
    recipients,
  }
  data.events = [notice, ...data.events]
  write(data)
  return notice
}

export function listForRecipient(recipientId) {
  const data = read()
  const inbox = data.inbox[recipientId] || { read: [], hidden: [] }
  return data.events
    .filter((event) => event.recipients.includes(recipientId) && !inbox.hidden.includes(event.id))
    .map((event) => ({ ...event, read: inbox.read.includes(event.id) }))
}

export function unreadCount(recipientId) {
  return listForRecipient(recipientId).filter((event) => !event.read).length
}

export function markNoticeRead(recipientId, noticeId) {
  return updateInbox(recipientId, (inbox) => {
    if (!inbox.read.includes(noticeId)) inbox.read.push(noticeId)
  })
}

export function markAllRead(recipientId) {
  const visible = listForRecipient(recipientId).map((event) => event.id)
  return updateInbox(recipientId, (inbox) => {
    inbox.read = [...new Set([...inbox.read, ...visible])]
  })
}

export function hideNotice(recipientId, noticeId) {
  return updateInbox(recipientId, (inbox) => {
    if (!inbox.hidden.includes(noticeId)) inbox.hidden.push(noticeId)
  })
}

export function currentDeskAdmin() {
  const admins = adminIds()
  const stored = browserSession()?.getItem(VIEWER_KEY)
  return admins.includes(stored) ? stored : admins[0]
}

export function setDeskAdmin(adminId) {
  if (!adminIds().includes(adminId)) return
  browserSession()?.setItem(VIEWER_KEY, adminId)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('saaj-desk-admin'))
}

export function recordCustomerCreated(customer) {
  return safe(() => publishNotice({
    eventKey: `customer:${customer.id}`,
    category: 'System',
    title: 'Customer created',
    description: `${customer.fullName} was added to the book.`,
    customerId: customer.id,
    customerName: customer.fullName,
    recipients: 'admins',
  }))
}

export function recordLoanCreated(loan) {
  return safe(() => publishNotice({
    eventKey: `loan:${loan.id}`,
    category: 'Loans',
    title: 'Loan created',
    description: `${loan.id} for ${loan.customerName} was opened.`,
    customerId: loan.customerId,
    customerName: loan.customerName,
    loanId: loan.id,
    recipients: 'admins',
  }))
}

export function recordPaymentReceived(payment) {
  const partial = payment.allocation === 'Partial'
  return safe(() => publishNotice({
    eventKey: `payment:${payment.id}`,
    category: 'Payments',
    title: partial ? 'Partial payment received' : 'Payment received',
    description: `${payment.receiptNumber} for ${payment.customerName} was posted.`,
    customerId: payment.customerId,
    customerName: payment.customerName,
    loanId: payment.loanId,
    transactionId: payment.id,
    recipients: 'admins',
  }))
}

export function recordPaymentConfirmation(payment) {
  if (!payment.collectorId) return null
  return safe(() => publishNotice({
    eventKey: `payment-agent:${payment.id}:${payment.collectorId}`,
    category: 'Payments',
    title: 'Payment confirmation',
    description: `${payment.receiptNumber} was recorded on your collection.`,
    customerId: payment.customerId,
    customerName: payment.customerName,
    loanId: payment.loanId,
    transactionId: payment.id,
    recipients: [payment.collectorId],
  }))
}

export function recordPaymentReversed(payment) {
  return safe(() => publishNotice({
    eventKey: `reversal:${payment.id}`,
    category: 'Payments',
    title: 'Payment reversed',
    description: `${payment.receiptNumber} for ${payment.customerName} was reversed.`,
    customerId: payment.customerId,
    customerName: payment.customerName,
    loanId: payment.loanId,
    transactionId: payment.id,
    recipients: 'admins',
  }))
}

export function recordAgentCreated(agent) {
  return safe(() => publishNotice({
    eventKey: `agent:${agent.id}`,
    category: 'Agents',
    title: 'Collection agent created',
    description: `${agent.name} was added to the field book.`,
    recipients: 'admins',
  }))
}

export function recordAssignment({ customerId, customerName, loanId, agentId, agentName, previousAgentId }) {
  safe(() => publishNotice({
    eventKey: `assignment:${loanId}:${agentId}`,
    category: 'Agents',
    title: previousAgentId ? 'Customer assignment changed' : 'Customer assigned',
    description: `${customerName} is now assigned to ${agentName}.`,
    customerId,
    customerName,
    loanId,
    recipients: 'admins',
  }))
  safe(() => publishNotice({
    eventKey: `assignment-agent:${loanId}:${agentId}`,
    category: 'Agents',
    title: 'New customer assignment',
    description: `${customerName} was assigned to you.`,
    customerId,
    customerName,
    loanId,
    recipients: [agentId],
  }))
  if (previousAgentId && previousAgentId !== agentId) {
    safe(() => publishNotice({
      eventKey: `reassignment:${loanId}:${previousAgentId}:${agentId}`,
      category: 'Agents',
      title: 'Customer reassignment',
      description: `${customerName} was moved to another agent.`,
      customerId,
      customerName,
      loanId,
      recipients: [previousAgentId],
    }))
  }
}

export function sendAnnouncement({ title, description, agentIds = [] }) {
  const text = String(description ?? '').trim()
  const heading = String(title ?? '').trim()
  if (heading.length < 2 || text.length < 2) return 0
  const key = `announcement:${Date.now()}`
  return [...new Set([...adminIds(), ...agentIds])].reduce((count, recipient) => {
    const notice = publishNotice({
      eventKey: `${key}:${recipient}`,
      category: 'System',
      title: heading,
      description: text,
      recipients: [recipient],
    }, { force: true })
    return count + (notice ? 1 : 0)
  }, 0)
}

export function syncOperationalNotices(loans, agents, asOf = LOAN_BOOK_DATE) {
  for (const row of collectionRows(loans, asOf)) {
    if (row.status === 'Overdue') {
      publishNotice({
        eventKey: `overdue:${row.loanId}:${row.instalmentNumber}`,
        category: 'Overdue',
        title: 'Instalment overdue',
        description: `${row.customerName}, instalment ${row.instalmentNumber} on ${row.loanId}, is overdue.`,
        customerId: row.customerId,
        customerName: row.customerName,
        loanId: row.loanId,
        recipients: 'admins',
      })
    }
    if (row.dueDate === asOf && row.status !== 'Paid') {
      publishNotice({
        eventKey: `missed:${row.loanId}:${row.instalmentNumber}:${asOf}`,
        category: 'Collections',
        title: 'Missed collection',
        description: `${row.customerName} still has an open instalment on ${row.loanId} today.`,
        customerId: row.customerId,
        customerName: row.customerName,
        loanId: row.loanId,
        recipients: 'admins',
      })
    }
  }
  for (const agent of agents) {
    const book = agentBook(loans, agent.id, asOf)
    if (book.pending > 0) {
      publishNotice({
        eventKey: `reminder:${agent.id}:${asOf}`,
        category: 'Collections',
        title: 'Daily collection reminder',
        description: `${book.pending} collections are still open on your round.`,
        recipients: [agent.id],
      })
    }
  }
}

function adminIds() {
  return getSettings().admins.map((admin) => admin.id)
}

function updateInbox(recipientId, change) {
  const data = read()
  const inbox = data.inbox[recipientId] || { read: [], hidden: [] }
  change(inbox)
  data.inbox[recipientId] = inbox
  write(data)
  return listForRecipient(recipientId)
}

function read() {
  const stored = storage().getItem(STORAGE_KEY)
  if (!stored) return { events: [], inbox: {} }
  try {
    const parsed = JSON.parse(stored)
    return {
      events: Array.isArray(parsed.events) ? parsed.events : [],
      inbox: parsed.inbox && typeof parsed.inbox === 'object' ? parsed.inbox : {},
    }
  } catch {
    return { events: [], inbox: {} }
  }
}

function write(data) {
  storage().setItem(STORAGE_KEY, JSON.stringify(data))
}

function storage() {
  if (typeof localStorage === 'undefined') throw new Error('Notices are stored in the browser for this stage.')
  return localStorage
}

function browserSession() {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage
}

function safe(run) {
  try {
    return run()
  } catch {
    return null
  }
}

function stamp() {
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
