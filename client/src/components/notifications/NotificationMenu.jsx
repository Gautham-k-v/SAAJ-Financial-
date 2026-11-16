import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { currentDeskAdmin, listForRecipient, markNoticeRead } from '../../services/notificationService'

export function NotificationMenu() {
  const [open, setOpen] = useState(false)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1)
    window.addEventListener('saaj-desk-admin', refresh)
    return () => window.removeEventListener('saaj-desk-admin', refresh)
  }, [])
  const adminId = currentDeskAdmin()
  const notices = listForRecipient(adminId)
  const unread = notices.filter((notice) => !notice.read).length
  const preview = notices.slice(0, 5)

  return (
    <div className="relative" data-revision={revision}>
      <button
        type="button"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative grid h-10 w-10 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        onClick={() => setOpen((current) => !current)}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-teal-700 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-navy-900">Notifications</p>
            <Link to="/notifications" className="text-sm font-semibold text-teal-800" onClick={() => setOpen(false)}>View all</Link>
          </div>
          {preview.length === 0 ? (
            <p className="px-1 py-4 text-sm text-slate-500">No notices yet.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {preview.map((notice) => (
                <li key={notice.id}>
                  <button
                    type="button"
                    className="w-full rounded-xl px-2 py-2 text-left hover:bg-slate-50"
                    onClick={() => {
                      markNoticeRead(adminId, notice.id)
                      setRevision((value) => value + 1)
                    }}
                  >
                    <p className={`text-sm text-navy-900 ${notice.read ? 'font-medium' : 'font-semibold'}`}>{notice.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{notice.description}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
