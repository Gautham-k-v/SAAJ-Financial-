import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Bell, ClipboardList, HandCoins, Landmark, UserRound } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectField } from '../../components/ui/SelectField'
import { TextArea } from '../../components/ui/TextArea'
import { TextField } from '../../components/ui/TextField'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { listAgents, listLoans } from '../../services/loanService'
import {
  currentDeskAdmin,
  hideNotice,
  listForRecipient,
  markAllRead,
  markNoticeRead,
  sendAnnouncement,
  setDeskAdmin,
  syncOperationalNotices,
} from '../../services/notificationService'
import { getSettings } from '../../services/settingsService'
import { formatDisplayDate, formatTime } from '../../utils/datetime'
import { NOTIFICATION_CATEGORIES, filterNotifications, pageNotifications } from '../../utils/notifications'

const icons = {
  Payments: HandCoins,
  Loans: Landmark,
  Collections: ClipboardList,
  Overdue: AlertTriangle,
  Agents: UserRound,
  System: Bell,
}

export default function NotificationsPage() {
  const [revision, setRevision] = useState(0)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('All')
  const [page, setPage] = useState(1)
  const [announcement, setAnnouncement] = useState({ title: '', description: '' })
  const [message, setMessage] = useState('')
  const adminId = currentDeskAdmin()
  useEffect(() => {
    syncOperationalNotices(listLoans(), listAgents())
    setRevision((value) => value + 1)
  }, [])
  const notices = listForRecipient(adminId)
  const visible = filterNotifications(notices, { query, category, status })
  const paged = pageNotifications(visible, page)
  useDocumentTitle('Notifications')

  function refresh() {
    setRevision((value) => value + 1)
  }

  function chooseAdmin(id) {
    setDeskAdmin(id)
    setPage(1)
    refresh()
  }

  return (
    <div className="mx-auto max-w-[1600px]" data-revision={revision}>
      <PageHeader
        eyebrow="Insight"
        title="Notifications"
        description="Notices are kept in this browser, separate from the loan and payment records. Each administrator has their own read state."
        actions={
          <Button variant="secondary" onClick={() => { markAllRead(adminId); refresh() }}>
            Mark all as read
          </Button>
        }
      />
      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <SelectField id="notice-admin" label="Viewing as" value={adminId} onChange={(event) => chooseAdmin(event.target.value)}>
          {getSettings().admins.map((admin) => (
            <option key={admin.id} value={admin.id}>{admin.name}</option>
          ))}
        </SelectField>
        <TextField id="notice-search" label="Search" type="search" value={query} placeholder="Customer, loan, or receipt" onChange={(event) => { setQuery(event.target.value); setPage(1) }} />
        <SelectField id="notice-category" label="Category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1) }}>
          <option value="All">All categories</option>
          {NOTIFICATION_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
        </SelectField>
        <SelectField id="notice-status" label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
          <option value="All">All</option>
          <option value="Unread">Unread</option>
          <option value="Read">Read</option>
        </SelectField>
      </div>
      <p className="mb-4 text-sm text-slate-500" role="status">{paged.total === 1 ? '1 notice' : `${paged.total} notices`}</p>
      {paged.items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState title="No notices" description="Notices appear here when customers, loans, payments, and overdue instalments change. Payment, overdue, reminder, and agent alerts follow the notification preferences." />
        </div>
      ) : (
        <ul className="space-y-3">
          {paged.items.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              onRead={() => { markNoticeRead(adminId, notice.id); refresh() }}
              onHide={() => { hideNotice(adminId, notice.id); refresh() }}
            />
          ))}
        </ul>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        <Button variant="secondary" disabled={paged.page === 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
        <p className="text-sm text-slate-500">Page {paged.page} of {paged.pages}</p>
        <Button variant="secondary" disabled={paged.page === paged.pages} onClick={() => setPage((current) => current + 1)}>Next</Button>
      </div>
      <form
        className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault()
          const count = sendAnnouncement({ ...announcement, agentIds: listAgents().filter((agent) => agent.status !== 'Inactive').map((agent) => agent.id) })
          setMessage(count ? 'Announcement saved in this browser for the administrators and active agents.' : 'Enter a title and a message.')
          setAnnouncement({ title: '', description: '' })
          refresh()
        }}
      >
        <h2 className="text-sm font-semibold text-navy-900">Admin announcement</h2>
        <TextField id="announcement-title" label="Title" value={announcement.title} onChange={(event) => setAnnouncement((current) => ({ ...current, title: event.target.value }))} />
        <TextArea id="announcement-body" label="Message" value={announcement.description} onChange={(event) => setAnnouncement((current) => ({ ...current, description: event.target.value }))} />
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit">Send announcement</Button>
          <Link to="/settings/notifications" className="inline-flex h-11 items-center text-sm font-semibold text-teal-800">Notification preferences</Link>
        </div>
      </form>
    </div>
  )
}

export function NoticeCard({ notice, onRead, onHide }) {
  const Icon = icons[notice.category] || Bell
  return (
    <li className={`rounded-2xl border bg-white p-4 shadow-sm ${notice.read ? 'border-slate-200' : 'border-teal-200'}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${notice.read ? 'bg-slate-100 text-slate-500' : 'bg-teal-50 text-teal-800'}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm text-navy-900 ${notice.read ? 'font-medium' : 'font-semibold'}`}>{notice.title}</p>
            <Badge tone={notice.read ? 'slate' : 'teal'}>{notice.read ? 'Read' : 'Unread'}</Badge>
            <Badge tone="navy">{notice.category}</Badge>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-600">{notice.description}</p>
          <p className="mt-2 text-xs text-slate-500">
            {notice.id} · {formatDisplayDate(notice.at.slice(0, 10))} · {formatTime(notice.at)}
            {notice.customerName ? ` · ${notice.customerName}` : ''}
            {notice.loanId ? ` · ${notice.loanId}` : ''}
            {notice.transactionId ? ` · ${notice.transactionId}` : ''}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {notice.read ? null : <Button size="sm" variant="secondary" onClick={onRead}>Mark as read</Button>}
            <Button size="sm" variant="secondary" onClick={onHide}>Remove</Button>
          </div>
        </div>
      </div>
    </li>
  )
}
