import { collectionRows, filterCollections, summarizeCollection } from './collections.js'
import { LOAN_BOOK_DATE } from './loans.js'

export function agentBook(loans, agentId, asOf = LOAN_BOOK_DATE) {
  const assignedLoans = loans.filter((loan) => loan.agentId === agentId)
  const activeLoans = assignedLoans.filter((loan) => loan.status === 'Active')
  const rows = collectionRows(assignedLoans, asOf)
  const dueToday = rows.filter((row) => row.dueDate === asOf)
  const summary = summarizeCollection(rows, assignedLoans, asOf)

  return {
    asOf,
    loans: assignedLoans,
    activeLoans,
    rows,
    dueToday,
    target: summary.expected,
    collected: summary.collected,
    remaining: summary.pending,
    percentage: summary.percentage,
    assignedCustomers: new Set(activeLoans.map((loan) => loan.customerId)).size,
    completed: dueToday.filter((row) => row.status === 'Paid').length,
    pending: dueToday.filter((row) => row.status !== 'Paid').length,
  }
}

export function visibleAgentCollections(rows, filters) {
  return filterCollections(rows, filters)
}

export function assignedCustomerLoans(loans, agentId, customerId) {
  return loans.filter((loan) => loan.agentId === agentId && loan.customerId === customerId)
}
