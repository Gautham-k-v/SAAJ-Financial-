import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, HandCoins, Landmark, Wallet } from 'lucide-react'
import { SaajWordmark } from '../../components/brand/SaajMark'
import { CollectionChart } from '../../components/dashboard/CollectionChart'
import { LoanStatusBadge } from '../../components/loans/LoanStatusBadge'
import { ReportChart } from '../../components/reports/ReportChart'
import { ErrorState } from '../../components/ui/ErrorState'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectField } from '../../components/ui/SelectField'
import { StatCard } from '../../components/ui/StatCard'
import { TextField } from '../../components/ui/TextField'
import { Button } from '../../components/ui/Button'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { actor } from '../../services/access'
import { listAgents, listLoans } from '../../services/loanService'
import { formatCount, formatPaise, formatPercent } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/datetime'
import { LOAN_BOOK_DATE } from '../../utils/loans'
import { buildReportPdf } from '../../utils/reportPdf'
import {
  REPORT_PRESETS,
  agentPerformance,
  bookPosition,
  dailyReport,
  dailySeries,
  monthlySeries,
  paymentBreakdown,
  periodCollections,
  rangeForPreset,
  reportCsv,
} from '../../utils/reports'

const sections = [
  ['overview', 'Overview'],
  ['daily', 'Daily'],
  ['monthly', 'Monthly'],
  ['loans', 'Loans'],
  ['agents', 'Agents'],
  ['payments', 'Payments'],
]

