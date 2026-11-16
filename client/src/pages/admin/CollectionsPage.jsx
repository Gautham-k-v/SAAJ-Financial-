import { useSearchParams } from 'react-router-dom'
import { CalendarCheck, Clock3, HandCoins, TriangleAlert, Wallet } from 'lucide-react'
import { CollectionList } from '../../components/collections/CollectionList'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectField } from '../../components/ui/SelectField'
import { StatCard } from '../../components/ui/StatCard'
import { TextField } from '../../components/ui/TextField'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { getCollectionBook, visibleCollections } from '../../services/collectionService'
import { COLLECTION_STATUSES } from '../../utils/collections'
import { formatPaise, formatPercent } from '../../utils/currency'
import { LOAN_BOOK_DATE } from '../../utils/loans'

export default function CollectionsPage() {
  const [params, setParams] = useSearchParams()
  const date = params.get('date') || LOAN_BOOK_DATE
  const query = params.get('q') || ''
  const status = params.get('status') || 'All'
  const agentId = params.get('agent') || ''
  const book = getCollectionBook(date)
  const rows = visibleCollections(book.rows, { query, status, agentId })
  useDocumentTitle('Daily Collections')

  function update(next) {
    const following = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === 'All') following.delete(key)
      else following.set(key, value)
    }
    setParams(following)
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        eyebrow="Book"
        title="Daily collections"
        description="Instalments due on the selected date, plus anything still open from earlier days. These totals are the same figures shown on the dashboard."
        actions={
          <TextField
            id="collection-date"
            label="Collection date"
            type="date"
            value={date}
            onChange={(event) => update({ date: event.target.value })}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Today’s expected collection"
          value={formatPaise(book.summary.expected)}
          hint={`${book.summary.instalmentsDue} instalments due`}
          icon={CalendarCheck}
          tone="navy"
        />
        <StatCard
          label="Total collected today"
          value={formatPaise(book.summary.collected)}
          hint={`${formatPercent(book.summary.percentage)} of the day’s book`}
          icon={HandCoins}
          tone="teal"
        />
        <StatCard
          label="Pending collection"
          value={formatPaise(book.summary.pending)}
          hint={book.summary.advance > 0 ? 'Received more than the day’s book' : 'Not yet received for this date'}
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Overdue amount"
          value={formatPaise(book.summary.overdueAmount)}
          hint="Still open from earlier due dates"
          icon={TriangleAlert}
          tone="amber"
        />
        <StatCard
          label="Collection percentage"
          value={formatPercent(book.summary.percentage)}
          hint="Payments received on this date ÷ expected"
          icon={Wallet}
          tone="teal"
        />
      </div>

      <div className="my-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <TextField
          id="collection-search"
          label="Search"
          type="search"
          value={query}
          placeholder="Customer name or phone number"
          onChange={(event) => update({ q: event.target.value })}
        />
        <SelectField id="collection-status" label="Status" value={status} onChange={(event) => update({ status: event.target.value })}>
          <option value="All">All</option>
          {COLLECTION_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
        <SelectField id="collection-agent" label="Collection agent" value={agentId} onChange={(event) => update({ agent: event.target.value })}>
          <option value="">All agents</option>
          {book.agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </SelectField>
      </div>

      <p className="mb-4 text-sm text-slate-500" role="status">
        {rows.length === 1 ? '1 instalment' : `${rows.length} instalments`}
      </p>
      <CollectionList rows={rows} date={date} />
    </div>
  )
}
