export function formatDisplayDate(isoDate) {
  return formatCalendarDate(isoDate, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDayMonth(isoDate) {
  return formatCalendarDate(isoDate, {
    day: 'numeric',
    month: 'short',
  })
}

export function formatLongDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date)
}

export function formatTime(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(date)
}

function formatCalendarDate(isoDate, options) {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return isoDate

  return new Intl.DateTimeFormat('en-IN', {
    ...options,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}
