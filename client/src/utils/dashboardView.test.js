import assert from 'node:assert/strict'
import test from 'node:test'
import { dashboardMock } from '../data/dashboardMock.js'
import { formatTime } from './datetime.js'
import { buildDashboardView } from './dashboardView.js'

test('builds a reconciled view of the sample book', () => {
  const view = buildDashboardView(dashboardMock)

  assert.equal(view.pendingToday, 5775000)
  assert.equal(view.advanceToday, 0)
  assert.equal(view.collectionRate, 12675000 / 18450000)
  assert.equal(view.overdueTotal, 730000)
  assert.equal(view.period.to, '2026-11-16')
  assert.ok(view.period.collected < view.period.expected)
  assert.equal(view.period.rate, view.period.collected / view.period.expected)
})

test('treats receipts above the daily book as advance', () => {
  const collectedToday = dashboardMock.book.expectedToday + 50000
  const view = buildDashboardView({
    ...dashboardMock,
    book: {
      ...dashboardMock.book,
      collectedToday,
    },
    channels: [{ method: 'Cash', amount: collectedToday }],
    series: dashboardMock.series.map((point, index) =>
      index === dashboardMock.series.length - 1 ? { ...point, collected: collectedToday } : point,
    ),
    transactions: [],
  })

  assert.equal(view.pendingToday, 0)
  assert.equal(view.advanceToday, 50000)
})

test('refuses a book where the channels do not match collected cash', () => {
  assert.throws(
    () =>
      buildDashboardView({
        ...dashboardMock,
        channels: [{ method: 'Cash', amount: 100 }],
      }),
    /do not add up/,
  )
})

test('refuses a zero-day chart', () => {
  assert.throws(
    () =>
      buildDashboardView({
        ...dashboardMock,
        series: [],
      }),
    /at least one day/,
  )
})

test('formats receipt times in India time', () => {
  assert.match(formatTime('2026-11-16T10:36:00+05:30').toLowerCase(), /10:36/)
  assert.equal(formatTime('not-a-time'), '—')
})
