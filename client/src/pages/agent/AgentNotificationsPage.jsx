import { useState } from 'react'
import { AgentHeader } from '../../components/agent/AgentHeader'
import { NoticeCard } from '../admin/NotificationsPage'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { SelectField } from '../../components/ui/SelectField'
import { TextField } from '../../components/ui/TextField'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { actor } from '../../services/access'
import { hideNotice, listForRecipient, markAllRead, markNoticeRead } from '../../services/notificationService'
import { NOTIFICATION_CATEGORIES, filterNotifications, pageNotifications } from '../../utils/notifications'

export default function AgentNotificationsPage() {
  const session = actor()
  const [revision, setRevision] = useState(0)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('All')
  const [page, setPage] = useState(1)
  const notices = listForRecipient(session.accountId)
  const visible = filterNotifications(notices, { query, category, status })
  const paged = pageNotifications(visible, page)
  useDocumentTitle('Notices')

  function refresh() {
    setRevision((value) => value + 1)
  }

  return (
    <div data-revision={revision}>
      <AgentHeader />
      <div className="mb-4 flex items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Notices</h1>
        <Button size="sm" variant="secondary" onClick={() => { markAllRead(session.accountId); refresh() }}>Mark all read</Button>
      </div>
      <div className="mb-4 space-y-3">
        <TextField id="agent-notice-search" label="Search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} />
        <div className="grid grid-cols-2 gap-3">
          <SelectField id="agent-notice-category" label="Category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1) }}>
            <option value="All">All</option>
            {NOTIFICATION_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </SelectField>
          <SelectField id="agent-notice-status" label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
            <option value="All">All</option>
            <option value="Unread">Unread</option>
            <option value="Read">Read</option>
          </SelectField>
        </div>
      </div>
      {paged.items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState title="No notices" description="Assignments, reminders, and payment confirmations for your round appear here." />
        </div>
      ) : (
        <ul className="space-y-3">
          {paged.items.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              onRead={() => { markNoticeRead(session.accountId, notice.id); refresh() }}
              onHide={() => { hideNotice(session.accountId, notice.id); refresh() }}
            />
          ))}
        </ul>
      )}
      <div className="mt-4 flex items-center justify-between">
        <Button variant="secondary" disabled={paged.page === 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
        <p className="text-sm text-slate-500">{paged.page} / {paged.pages}</p>
        <Button variant="secondary" disabled={paged.page === paged.pages} onClick={() => setPage((current) => current + 1)}>Next</Button>
      </div>
    </div>
  )
}
