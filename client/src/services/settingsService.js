import { PAYMENT_METHODS } from '../utils/collections.js'
import {
  SettingsValidationError,
  defaultSettings,
  validateAdminProfile,
  validateBusiness,
  validateLoanSettings,
  validatePasswordChange,
  validatePaymentSettings,
} from '../utils/settings.js'

const STORAGE_KEY = 'saaj.settings.v1'

/**
 * Development preferences for this browser.
 * Replace these reads and writes with the settings API when it exists.
 * Nothing here is a server backup, and loan or receipt records are not rewritten.
 */
export function getSettings() {
  return read()
}

export function getBusinessProfile() {
  return { ...read().business }
}

export function saveBusinessProfile(input) {
  const { errors, value } = validateBusiness(input)
  if (Object.keys(errors).length) throw new SettingsValidationError(errors)
  const settings = read()
  settings.business = value
  write(settings)
  note('Business profile saved', 'Saved in this browser. Existing receipts were not rewritten.')
  return value
}

export function saveAdminProfile(adminId, input) {
  const { errors, value } = validateAdminProfile(input)
  if (Object.keys(errors).length) throw new SettingsValidationError(errors)
  const settings = read()
  const admin = settings.admins.find((item) => item.id === adminId)
  if (!admin) throw new SettingsValidationError({ form: 'That administrator is not on the desk.' })
  admin.name = value.name
  admin.phone = value.phone
  write(settings)
  note('Administrator profile saved', `${admin.id} was updated in this browser.`)
  return { ...admin }
}

export function setAdminStatus(adminId, status) {
  const settings = read()
  const admin = settings.admins.find((item) => item.id === adminId)
  if (!admin) throw new SettingsValidationError({ form: 'That administrator is not on the desk.' })
  if (status !== 'Active' && status !== 'Inactive') throw new SettingsValidationError({ status: 'Choose a status.' })
  const remaining = settings.admins.filter((item) => item.id !== adminId && item.status === 'Active')
  if (status === 'Inactive' && remaining.length === 0) {
    throw new SettingsValidationError({ status: 'Keep at least one active administrator.' })
  }
  admin.status = status
  write(settings)
  note('Administrator status changed', `${admin.id} is ${status}.`)
  return { ...admin }
}

export function getLoanSettings() {
  return { ...read().loans }
}

export function saveLoanSettings(input) {
  const { errors, value } = validateLoanSettings(input)
  if (Object.keys(errors).length) throw new SettingsValidationError(errors)
  const settings = read()
  settings.loans = value
  write(settings)
  note('Loan defaults saved', 'Open loans were not changed.')
  return value
}

export function getPaymentSettings() {
  const payments = read().payments
  const methods = (payments.methods || []).filter((method) => PAYMENT_METHODS.includes(method))
  return { ...payments, methods: methods.length ? methods : [...PAYMENT_METHODS] }
}

export function savePaymentSettings(input) {
  const { errors, value } = validatePaymentSettings(input)
  if (Object.keys(errors).length) throw new SettingsValidationError(errors)
  const settings = read()
  settings.payments = value
  write(settings)
  note('Payment settings saved', 'Existing transaction IDs and receipt numbers were left as they are.')
  return value
}

export function saveNotificationSettings(input) {
  const settings = read()
  settings.notifications = {
    payment: Boolean(input.payment),
    overdue: Boolean(input.overdue),
    daily: Boolean(input.daily),
    agent: Boolean(input.agent),
  }
  write(settings)
  note('Notification preferences saved', 'No alert was sent. A notification service is not connected.')
  return settings.notifications
}

export function requestPasswordChange(input) {
  const { errors } = validatePasswordChange(input)
  if (Object.keys(errors).length) throw new SettingsValidationError(errors)
  note('Password change requested', 'The password was not stored. The preview sign-in is unchanged.')
  return { accepted: true, stored: false }
}

export function notePreviewOpened() {
  note('Preview sign-in', 'A development preview was opened. The password was not stored.')
}

export function receiptBrand() {
  const business = getBusinessProfile()
  return {
    brandName: business.name || 'SAAJ',
    brandDetail: [business.address, business.phone, business.registration, business.receiptFooter].filter(Boolean).join(' · '),
  }
}

function note(action, detail) {
  const settings = read()
  settings.log = [{ at: stamp(), action, detail }, ...settings.log].slice(0, 20)
  write(settings)
}

function read() {
  const fallback = defaultSettings()
  const stored = storage().getItem(STORAGE_KEY)
  if (!stored) {
    storage().setItem(STORAGE_KEY, JSON.stringify(fallback))
    return fallback
  }
  try {
    const parsed = JSON.parse(stored)
    return {
      ...fallback,
      ...parsed,
      business: { ...fallback.business, ...parsed.business },
      loans: { ...fallback.loans, ...parsed.loans },
      payments: { ...fallback.payments, ...parsed.payments },
      notifications: { ...fallback.notifications, ...parsed.notifications },
      admins: mergeAdmins(fallback.admins, parsed.admins),
      log: Array.isArray(parsed.log) ? parsed.log.slice(0, 20) : [],
    }
  } catch {
    return fallback
  }
}

function mergeAdmins(seed, stored) {
  if (!Array.isArray(stored)) return seed
  return seed.map((admin) => {
    const current = stored.find((item) => item.id === admin.id)
    if (!current) return admin
    return {
      ...admin,
      name: current.name || admin.name,
      phone: current.phone || admin.phone,
      status: current.status === 'Inactive' ? 'Inactive' : 'Active',
    }
  })
}

function write(settings) {
  const copy = JSON.parse(JSON.stringify(settings))
  delete copy.password
  delete copy.hash
  storage().setItem(STORAGE_KEY, JSON.stringify(copy))
}

function storage() {
  if (typeof localStorage === 'undefined') {
    throw new Error('Settings are stored in the browser for this stage.')
  }
  return localStorage
}

function stamp() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date())
}