export default function ReportsPage() {
  const [params, setParams] = useSearchParams()
  const section = sections.some(([id]) => id === params.get('section')) ? params.get('section') : 'overview'
  const preset = REPORT_PRESETS.some((item) => item.id === params.get('preset')) ? params.get('preset') : 'today'
  const range = rangeForPreset(preset, LOAN_BOOK_DATE, { from: params.get('from') || '', to: params.get('to') || '' })
  const day = params.get('day') || range.to
  const loans = listLoans()
  const agents = listAgents()
  const position = bookPosition(loans, range.to)
  const period = periodCollections(loans, range.from, range.to)
  const daily = dailyReport(loans, day)
  const series = dailySeries(loans, day)
  const year = Number(params.get('year') || range.to.slice(0, 4))
  const months = monthlySeries(loans, year)
  const selectedMonth = months.find((point) => point.key === range.to.slice(0, 7)) || months.at(-1)
  const performers = agentPerformance(loans, agents, range.from, range.to)
  const methods = paymentBreakdown(loans, range.from, range.to)
  const periodLabel = range.from === range.to ? formatDisplayDate(range.from) : `${formatDisplayDate(range.from)} – ${formatDisplayDate(range.to)}`
  useDocumentTitle('Reports')

  if (actor().role === 'agent') {
    return <ErrorState title="Reports are not available" message="Collection agents cannot open the business reports." />
  }

  function update(next) {
    const following = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (!value) following.delete(key)
      else following.set(key, value)
    }
    setParams(following)
  }

  function exportRows() {
    const money = (paise) => formatPaise(paise)
    if (section === 'daily') {
      return [
        ['Date', formatDisplayDate(day)],
        ['Expected collection', money(daily.expected)],
        ['Actual collection', money(daily.collected)],
        ['Pending collection', money(daily.pending)],
        ['Collection percentage', formatPercent(daily.percentage)],
        ['Customers collected', String(daily.customersCollected)],
        ['Pending customers', String(daily.customersPending)],
      ]
    }
    if (section === 'monthly') {
      return [
        ['Month', selectedMonth?.label || String(year)],
        ['Collected', money(selectedMonth?.collected || 0)],
        ['Disbursed', money(selectedMonth?.disbursed || 0)],
        ['Outstanding', money(selectedMonth?.outstanding || 0)],
        ['Collection percentage', formatPercent(selectedMonth?.percentage || 0)],
      ]
    }
    if (section === 'loans') {
      return [
        ['Active loans', String(position.active)],
        ['Completed loans', String(position.completed)],
        ['Overdue loans', String(position.overdue)],
        ['Principal disbursed', money(position.principal)],
        ['Agreed repayment', money(position.agreed)],
        ['Remaining repayment', money(position.outstanding)],
      ]
    }
    if (section === 'agents') {
      return performers.flatMap((agent) => [
        [agent.name, ''],
        ['Assigned customers', String(agent.customers)],
        ['Target', money(agent.target)],
        ['Collected', money(agent.collected)],
        ['Pending', money(agent.pending)],
        ['Successful collections', String(agent.successful)],
        ['Collection percentage', formatPercent(agent.percentage)],
      ])
    }
    if (section === 'payments') {
      return methods.flatMap((method) => [
        [method.method, ''],
        ['Amount', money(method.amount)],
        ['Transactions', String(method.count)],
      ])
    }
    return [
      ['Total principal disbursed', money(position.principal)],
      ['Total amount collected', money(period.collected)],
      ['Total outstanding', money(position.outstanding)],
      ['Total finance charges', money(position.finance)],
      ['Active loans', String(position.active)],
      ['Completed loans', String(position.completed)],
      ['Overdue loans', String(position.overdue)],
    ]
  }

  function downloadPdf() {
    const bytes = buildReportPdf({
      title: sections.find(([id]) => id === section)?.[1] || 'Overview',
      period: periodLabel,
      rows: exportRows().map(([label, value]) => ({ label, value: String(value).replaceAll('₹', 'Rs. ') })),
    })
    saveFile(bytes, `saaj-report-${section}.pdf`, 'application/pdf')
  }

  function downloadCsv() {
    const rows = [['SAAJ report', sections.find(([id]) => id === section)?.[1]], ['Period', periodLabel], ...exportRows()]
    saveFile(new TextEncoder().encode(reportCsv(rows)), `saaj-report-${section}.csv`, 'text/csv')
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="saaj-app-chrome">
        <PageHeader
          eyebrow="Insight"
          title="Reports"
          description="Figures are calculated from the loan book and its payment records. Reversed receipts are left out of collection totals."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={downloadPdf}>Download PDF</Button>
              <Button variant="secondary" onClick={() => window.print()}>Print</Button>
              <Button variant="secondary" onClick={downloadCsv}>Export CSV</Button>
            </div>
          }
        />
        <div className="mb-4 flex flex-wrap gap-2">
          {sections.map(([id, label]) => (
            <Button key={id} variant={section === id ? 'primary' : 'secondary'} size="sm" onClick={() => update({ section: id === 'overview' ? '' : id })}>
              {label}
            </Button>
          ))}
        </div>
        <div className="mb-6 flex flex-wrap gap-2">
          {REPORT_PRESETS.map((item) => (
            <Button key={item.id} variant={preset === item.id ? 'primary' : 'secondary'} size="sm" onClick={() => update({ preset: item.id === 'today' ? '' : item.id, from: '', to: '' })}>
              {item.label}
            </Button>
          ))}
        </div>
        {preset === 'custom' ? (
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <TextField id="report-from" label="From" type="date" value={params.get('from') || range.from} onChange={(event) => update({ preset: 'custom', from: event.target.value })} />
            <TextField id="report-to" label="To" type="date" value={params.get('to') || range.to} onChange={(event) => update({ preset: 'custom', to: event.target.value })} />
          </div>
        ) : null}
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <SaajWordmark />
        <p className="text-sm font-medium text-slate-600">{periodLabel}</p>
      </div>

      {section === 'overview' ? <Overview position={position} period={period} /> : null}
      {section === 'daily' ? (
        <Daily
          daily={daily}
          series={series}
          day={day}
          onDay={(value) => update({ day: value })}
        />
      ) : null}
      {section === 'monthly' ? (
        <Monthly
          year={year}
          months={months}
          selected={selectedMonth}
          onYear={(value) => update({ year: value })}
          onMonth={(monthKey) => {
            const end = monthEndFromKey(monthKey)
            update({
              preset: 'custom',
              from: `${monthKey}-01`,
              to: end > LOAN_BOOK_DATE ? LOAN_BOOK_DATE : end,
              year: monthKey.slice(0, 4),
            })
          }}
        />
      ) : null}
      {section === 'loans' ? <Loans position={position} /> : null}
      {section === 'agents' ? <Agents rows={performers} /> : null}
      {section === 'payments' ? <Payments rows={methods} /> : null}
    </div>
  )
}

