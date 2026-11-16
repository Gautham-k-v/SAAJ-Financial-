import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatCount,
  formatPaise,
  formatPaiseCompact,
  formatPercent,
  formatRupeeInput,
  parseRupeesToPaise,
} from './currency.js'

function digits(value) {
  return value.replace(/[\s\u00A0]/g, '')
}

test('formats whole rupees from paise in Indian grouping', () => {
  assert.equal(digits(formatPaise(18450000)), '₹1,84,500')
  assert.equal(digits(formatPaise(421860000)), '₹42,18,600')
})

test('keeps paise when the amount is not a whole rupee', () => {
  assert.equal(digits(formatPaise(50)), '₹0.50')
})

test('rejects amounts that are not integer paise', () => {
  assert.throws(() => formatPaise(10.5), /integer number of paise/)
  assert.throws(() => formatPaise(null), /integer number of paise/)
})

test('compacts chart axis amounts in lakhs', () => {
  assert.equal(formatPaiseCompact(18450000), '₹1.8L')
  assert.equal(formatPaiseCompact(8420000), '₹84.2k')
})

test('formats a collection rate to one decimal', () => {
  assert.equal(formatPercent(12675000 / 18450000), '68.7%')
})

test('formats counts with Indian grouping', () => {
  assert.equal(formatCount(1740), '1,740')
})

test('parses rupee text into integer paise', () => {
  assert.deepEqual(parseRupeesToPaise('12,000'), { paise: 1200000 })
  assert.deepEqual(parseRupeesToPaise('₹10.5'), { paise: 1050 })
  assert.equal(parseRupeesToPaise('10.555').error.includes('2 decimal'), true)
  assert.equal(parseRupeesToPaise('-5').error.includes('rupees'), true)
  assert.equal(formatRupeeInput(120000), '1200')
  assert.equal(formatRupeeInput(1050), '10.50')
})
