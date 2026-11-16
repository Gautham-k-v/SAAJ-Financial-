import { PAYMENT_METHODS } from './collections.js'
import { nextNumberedId } from './payments.js'

export const SETTINGS_SECTIONS = [
  ['business', 'Business profile'],
  ['admins', 'Admin accounts'],
  ['agents', 'Collection agents'],
  ['loans', 'Loan configuration'],
  ['payments', 'Payment settings'],
  ['notifications', 'Notifications'],
  ['security', 'Security'],
]

export const FINANCE_METHODS = [
  ['amount', 'Entered amount on each loan'],
  ['percent', 'Percent of principal, stored for later'],
]

export const ACTIVATION_MODES = [
  ['manual', 'Stay pending until an administrator activates the loan'],
  ['on-create', 'Activate a new loan when it is created'],
]

const PHONE_PATTERN = /^[6-9]\d{9}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PREFIX_PATTERN = /^[A-Z]{2,6}$/

export class SettingsValidationError extends Error {
  constructor(fields) {
    super('Check the settings.')
    this.name = 'SettingsValidationError'
    this.fields = fields
  }
}

export function defaultSettings() {
  return {
    business: {
      name: 'SAAJ',
      logo: '',
      address: '',
      phone: '9841000001',
      email: 'admin@saaj.example',
      registration: '',
      receiptFooter: 'Daily loan collections',
    },
    admins: [
      admin('ADM-01', 'SAAJ Administrator', 'admin@saaj.example', '9841000001'),
      admin('ADM-02', 'Operations desk', 'operations@saaj.example', '9841000002'),
      admin('ADM-03', 'Collections desk', 'collections@saaj.example', '9841000003'),
      admin('ADM-04', 'Finance desk', 'finance@saaj.example', '9841000004'),
    ],
    loans: {
      frequency: 'Daily',
      durationDays: 100,
      financeMethod: 'amount',
      financePercent: '',
      activation: 'manual',
    },
    payments: {
      methods: [...PAYMENT_METHODS],
      receiptPrefix: 'RCP',
      referenceMethods: ['UPI', 'Bank transfer'],
    },
    notifications: {
      payment: true,
      overdue: true,
      daily: true,
      agent: false,
    },
    log: [],
  }
}

export function validateBusiness(input) {
  const errors = {}
  const name = String(input.name ?? '').trim()
  const phone = String(input.phone ?? '').replace(/\D/g, '')
  const email = String(input.email ?? '').trim().toLocaleLowerCase('en-IN')
  const address = String(input.address ?? '').trim()
  const registration = String(input.registration ?? '').trim()
  const receiptFooter = String(input.receiptFooter ?? '').trim()
  const logo = String(input.logo ?? '')

  if (name.length < 2 || name.length > 40) errors.name = 'Enter a business name of 2–40 characters.'
  if (!PHONE_PATTERN.test(phone)) errors.phone = 'Enter a 10-digit Indian mobile number.'
  if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.'
  if (!address) errors.address = 'Enter the business address.'
  else if (address.length > 160) errors.address = 'Keep the address within 160 characters.'
  if (registration.length > 40) errors.registration = 'Keep the registration within 40 characters.'
  if (receiptFooter.length > 80) errors.receiptFooter = 'Keep the receipt line within 80 characters.'
  if (logo && !logo.startsWith('data:image/')) errors.logo = 'Use an image file.'
  if (logo.length > 200_000) errors.logo = 'Use a logo smaller than 150 KB.'

  return { errors, value: { name, phone, email, address, registration, receiptFooter, logo } }
}

export function validateAdminProfile(input) {
  const errors = {}
  const name = String(input.name ?? '').trim()
  const phone = String(input.phone ?? '').replace(/\D/g, '')
  if (name.length < 2) errors.name = 'Enter the administrator name.'
  if (!PHONE_PATTERN.test(phone)) errors.phone = 'Enter a 10-digit Indian mobile number.'
  return { errors, value: { name, phone } }
}

export function validateLoanSettings(input) {
  const errors = {}
  const duration = Number(input.durationDays)
  const financeMethod = input.financeMethod
  const activation = input.activation
  const percent = String(input.financePercent ?? '').trim()

  if (input.frequency !== 'Daily') errors.frequency = 'The schedule builder uses a daily instalment.'
  if (!Number.isInteger(duration) || duration < 1 || duration > 365) errors.durationDays = 'Enter a duration from 1 to 365 days.'
  if (!FINANCE_METHODS.some(([id]) => id === financeMethod)) errors.financeMethod = 'Choose a finance charge method.'
  if (!ACTIVATION_MODES.some(([id]) => id === activation)) errors.activation = 'Choose when a new loan becomes active.'
  if (financeMethod === 'percent' && !/^\d{1,2}(\.\d{1,2})?$/.test(percent)) {
    errors.financePercent = 'Enter a percent from 0 to 99.99.'
  }

  return {
    errors,
    value: {
      frequency: 'Daily',
      durationDays: duration,
      financeMethod,
      financePercent: financeMethod === 'percent' ? percent : '',
      activation,
    },
  }
}

export function validatePaymentSettings(input) {
  const errors = {}
  const methods = PAYMENT_METHODS.filter((method) => (input.methods || []).includes(method))
  const referenceMethods = PAYMENT_METHODS.filter((method) => (input.referenceMethods || []).includes(method))
  const receiptPrefix = String(input.receiptPrefix ?? '').trim().toUpperCase()

  if (methods.length === 0) errors.methods = 'Keep at least one payment method available.'
  if (!PREFIX_PATTERN.test(receiptPrefix)) errors.receiptPrefix = 'Use 2–6 capital letters.'
  if (referenceMethods.some((method) => !methods.includes(method))) {
    errors.referenceMethods = 'A reference can be required only for a method that is available.'
  }

  return { errors, value: { methods, referenceMethods, receiptPrefix } }
}

export function validatePasswordChange(input) {
  const errors = {}
  const password = String(input.password ?? '')
  const confirm = String(input.confirm ?? '')
  if (password.length < 8) errors.password = 'Use at least 8 characters.'
  if (password !== confirm) errors.confirm = 'Enter the same password again.'
  return { errors }
}

export function nextReceiptNumber(existingReceipts, prefix) {
  return nextNumberedId(prefix, existingReceipts)
}

function admin(id, name, email, phone) {
  return { id, name, email, phone, status: 'Active', role: 'Administrator' }
}
