import { useLocation } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { adminNavItems } from '../../config/navigation'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

export default function ModulePendingPage() {
  const { pathname } = useLocation()
  const item = adminNavItems.find((entry) => entry.to === pathname)
  const title = item?.label ?? 'Module'
  useDocumentTitle(title)

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Later stage" title={title} description={item?.description} />
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white">
        <EmptyState
          title="This module is not in the current build"
          description="The navigation is in place so the desk can be reviewed. Records for this section will be added after the dashboard is approved."
        />
      </div>
    </div>
  )
}
