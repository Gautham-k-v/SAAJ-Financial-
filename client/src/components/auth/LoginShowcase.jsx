import { getDashboardSnapshot } from '../../services/collectionService'
import { formatPaise, formatPercent } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/datetime'
import { buildDashboardView } from '../../utils/dashboardView'
import { SaajWordmark } from '../brand/SaajMark'

const principles = [
  'Daily instalments stay on their own schedule.',
  'Receipts are stored as separate transactions.',
  'Four administrators share one lending book.',
]

export function LoginShowcase() {
  const preview = buildDashboardView(getDashboardSnapshot())
  const rate = Math.min(preview.collectionRate, 1) * 100

  return (
    <section className="relative hidden overflow-hidden bg-navy-950 text-white lg:flex">
      <div className="saaj-grid absolute inset-0" />
      <div className="pointer-events-none absolute -left-16 top-24 h-64 w-64 rounded-full bg-teal-400/15 blur-3xl" />
      <div className="relative flex w-full flex-col justify-between p-12 xl:p-16">
        <div>
          <SaajWordmark light markTone="teal" />
          <p className="mt-16 text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">
            Daily loan collections
          </p>
          <h2 className="mt-4 max-w-md text-4xl font-semibold tracking-tight">
            The day’s book, before the round begins.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
            SAAJ keeps customers, the daily schedule, and the money actually received in separate
            records for one lending business.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            {principles.map((principle) => (
              <li key={principle} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" />
                <span>{principle}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
            Loan book · {formatDisplayDate(preview.asOf)}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
            {formatPaise(preview.book.collectedToday)}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            collected of {formatPaise(preview.book.expectedToday)} expected · {formatPercent(preview.collectionRate)}
          </p>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
            role="img"
            aria-label={`${formatPercent(preview.collectionRate)} of the sample book collected`}
          >
            <div className="h-full rounded-full bg-teal-400" style={{ width: `${rate}%` }} />
          </div>
          <p className="mt-3 text-xs text-slate-400">Calculated from the loan book on this browser.</p>
        </div>
      </div>
    </section>
  )
}
