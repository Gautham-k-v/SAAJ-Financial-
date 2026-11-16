export const CUSTOMER_STATUSES = ['Active', 'Inactive']

export const KYC_DOCUMENT_TYPES = ['Aadhaar', 'PAN', 'Voter ID', 'Driving licence', 'Passport']

const PHONE_PATTERN = /^[6-9]\d{9}$/
const PIN_PATTERN = /^\d{6}$/
const NAME_PATTERN = /^[\p{L}][\p{L} .'-]{1,79}$/u
const CUSTOMER_ID_PATTERN = /^CUS-(\d+)$/

export class CustomerValidationError extends Error {
  constructor(fields) {
    super('Check the customer details.')
    this.name = 'CustomerValidationError'
    this.fields = fields
  }
}

export function createCustomerId(existingIds) {
  let highest = 1000

  for (const id of existingIds) {
    const match = CUSTOMER_ID_PATTERN.exec(id)
    if (!match) continue
    highest = Math.max(highest, Number(match[1]))
  }

  return `CUS-${String(highest + 1).padStart(4, '0')}`
}

export function customerInitials(fullName) {
  const letters = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('en-IN') ?? '')
    .join('')

  return letters || 'CU'
}

export function formatPhone(phone) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length !== 10) return phone
  return `${digits.slice(0, 5)} ${digits.slice(5)}`
}

export function emptyCustomerForm() {
  return {
    fullName: '',
    phone: '',
    alternatePhone: '',
    address: '',
    place: '',
    pinCode: '',
    photograph: null,
    kycDocuments: [],
    status: 'Active',
  }
}

export function toCustomerForm(customer) {
  return {
    fullName: customer.fullName,
    phone: customer.phone,
    alternatePhone: customer.alternatePhone,
    address: customer.address,
    place: customer.place,
    pinCode: customer.pinCode,
    photograph: customer.photograph,
    kycDocuments: customer.kycDocuments.map((document) => ({
      key: createRowKey(),
      type: document.type,
      reference: document.reference,
    })),
    status: customer.status,
  }
}

export function createKycRow() {
  return { key: createRowKey(), type: '', reference: '' }
}

export function normalizeCustomerInput(input) {
  return {
    fullName: input.fullName.trim().replace(/\s+/g, ' '),
    phone: input.phone.replace(/\D/g, ''),
    alternatePhone: input.alternatePhone.replace(/\D/g, ''),
    address: input.address.trim().replace(/\s+/g, ' '),
    place: input.place.trim().replace(/\s+/g, ' '),
    pinCode: input.pinCode.replace(/\D/g, ''),
    photograph: input.photograph || null,
    kycDocuments: input.kycDocuments
      .map((document) => ({
        type: document.type.trim(),
        reference: document.reference.trim(),
      }))
      .filter((document) => document.type || document.reference),
    status: input.status,
  }
}

export function validateCustomer(input, { customers = [], ignoreId = '' } = {}) {
  const normalized = normalizeCustomerInput(input)
  const errors = { kyc: {} }

  if (normalized.fullName.length < 2) {
    errors.fullName = 'Enter the customer name.'
  } else if (!NAME_PATTERN.test(normalized.fullName)) {
    errors.fullName = 'Use letters for the customer name.'
  }

  if (!normalized.phone) {
    errors.phone = 'Enter the phone number.'
  } else if (!PHONE_PATTERN.test(normalized.phone)) {
    errors.phone = 'Enter a 10-digit Indian mobile number.'
  }

  if (input.alternatePhone.trim() && !PHONE_PATTERN.test(normalized.alternatePhone)) {
    errors.alternatePhone = 'Enter a 10-digit Indian mobile number, or leave this blank.'
  } else if (normalized.alternatePhone && normalized.alternatePhone === normalized.phone) {
    errors.alternatePhone = 'Use a different number from the primary phone.'
  }

  if (!normalized.address) {
    errors.address = 'Enter the address.'
  } else if (normalized.address.length < 5) {
    errors.address = 'Enter the street address.'
  }

  if (!normalized.place) {
    errors.place = 'Enter the place.'
  } else if (normalized.place.length < 2) {
    errors.place = 'Enter the place.'
  }

  if (!normalized.pinCode) {
    errors.pinCode = 'Enter the PIN code.'
  } else if (!PIN_PATTERN.test(normalized.pinCode)) {
    errors.pinCode = 'Enter a 6-digit PIN code.'
  }

  if (!CUSTOMER_STATUSES.includes(normalized.status)) {
    errors.status = 'Choose a customer status.'
  }

  if (normalized.photograph && !normalized.photograph.startsWith('data:image/')) {
    errors.photograph = 'Choose an image file.'
  } else if (normalized.photograph && normalized.photograph.length > 550_000) {
    errors.photograph = 'Use a photograph smaller than 400 KB.'
  }

  input.kycDocuments.forEach((document) => {
    const type = document.type.trim()
    const reference = document.reference.trim()
    if (!type && !reference) return

    const rowErrors = {}
    if (!KYC_DOCUMENT_TYPES.includes(type)) rowErrors.type = 'Choose the document type.'
    if (!reference) rowErrors.reference = 'Enter the document reference.'
    else if (reference.length < 4) rowErrors.reference = 'Enter at least 4 characters.'

    if (rowErrors.type || rowErrors.reference) errors.kyc[document.key] = rowErrors
  })

  const takenBy = (phone) =>
    customers.find(
      (customer) =>
        customer.id !== ignoreId &&
        phone &&
        (phone === customer.phone || phone === customer.alternatePhone),
    )

  const phoneOwner = takenBy(normalized.phone)
  const alternateOwner = takenBy(normalized.alternatePhone)

  if (phoneOwner && !errors.phone) {
    errors.phone = `This number is already used by ${phoneOwner.fullName}.`
  }
  if (alternateOwner && !errors.alternatePhone) {
    errors.alternatePhone = `This number is already used by ${alternateOwner.fullName}.`
  }

  return errors
}

export function hasCustomerErrors(errors) {
  if (!errors) return false
  return Object.entries(errors).some(([key, value]) => {
    if (!value) return false
    if (key !== 'kyc') return true
    return Object.values(value).some((row) => row.type || row.reference)
  })
}

export function filterCustomers(customers, { query = '', status = 'All' } = {}) {
  const text = query.trim().toLocaleLowerCase('en-IN')
  const digits = query.replace(/\D/g, '')

  return customers.filter((customer) => {
    if (status !== 'All' && customer.status !== status) return false
    if (!text) return true

    const nameMatches = customer.fullName.toLocaleLowerCase('en-IN').includes(text)
    const phoneMatches =
      digits.length > 0 &&
      (customer.phone.includes(digits) || customer.alternatePhone.includes(digits))

    return nameMatches || phoneMatches
  })
}

function createRowKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `kyc-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
