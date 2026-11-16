import { CollectionChart } from './CollectionChart'
import { CollectionSummary } from './CollectionSummary'
import { OverdueAlerts } from './OverdueAlerts'
import { OverviewStats } from './OverviewStats'
import { PerformanceChart } from './PerformanceChart'
import { RecentTransactions } from './RecentTransactions'

export function DashboardContent({ data }) {
  return (
    <div className="space-y-6">
      <OverviewStats data={data} />
      <div className="grid gap-6 xl:grid-cols-3">
        <CollectionChart series={data.series} period={data.period} />
        <PerformanceChart period={data.period} />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-3">
        <RecentTransactions transactions={data.transactions} />
        <div className="space-y-6">
          <CollectionSummary data={data} />
          <OverdueAlerts items={data.overdue} total={data.overdueTotal} />
        </div>
      </div>
    </div>
  )
}
