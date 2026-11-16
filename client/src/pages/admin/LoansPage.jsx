import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LoanList } from '../../components/loans/LoanList'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectField } from '../../components/ui/SelectField'
import { TextField } from '../../components/ui/TextField'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { listLoans } from '../../services/loanService'
import { LOAN_STATUSES, filterLoans } from '../../utils/loans'

export default function LoansPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const loans = listLoans()
  const visible = filterLoans(loans, { query, status })
  useDocumentTitle('Loans')

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        eyebrow="Book"
        title="Loans"
        description="Daily repayment loans and their schedules. The dashboard reads these loans and their payment allocations."
        actions={
          <Link to="/loans/new" className={buttonClasses()}>
            New loan
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
        <TextField
          id="loan-search"
          label="Search"
          type="search"
          value={query}
          placeholder="Loan ID or customer name"
          onChange={(event) => setQuery(event.target.value)}
        />
        <SelectField id="loan-status" label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="All">All statuses</option>
          {LOAN_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
      </div>

      <p className="mb-4 text-sm text-slate-500" role="status">
        {visible.length === 1 ? '1 loan' : `${visible.length} loans`}
      </p>

      <LoanList loans={visible} />
    </div>
  )
}
