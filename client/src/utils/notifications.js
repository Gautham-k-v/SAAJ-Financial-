export const NOTIFICATION_CATEGORIES = ['Payments', 'Loans', 'Collections', 'Overdue', 'Agents', 'System']

export const NOTIFICATION_PAGE_SIZE = 8

export function filterNotifications(items, { query = '', category = 'All', status = 'All' } = {}) {
  const text = query.trim().toLocaleLowerCase('en-IN')
  return items.filter((item) => {
    if (category !== 'All' && item.category !== category) return false
    if (status === 'Unread' && item.read) return false
    if (status === 'Read' && !item.read) return false
    if (!text) return true
    return [item.id, item.title, item.description, item.customerName, item.loanId, item.transactionId]
      .join(' ')
      .toLocaleLowerCase('en-IN')
      .includes(text)
  })
}

export function pageNotifications(items, page, size = NOTIFICATION_PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(Math.max(page, 1), pages)
  const start = (current - 1) * size
  return { items: items.slice(start, start + size), page: current, pages, total: items.length }
}

export function preferenceAllows(category, preferences) {
  if (category === 'Payments') return preferences.payment !== false
  if (category === 'Overdue') return preferences.overdue !== false
  if (category === 'Collections') return preferences.daily !== false
  if (category === 'Agents') return preferences.agent !== false
  return true
}
