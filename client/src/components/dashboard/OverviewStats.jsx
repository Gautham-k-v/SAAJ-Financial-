import { CalendarCheck, Clock3, HandCoins, Landmark, Users, Wallet } from 'lucide-react'
import { StatCard } from '../ui/StatCard'
import { formatCount, formatPaise, formatPercent } from '../../utils/currency'

export function OverviewStats({ data }) {
  const cards = [
    {
      key: 'expected',
      label: 'Today’s expected collection',
      value: formatPaise(data.book.expectedToday),
      hint: `${formatCount(data.book.instalmentsDue)} instalments due`,
      icon: CalendarCheck,
      tone: 'navy',
    },
    {
      key: 'collected',
      label: 'Collected today',
      value: formatPaise(data.book.collectedToday),
      hint: `${formatPercent(data.collectionRate)} of today’s book`,
      icon: HandCoins,
      tone: 'teal',
    },
    {
      key: 'pending',
      label: 'Pending collection',
      value: formatPaise(data.pendingToday),
      hint: data.advanceToday > 0 ? 'Today’s book is fully covered' : 'Not yet received today',
      icon: Clock3,
      tone: 'amber',
    },
    {
      key: 'outstanding',
      label: 'Total outstanding',
      value: formatPaise(data.book.outstanding),
      hint: `Across ${formatCount(data.book.activeLoans)} open loans`,
      icon: Landmark,
      tone: 'navy',
    },
    {
      key: 'customers',
      label: 'Active customers',
      value: formatCount(data.book.activeCustomers),
      hint: 'With a live loan',
      icon: Users,
      tone: 'teal',
    },
    {
      key: 'loans',
      label: 'Active loans',
      value: formatCount(data.book.activeLoans),
      hint: 'Daily repayment loans',
      icon: Wallet,
      tone: 'navy',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <StatCard
          key={card.key}
          label={card.label}
          value={card.value}
          hint={card.hint}
          icon={card.icon}
          tone={card.tone}
        />
      ))}
    </div>
  )
}
