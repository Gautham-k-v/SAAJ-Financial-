import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CustomerList } from '../../components/customers/CustomerList'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectField } from '../../components/ui/SelectField'
import { TextField } from '../../components/ui/TextField'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { listCustomers } from '../../services/customerService'
import { CUSTOMER_STATUSES, filterCustomers } from '../../utils/customers'

export default function CustomersPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const customers = listCustomers()
  const visible = filterCustomers(customers, { query, status })
  useDocumentTitle('Customers')

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        eyebrow="Book"
        title="Customers"
        description="Customer records for the lending book. These sample records stay separate from the dashboard figures."
        actions={
          <Link to="/customers/new" className={buttonClasses()}>
            Add customer
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
        <TextField
          id="customer-search"
          label="Search"
          type="search"
          value={query}
          placeholder="Name or phone number"
          onChange={(event) => setQuery(event.target.value)}
        />
        <SelectField id="customer-status" label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="All">All statuses</option>
          {CUSTOMER_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
      </div>

      <p className="mb-4 text-sm text-slate-500" role="status">
        {visible.length === 1 ? '1 customer' : `${visible.length} customers`}
      </p>

      <CustomerList customers={visible} />
    </div>
  )
}