function Overview({ position, period }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard label="Total principal disbursed" value={formatPaise(position.principal)} hint={`Funded contracts as of ${formatDisplayDate(position.asOf)}`} icon={Wallet} tone="navy" />
      <StatCard label="Total amount collected" value={formatPaise(period.collected)} hint="Successful receipts in the selected period" icon={HandCoins} tone="teal" />
      <StatCard label="Total outstanding" value={formatPaise(position.outstanding)} hint={`Remaining repayment as of ${formatDisplayDate(position.asOf)}`} icon={Landmark} tone="amber" />
      <StatCard label="Total finance charges" value={formatPaise(position.finance)} hint="Agreed finance on funded contracts" icon={Wallet} tone="navy" />
      <StatCard label="Active loans" value={formatCount(position.active)} hint="Includes loans shown as overdue" icon={Landmark} tone="teal" />
      <StatCard label="Completed loans" value={formatCount(position.completed)} hint="Fully repaid contracts" icon={CheckCircle2} tone="navy" />
      <StatCard label="Overdue loans" value={formatCount(position.overdue)} hint="Active loans with a missed instalment" icon={AlertTriangle} tone="amber" />
    </div>
  )
}

function Daily({ daily, series, day, onDay }) {
  const period = {
    from: series[0]?.date,
    to: series.at(-1)?.date,
    expected: series.reduce((sum, point) => sum + point.expected, 0),
    collected: series.reduce((sum, point) => sum + point.collected, 0),
  }
  return (
    <div className="space-y-6">
      <div className="saaj-app-chrome max-w-xs">
        <TextField id="report-day" label="Collection date" type="date" value={day} onChange={(event) => onDay(event.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Expected collection" value={formatPaise(daily.expected)} hint="Instalments due on this date" icon={Wallet} />
        <StatCard label="Actual collection" value={formatPaise(daily.collected)} hint="Receipts posted on this date" icon={HandCoins} tone="teal" />
        <StatCard label="Pending collection" value={formatPaise(daily.pending)} hint="Expected minus receipts" icon={Landmark} tone="amber" />
        <StatCard label="Collection percentage" value={formatPercent(daily.percentage)} hint="Actual divided by expected" icon={CheckCircle2} tone="teal" />
        <StatCard label="Customers collected" value={formatCount(daily.customersCollected)} hint="Customers with a receipt on this date" icon={HandCoins} />
        <StatCard label="Pending customers" value={formatCount(daily.customersPending)} hint="Due today and not fully covered" icon={AlertTriangle} tone="amber" />
      </div>
      <CollectionChart series={series} period={period} />
    </div>
  )
}

function Monthly({ year, months, selected, onYear, onMonth }) {
  const years = []
  for (let value = 2026; value <= Number(LOAN_BOOK_DATE.slice(0, 4)); value += 1) years.push(value)
  return (
    <div className="space-y-6">
      <div className="saaj-app-chrome grid gap-3 sm:grid-cols-2">
        <SelectField id="report-year" label="Year" value={String(year)} onChange={(event) => onYear(event.target.value)}>
          {years.map((value) => <option key={value} value={value}>{value}</option>)}
        </SelectField>
        <SelectField id="report-month" label="Month" value={selected?.key || ''} onChange={(event) => onMonth(event.target.value)}>
          {months.map((point) => <option key={point.key} value={point.key}>{point.label}</option>)}
        </SelectField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Monthly collection" value={formatPaise(selected?.collected || 0)} hint={selected?.label || ''} icon={HandCoins} tone="teal" />
        <StatCard label="Loan disbursements" value={formatPaise(selected?.disbursed || 0)} hint="Principal of contracts started in the month" icon={Wallet} />
        <StatCard label="Outstanding" value={formatPaise(selected?.outstanding || 0)} hint="Book balance at the month end" icon={Landmark} tone="amber" />
        <StatCard label="Collection performance" value={formatPercent(selected?.percentage || 0)} hint="Collected divided by the month’s expected book" icon={CheckCircle2} tone="teal" />
      </div>
      <ReportChart
        title="Monthly comparison"
        description="Collections and principal disbursed in each month of the selected year."
        data={months}
        bars={[{ key: 'collected', name: 'Collected', fill: '#0f766e' }, { key: 'disbursed', name: 'Disbursed', fill: '#0c2341' }]}
      />
      <ReportChart
        title="Outstanding trend"
        description="Remaining repayment at the end of each month."
        data={months}
        bars={[{ key: 'outstanding', name: 'Outstanding', fill: '#b45309' }]}
      />
    </div>
  )
}

function Loans({ position }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Active loans" value={formatCount(position.active)} hint="Open contracts" icon={Landmark} tone="teal" />
        <StatCard label="Completed loans" value={formatCount(position.completed)} hint="Fully repaid" icon={CheckCircle2} />
        <StatCard label="Overdue loans" value={formatCount(position.overdue)} hint="A missed instalment is still open" icon={AlertTriangle} tone="amber" />
        <StatCard label="Principal disbursed" value={formatPaise(position.principal)} hint="Funded contracts" icon={Wallet} />
        <StatCard label="Agreed repayment" value={formatPaise(position.agreed)} hint="Principal plus finance charge" icon={Wallet} />
        <StatCard label="Remaining repayment" value={formatPaise(position.outstanding)} hint="Outstanding on the funded book" icon={Landmark} tone="amber" />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 font-medium">Loan</th>
              <th className="px-3 py-3 font-medium">Customer</th>
              <th className="px-3 py-3 font-medium">Principal</th>
              <th className="px-3 py-3 font-medium">Agreed</th>
              <th className="px-3 py-3 font-medium">Outstanding</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {position.loans.map((loan) => (
              <tr key={loan.id} className="border-b border-slate-100 last:border-0">
                <td className="px-5 py-3 font-semibold text-navy-900">{loan.id}</td>
                <td className="px-3 py-3 text-slate-600">{loan.customerName}</td>
                <td className="px-3 py-3 tabular-nums text-slate-600">{formatPaise(loan.principal)}</td>
                <td className="px-3 py-3 tabular-nums text-slate-600">{formatPaise(loan.totalRepayment)}</td>
                <td className="px-3 py-3 font-medium tabular-nums text-navy-900">{formatPaise(loan.outstanding)}</td>
                <td className="px-5 py-3"><LoanStatusBadge status={loan.displayStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Agents({ rows }) {
  return (
    <div className="space-y-6">
      <ReportChart
        title="Agent comparison"
        description="Successful receipts on each agent’s assigned loans in the selected period."
        data={rows.map((agent) => ({ label: agent.name.split(' ')[0], collected: agent.collected }))}
        bars={[{ key: 'collected', name: 'Collected', fill: '#0f766e' }]}
      />
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 font-medium">Agent</th>
              <th className="px-3 py-3 font-medium">Customers</th>
              <th className="px-3 py-3 font-medium">Target</th>
              <th className="px-3 py-3 font-medium">Collected</th>
              <th className="px-3 py-3 font-medium">Pending</th>
              <th className="px-3 py-3 font-medium">Receipts</th>
              <th className="px-5 py-3 font-medium">Rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((agent) => (
              <tr key={agent.id} className="border-b border-slate-100 last:border-0">
                <td className="px-5 py-3 font-semibold text-navy-900">{agent.name}</td>
                <td className="px-3 py-3 tabular-nums text-slate-600">{agent.customers}</td>
                <td className="px-3 py-3 tabular-nums text-slate-600">{formatPaise(agent.target)}</td>
                <td className="px-3 py-3 tabular-nums text-slate-600">{formatPaise(agent.collected)}</td>
                <td className="px-3 py-3 tabular-nums text-slate-600">{formatPaise(agent.pending)}</td>
                <td className="px-3 py-3 tabular-nums text-slate-600">{agent.successful}</td>
                <td className="px-5 py-3 font-medium text-navy-900">{formatPercent(agent.percentage)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Payments({ rows }) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  const count = rows.reduce((sum, row) => sum + row.count, 0)
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {rows.map((row) => (
          <StatCard key={row.method} label={row.method} value={formatPaise(row.amount)} hint={`${formatCount(row.count)} receipts`} icon={HandCoins} tone={row.method === 'Cash' ? 'teal' : 'navy'} />
        ))}
      </div>
      <p className="text-sm text-slate-600">
        {formatPaise(total)} across {formatCount(count)} successful receipts. Reversed receipts are excluded.
      </p>
      <ReportChart
        title="Payment methods"
        description="Cash, UPI, and bank transfer for the selected period."
        data={rows.map((row) => ({ label: row.method, amount: row.amount }))}
        bars={[{ key: 'amount', name: 'Amount', fill: '#0c2341' }]}
      />
    </div>
  )
}

function monthEndFromKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  const next = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`
  const end = new Date(`${next}T00:00:00Z`)
  end.setUTCDate(end.getUTCDate() - 1)
  return end.toISOString().slice(0, 10)
}

function saveFile(bytes, name, type) {
  const url = URL.createObjectURL(new Blob([bytes], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}
