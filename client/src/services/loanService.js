import { assertAdmin } from './access.js'
import { getStoredAgent, listStoredAgents } from './agentService.js'
import { getLoanSettings } from './settingsService.js'
import { recordAssignment, recordLoanCreated } from './notificationService.js'
import { loanSeed } from '../data/loanSeed.js'
import { attachPayments } from './paymentStore.js'
import { listCustomers } from './customerService.js'
import {
  LoanStateError,
  LoanValidationError,
  buildSchedule,
  createLoanId,
  hasLoanErrors,
  presentLoan,
  validateLoanInput,
} from '../utils/loans.js'

const STORAGE_KEY = 'saaj.loans.v1'

export function listAgents() {
  return listStoredAgents()
}

export function assignCustomerToAgent(customerId, agentId) {
  assertAdmin('assign a customer')
  const agent = getStoredAgent(agentId)
  if (!agent) throw new LoanStateError('Choose a collection agent.')
  if (agent.status === 'Inactive') throw new LoanStateError('Activate the agent before assigning customers.')

  const loans = readLoans()
  const open = loans.filter(
    (loan) => loan.customerId === customerId && (loan.status === 'Pending' || loan.status === 'Active'),
  )
  if (open.length === 0) throw new LoanStateError('This customer has no open loan to assign.')

  const changed = open.filter((loan) => loan.agentId !== agentId)
  const ids = new Set(changed.map((loan) => loan.id))
  writeLoans(
    loans.map((loan) => {
      if (!ids.has(loan.id) || loan.agentId === agentId) return loan
      return {
        ...loan,
        agentId,
        audit: [...loan.audit, createAudit('Agent assigned', `Assigned to ${agent.name}.`)],
      }
    }),
  )
  const customer = listCustomers().find((item) => item.id === customerId)
  for (const loan of changed) {
    recordAssignment({
      customerId,
      customerName: customer?.fullName || customerId,
      loanId: loan.id,
      agentId,
      agentName: agent.name,
      previousAgentId: loan.agentId,
    })
  }
  return open.length
}

export function listLoans() {
  return readLoans()
    .map((loan) => presentStoredLoan(loan))
    .sort(compareLoans)
}

export function getLoan(loanId) {
  const loan = readLoans().find((record) => record.id === loanId)
  return loan ? presentStoredLoan(loan) : null
}

export function createLoan(input) {
  assertAdmin('create a loan')
  const customers = listCustomers()
  const { errors, terms } = validateLoanInput(input, { customers, agents: listAgents() })
  if (hasLoanErrors(errors)) throw new LoanValidationError(errors)

  const loans = readLoans()
  const loan = {
    ...terms,
    id: createLoanId(loans.map((record) => record.id)),
    status: 'Pending',
    createdAt: '2026-11-16',
    schedule: buildSchedule(terms),
    payments: [],
    audit: [createAudit('Loan created', 'Loan opened as pending.')],
  }

  writeLoans([loan, ...loans])
  const presented = getLoanSettings().activation === 'on-create' ? activateLoan(loan.id) : presentStoredLoan(loan)
  recordLoanCreated(presented)
  return presented
}

export function updatePendingLoan(loanId, input) {
  assertAdmin('edit loan terms')
  const loans = readLoans()
  const current = loans.find((loan) => loan.id === loanId)
  if (!current) throw new LoanStateError('Loan not found.')
  if (current.status !== 'Pending') {
    throw new LoanStateError('Loan terms stay fixed after activation.')
  }

  const { errors, terms } = validateLoanInput(input, { customers: listCustomers(), agents: listAgents() })
  if (hasLoanErrors(errors)) throw new LoanValidationError(errors)

  const updated = {
    ...current,
    ...terms,
    schedule: buildSchedule(terms),
    payments: [],
    audit: [...current.audit, createAudit('Loan terms updated', 'Pending loan terms were replaced.')],
  }

  writeLoans(loans.map((loan) => (loan.id === loanId ? updated : loan)))
  return presentStoredLoan(updated)
}

export function activateLoan(loanId) {
  assertAdmin('activate a loan')
  return changeStatus(loanId, {
    from: ['Pending'],
    status: 'Active',
    refusal: 'Only a pending loan can be activated.',
    action: 'Loan activated',
    detail: 'Collection started. Terms are now fixed.',
  })
}

export function cancelLoan(loanId) {
  assertAdmin('cancel a loan')
  return changeStatus(loanId, {
    from: ['Pending', 'Active'],
    status: 'Cancelled',
    refusal: 'This loan cannot be cancelled.',
    action: 'Loan cancelled',
    detail: 'The schedule is kept. Terms were not rewritten.',
  })
}

function changeStatus(loanId, change) {
  const loans = readLoans()
  const current = loans.find((loan) => loan.id === loanId)
  if (!current) throw new LoanStateError('Loan not found.')
  if (!change.from.includes(current.status)) throw new LoanStateError(change.refusal)

  const updated = {
    ...current,
    status: change.status,
    audit: [...current.audit, createAudit(change.action, change.detail)],
  }
  writeLoans(loans.map((loan) => (loan.id === loanId ? updated : loan)))
  return presentStoredLoan(updated)
}

export function appendLoanAudit(loanId, action, detail) {
  const loans = readLoans()
  const current = loans.find((loan) => loan.id === loanId)
  if (!current) throw new LoanStateError('Loan not found.')

  const updated = {
    ...current,
    audit: [...current.audit, createAudit(action, detail)],
  }
  writeLoans(loans.map((loan) => (loan.id === loanId ? updated : loan)))
  return presentStoredLoan(updated)
}

function presentStoredLoan(loan) {
  const customer = listCustomers().find((record) => record.id === loan.customerId)
  const agent = getStoredAgent(loan.agentId)
  return presentLoan(attachPayments(loan), customer, agent)
}

function readLoans() {
  const stored = storage().getItem(STORAGE_KEY)
  if (!stored) {
    const seed = clone(loanSeed)
    storage().setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }

  try {
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) throw new Error('Loan records are unreadable.')
    return parsed
  } catch {
    const seed = clone(loanSeed)
    storage().setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

function writeLoans(loans) {
  storage().setItem(STORAGE_KEY, JSON.stringify(loans))
}

function storage() {
  if (typeof localStorage === 'undefined') {
    throw new Error('Loan records are stored in the browser for this stage.')
  }
  return localStorage
}

function compareLoans(left, right) {
  if (left.createdAt !== right.createdAt) return right.createdAt.localeCompare(left.createdAt)
  return right.id.localeCompare(left.id)
}

function createAudit(action, detail) {
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(new Date())

  return {
    id: createAuditId(),
    at: `2026-11-16T${time}+05:30`,
    action,
    detail,
  }
}

function createAuditId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `AUD-${Date.now()}`
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}
