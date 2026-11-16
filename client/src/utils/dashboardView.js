function assertPaise(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer number of paise.`)
  }
}

function ratio(part, whole) {
  if (whole === 0) return 0
  return part / whole
}

export function buildDashboardView(data) {
  assertPaise(data.book.expectedToday, 'Today’s expected collection')
  assertPaise(data.book.collectedToday, 'Collected today')
  assertPaise(data.book.outstanding, 'Total outstanding')

  const channelTotal = data.channels.reduce((sum, channel) => {
    assertPaise(channel.amount, channel.method)
    return sum + channel.amount
  }, 0)

  if (channelTotal !== data.book.collectedToday) {
    throw new Error('Payment channels do not add up to today’s collected amount.')
  }

  if (data.series.length === 0) {
    throw new Error('The collection chart needs at least one day.')
  }

  for (const point of data.series) {
    assertPaise(point.expected, `Expected on ${point.date}`)
    assertPaise(point.collected, `Collected on ${point.date}`)
  }

  const latest = data.series.at(-1)
  if (
    latest.date !== data.asOf ||
    latest.expected !== data.book.expectedToday ||
    latest.collected !== data.book.collectedToday
  ) {
    throw new Error('Today’s chart point does not match the collection totals.')
  }

  const seenTransactions = new Set()
  const seenReceipts = new Set()
  let receiptTotal = 0

  for (const transaction of data.transactions) {
    assertPaise(transaction.amount, transaction.id)
    if (!transaction.customerId || !transaction.loanId || !transaction.receiptNumber) {
      throw new Error(`Receipt ${transaction.id} is missing an identifier.`)
    }
    if (seenTransactions.has(transaction.id) || seenReceipts.has(transaction.receiptNumber)) {
      throw new Error(`Receipt ${transaction.id} reuses an identifier.`)
    }
    seenTransactions.add(transaction.id)
    seenReceipts.add(transaction.receiptNumber)
    receiptTotal += transaction.amount
  }

  if (receiptTotal > data.book.collectedToday) {
    throw new Error('Listed receipts exceed the amount collected today.')
  }

  let overdueTotal = 0
  for (const item of data.overdue) {
    assertPaise(item.amount, item.loanId)
    overdueTotal += item.amount
  }

  const periodExpected = data.series.reduce((sum, point) => sum + point.expected, 0)
  const periodCollected = data.series.reduce((sum, point) => sum + point.collected, 0)
  const periodShortfall = data.series.reduce(
    (sum, point) => sum + Math.max(point.expected - point.collected, 0),
    0,
  )

  return {
    ...data,
    pendingToday: Math.max(data.book.expectedToday - data.book.collectedToday, 0),
    advanceToday: Math.max(data.book.collectedToday - data.book.expectedToday, 0),
    collectionRate: ratio(data.book.collectedToday, data.book.expectedToday),
    overdueTotal,
    period: {
      from: data.series[0].date,
      to: latest.date,
      expected: periodExpected,
      collected: periodCollected,
      shortfall: periodShortfall,
      rate: ratio(periodCollected, periodExpected),
    },
  }
}
