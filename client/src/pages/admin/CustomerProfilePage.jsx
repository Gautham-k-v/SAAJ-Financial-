import { Link, useParams } from 'react-router-dom'
import { CustomerPhoto } from '../../components/customers/CustomerPhoto'
import { CustomerStatusBadge } from '../../components/customers/CustomerStatusBadge'
import { ErrorState } from '../../components/ui/ErrorState'
import { PageHeader } from '../../components/ui/PageHeader'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { getCustomer } from '../../services/customerService'
import { formatPhone } from '../../utils/customers'
import { formatDisplayDate } from '../../utils/datetime'

export default function CustomerProfilePage() {
  const { customerId } = useParams()
  const customer = getCustomer(customerId)
  useDocumentTitle(customer ? customer.fullName : 'Customer')

  if (!customer) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState title="Customer not found" message="This customer ID is not in the customer records." />
        <Link to="/customers" className={`${buttonClasses({ variant: 'secondary' })} mt-6`}>
          Back to customers
        </Link>
      </div>
    )
  }

  const details = [
    ['Phone', formatPhone(customer.phone)],
    ['Alternate phone', customer.alternatePhone ? formatPhone(customer.alternatePhone) : '—'],
    ['Address', customer.address],
    ['Place', customer.place],
    ['PIN code', customer.pinCode],
    ['Created', formatDisplayDate(customer.createdAt)],
  ]

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={customer.id}
        title={customer.fullName}
        description={`${customer.place} · ${customer.pinCode}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/customers" className={buttonClasses({ variant: 'secondary' })}>
              All customers
            </Link>
            <Link to={`/customers/${customer.id}/edit`} className={buttonClasses()}>
              Edit customer
            </Link>
          </div>
        }
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <CustomerPhoto name={customer.fullName} photograph={customer.photograph} size="lg" />
          <CustomerStatusBadge status={customer.status} />
        </div>
        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</dt>
              <dd className="mt-1 text-sm font-medium text-navy-900">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-sm font-semibold text-navy-900">KYC document references</h2>
        {customer.kycDocuments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No document references recorded.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {customer.kycDocuments.map((document) => (
              <li key={`${document.type}-${document.reference}`} className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm font-medium text-navy-900">{document.type}</span>
                <span className="text-sm text-slate-600">{document.reference}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
