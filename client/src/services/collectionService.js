import { listAgents, listLoans } from './loanService.js'
import {
  buildDashboardSource,
  collectionRows,
  collectionStatus,
  filterCollections,
  summarizeCollection,
} from '../utils/collections.js'
import { LOAN_BOOK_DATE } from '../utils/loans.js'

export function getCollectionBook(asOf = LOAN_BOOK_DATE) {
  const loans = listLoans()
  const rows = collectionRows(loans, asOf)
  return {
    asOf,
    loans,
    rows,
    summary: summarizeCollection(rows, loans, asOf),
    agents: listAgents(),
  }
}

export function getCollectionLine(loanId, instalmentNumber, asOf = LOAN_BOOK_DATE) {
  const loan = listLoans().find((record) => record.id === loanId) ?? null
  if (!loan) return null
  const instalment = loan.schedule.find((row) => row.number === Number(instalmentNumber))
  if (!instalment) return null

  return {
    loan,
    line: {
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
      status: collectionStatus(
        { dueDate: instalment.dueDate, expected: instalment.expected, collected: instalment.paid },
        asOf,
      ),
      agentId: loan.agentId,
      agentName: loan.agentName,
    },
  }
}

export function visibleCollections(rows, filters) {
  return filterCollections(rows, filters)
}

/** The dashboard and the collection desk both read this snapshot. */
export function getDashboardSnapshot(asOf = LOAN_BOOK_DATE) {
  return buildDashboardSource(listLoans(), asOf)
}
