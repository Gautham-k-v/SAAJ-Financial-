import { customerSeed } from '../data/customerSeed.js'
import { assertAdmin } from './access.js'
import { recordCustomerCreated } from './notificationService.js'
import {
  createCustomerId,
  CustomerValidationError,
  hasCustomerErrors,
  normalizeCustomerInput,
  validateCustomer,
} from '../utils/customers.js'

const STORAGE_KEY = 'saaj.customers.v1'

/**
 * Development store for customer records.
 * The dashboard sample book is separate and is not written here.
 * Replace these functions with API calls when customer routes exist.
 */
export function listCustomers() {
  return readCustomers().sort(compareCustomers)
}

export function getCustomer(customerId) {
  return readCustomers().find((customer) => customer.id === customerId) ?? null
}

export function createCustomer(input) {
  assertAdmin('create a customer')
  const customers = readCustomers()
  const errors = validateCustomer(input, { customers })
  if (hasCustomerErrors(errors)) throw new CustomerValidationError(errors)

  const customer = {
    ...normalizeCustomerInput(input),
    id: createCustomerId(customers.map((record) => record.id)),
    createdAt: todayIsoDate(),
  }
  customer.kycDocuments = customer.kycDocuments.filter((document) => document.type && document.reference)

  writeCustomers([customer, ...customers])
  recordCustomerCreated(customer)
  return customer
}

export function updateCustomer(customerId, input) {
  assertAdmin('edit a customer')
  const customers = readCustomers()
  const current = customers.find((customer) => customer.id === customerId)
  if (!current) throw new Error('Customer not found.')

  const errors = validateCustomer(input, { customers, ignoreId: customerId })
  if (hasCustomerErrors(errors)) throw new CustomerValidationError(errors)

  const updated = {
    ...normalizeCustomerInput(input),
    id: current.id,
    createdAt: current.createdAt,
  }
  updated.kycDocuments = updated.kycDocuments.filter((document) => document.type && document.reference)

  writeCustomers(customers.map((customer) => (customer.id === customerId ? updated : customer)))
  return updated
}

function readCustomers() {
  const stored = storage().getItem(STORAGE_KEY)
  if (!stored) {
    const seed = clone(customerSeed)
    storage().setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }

  try {
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) throw new Error('Customer records are unreadable.')
    return parsed
  } catch {
    const seed = clone(customerSeed)
    storage().setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

function writeCustomers(customers) {
  storage().setItem(STORAGE_KEY, JSON.stringify(customers))
}

function storage() {
  if (typeof localStorage === 'undefined') {
    throw new Error('Customer records are stored in the browser for this stage.')
  }
  return localStorage
}

function compareCustomers(left, right) {
  if (left.createdAt !== right.createdAt) return right.createdAt.localeCompare(left.createdAt)
  return left.fullName.localeCompare(right.fullName, 'en-IN')
}

function todayIsoDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}
