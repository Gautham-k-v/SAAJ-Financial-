import { Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SaajWordmark } from '../brand/SaajMark'
import { actor } from '../../services/access'
import { listAgents, listLoans } from '../../services/loanService'
import { syncOperationalNotices, unreadCount } from '../../services/notificationService'
import { formatDisplayDate } from '../../utils/datetime'
import { LOAN_BOOK_DATE } from '../../utils/loans'

export function AgentHeader() {
  const session = actor()
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    syncOperationalNotices(listLoans(), listAgents())
    setRevision((value) => value + 1)
  }, [])
  const unread = session.accountId ? unreadCount(session.accountId) : 0
  return (
    <header className="mb-5 flex items-start justify-between gap-3" data-revision={revision}>
      <SaajWordmark />
      <div className="flex items-start gap-3">
        <Link to="/agent/notifications" aria-label={unread ? `Notices, ${unread} unread` : 'Notices'} className="relative grid h-11 w-11 place-items-center rounded-xl text-navy-900">
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unread > 0 ? <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-teal-700 px-1 text-[10px] font-semibold text-white">{unread > 9 ? '9+' : unread}</span> : null}
        </Link>
        <div className="text-right">
          <p className="text-sm font-semibold text-navy-900">{session.name}</p>
          <p className="text-xs text-slate-500">{formatDisplayDate(LOAN_BOOK_DATE)}</p>
        </div>
      </div>
    </header>
  )
}
