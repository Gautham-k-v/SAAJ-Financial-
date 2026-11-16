import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createCustomerId,
  filterCustomers,
  hasCustomerErrors,
  validateCustomer,
} from './customers.js'

const existing = [
  {
    id: 'CUS-1048',
    fullName: 'Ramesh Kumar',
    phone: '9841010480',
    alternatePhone: '',
    status: 'Active',
  },
  {
    id: 'CUS-0877',
    fullName: 'Suresh Babu',
    phone: '9841008770',
    alternatePhone: '9841108770',
    status: 'Inactive',
  },
]

const validInput = {
  fullName: 'Geetha Raman',
  phone: '98410 15020',
  alternatePhone: '',
  address: '9, Luz Church Road',
  place: 'Mylapore',
  pinCode: '600004',
  photograph: null,
  kycDocuments: [],
  status: 'Active',
}

test('creates the next customer id without reusing an existing one', () => {
  assert.equal(createCustomerId(['CUS-1048', 'CUS-1320', 'CUS-0877']), 'CUS-1321')
  assert.equal(createCustomerId([]), 'CUS-1001')
})

test('accepts a customer with no photograph and no KYC reference', () => {
  const errors = validateCustomer(validInput, { customers: existing })
  assert.equal(hasCustomerErrors(errors), false)
})

test('rejects an incomplete customer', () => {
  const errors = validateCustomer(
    {
      ...validInput,
      fullName: '',
      phone: '123',
      address: '12',
      place: '',
      pinCode: '600',
      status: '',
    },
    { customers: existing },
  )

  assert.equal(errors.fullName, 'Enter the customer name.')
  assert.equal(errors.phone, 'Enter a 10-digit Indian mobile number.')
  assert.equal(errors.address, 'Enter the street address.')
  assert.equal(errors.place, 'Enter the place.')
  assert.equal(errors.pinCode, 'Enter a 6-digit PIN code.')
  assert.equal(errors.status, 'Choose a customer status.')
})

test('rejects an alternate phone that matches the primary phone', () => {
  const errors = validateCustomer(
    { ...validInput, alternatePhone: '9841015020' },
    { customers: existing },
  )
  assert.match(errors.alternatePhone, /different number/)
})

test('rejects a phone number that already belongs to another customer', () => {
  const errors = validateCustomer(
    { ...validInput, phone: '9841010480' },
    { customers: existing },
  )
  assert.match(errors.phone, /Ramesh Kumar/)
})

test('allows the same customer to keep their own phone while editing', () => {
  const errors = validateCustomer(
    { ...validInput, fullName: 'Ramesh Kumar', phone: '9841010480' },
    { customers: existing, ignoreId: 'CUS-1048' },
  )
  assert.equal(hasCustomerErrors(errors), false)
})

test('requires both parts of a started KYC reference', () => {
  const errors = validateCustomer(
    {
      ...validInput,
      kycDocuments: [{ key: 'row-1', type: 'PAN', reference: '' }],
    },
    { customers: existing },
  )
  assert.equal(errors.kyc['row-1'].reference, 'Enter the document reference.')
})

test('searches by name and by phone digits, then filters status', () => {
  const byName = filterCustomers(existing, { query: 'ramesh' })
  assert.deepEqual(byName.map((customer) => customer.id), ['CUS-1048'])

  const byPhone = filterCustomers(existing, { query: '98411 08770' })
  assert.deepEqual(byPhone.map((customer) => customer.id), ['CUS-0877'])

  const inactive = filterCustomers(existing, { status: 'Inactive' })
  assert.deepEqual(inactive.map((customer) => customer.id), ['CUS-0877'])

  const namedInactive = filterCustomers(existing, { query: 'Ramesh', status: 'Inactive' })
  assert.equal(namedInactive.length, 0)
})
