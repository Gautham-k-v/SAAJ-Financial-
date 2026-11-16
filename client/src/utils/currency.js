function assertPaise(paise) {
  if (!Number.isInteger(paise)) {
    throw new Error('Amount must be an integer number of paise.')
  }
}

function rupeeFormatter(fractionDigits) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export function formatPaise(paise) {
  assertPaise(paise)
  const fractionDigits = paise % 100 === 0 ? 0 : 2
  return rupeeFormatter(fractionDigits).format(paise / 100)
}

export function formatPaiseCompact(paise) {
  assertPaise(paise)
  const rupees = paise / 100
  const absolute = Math.abs(rupees)
  const sign = rupees < 0 ? '-' : ''

  if (absolute >= 10000000) {
    return `${sign}₹${trimNumber(absolute / 10000000)}Cr`
  }

  if (absolute >= 100000) {
    return `${sign}₹${trimNumber(absolute / 100000)}L`
  }

  if (absolute >= 1000) {
    return `${sign}₹${trimNumber(absolute / 1000)}k`
  }

  return formatPaise(paise)
}

export function formatPercent(ratio) {
  if (!Number.isFinite(ratio)) return '0%'
  return new Intl.NumberFormat('en-IN', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(ratio)
}

export function formatCount(value) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)
}

/** Accepts rupee text such as "12,000.50" and returns integer paise. */
export function parseRupeesToPaise(value) {
  const cleaned = String(value ?? '').trim().replace(/[₹,\s]/g, '')
  if (!cleaned) return { error: 'Enter an amount.' }
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return { error: 'Enter the amount in rupees, with up to 2 decimal places.' }
  }

  const [whole, fraction = ''] = cleaned.split('.')
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(paise)) return { error: 'Enter a smaller amount.' }
  return { paise }
}

export function formatRupeeInput(paise) {
  assertPaise(paise)
  const sign = paise < 0 ? '-' : ''
  const absolute = Math.abs(paise)
  const whole = Math.trunc(absolute / 100)
  const fraction = absolute % 100
  if (fraction === 0) return `${sign}${whole}`
  return `${sign}${whole}.${String(fraction).padStart(2, '0')}`
}

function trimNumber(value) {
  return value.toFixed(1).replace(/\.0$/, '')
}
