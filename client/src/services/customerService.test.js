import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { createCustomer, getCustomer, listCustomers, updateCustomer } from './customerService.js'
import { CustomerValidationError } from '../utils/customers.js'

class MemoryStorage {
  #items = new Map()

  getItem(key) {
    return this.#items.has(key) ? this.#items.get(key) : null
  }

  setItem(key, value) {
    this.#items.set(key, String(value))
  }
}

const input = {
  fullName: 'Meenakshi Iyer',
  phone: '9841020202',
  alternatePhone: '',
  address: '4, South Mada Street',
  place: 'Mylapore',
  pinCode: '600004',
  photograph: null,
  kycDocuments: [{ key: 'row', type: '', reference: '' }],
  status: 'Active',
}

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage()
})

test('seeds the customer book and assigns the next customer id', () => {
  assert.equal(listCustomers().length, 12)

  const created = createCustomer(input)
  assert.equal(created.id, 'CUS-1609')
  assert.match(created.createdAt, /^\d{4}-\d{2}-\d{2}$/)
  assert.equal(created.kycDocuments.length, 0)
  assert.equal(getCustomer('CUS-1609')?.fullName, 'Meenakshi Iyer')
  assert.equal(listCustomers()[0].id, 'CUS-1609')
})

test('keeps the customer id and created date when a record is edited', () => {
  const original = getCustomer('CUS-1320')
  const updated = updateCustomer('CUS-1320', {
    fullName: 'Kavitha Natarajan',
    phone: '9841013200',
    alternatePhone: '9841213200',
    address: '41, 2nd Avenue, Anna Nagar',
    place: 'Anna Nagar',
    pinCode: '600040',
    photograph: null,
    kycDocuments: [{ key: 'row', type: 'Aadhaar', reference: 'SAMPLE-AADHAAR-1320' }],
    status: 'Inactive',
  })

  assert.equal(updated.id, 'CUS-1320')
  assert.equal(updated.createdAt, original.createdAt)
  assert.equal(updated.status, 'Inactive')
  assert.equal(updated.alternatePhone, '9841213200')
  assert.equal(getCustomer('CUS-1320').status, 'Inactive')
})

test('rejects a customer whose phone is already stored', () => {
  assert.throws(() => createCustomer({ ...input, phone: '9841013200' }), CustomerValidationError)
  assert.equal(getCustomer('CUS-1609'), null)
})
