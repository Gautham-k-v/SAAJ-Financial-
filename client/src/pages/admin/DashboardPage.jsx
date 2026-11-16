import { DashboardContent } from '../../components/dashboard/DashboardContent'
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { PageHeader } from '../../components/ui/PageHeader'
import { useDashboardOverview } from '../../hooks/useDashboardOverview'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { formatDisplayDate } from '../../utils/datetime'

export default function DashboardPage() {
  const { status, data, error, reload } = useDashboardOverview()
  useDocumentTitle('Dashboard')

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        eyebrow="Operations"
        title="Dashboard"
        description="Collection figures are calculated from the loan book and its payment allocations."
        actions={
          status === 'ready' && data ? (
            <p className="w-fit whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600">
              Loan book · {formatDisplayDate(data.asOf)}
            </p>
          ) : null
        }
      />
      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState title="Dashboard unavailable" message={error} onRetry={reload} />
      ) : null}
      {status === 'ready' && data ? <DashboardContent data={data} /> : null}
    </div>
  )
}
