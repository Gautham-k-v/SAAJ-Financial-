import { Link } from 'react-router-dom'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { PageHeader } from '../../components/ui/PageHeader'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="SAAJ"
        title="This page is not part of the desk"
        description="The address does not match a SAAJ screen."
      />
      <Link to="/dashboard" className={buttonClasses()}>
        Back to dashboard
      </Link>
    </div>
  )
}
