import { scryptSync, timingSafeEqual } from 'node:crypto'

/**
 * Issued desk accounts. Passwords are stored as scrypt hashes.
 * There is no public registration route.
 */
const accounts = [
  account('AGT-01', 'agent', 'karthik', 'karthik.rajan@saaj.example', 'Karthik Rajan', '9841011001', '581fb263099630bb3992c8a8333d3a6b', '11fea5059caedc7e092dbf6dcb36d42255c4e2ad7dc7bc1703f3a025430179af'),
  account('AGT-02', 'agent', 'divya', 'divya.mohan@saaj.example', 'Divya Mohan', '9841011002', 'c2cc8a102be89becad04a4594d79a19e', 'ed16b38d4e8a3e6073c02fb90520c60d534e75905711418378d9392061abb716'),
  account('AGT-03', 'agent', 'meena', 'meena.krishnan@saaj.example', 'Meena Krishnan', '9841011003', 'de70c2b6b0f2982c6ec6abbc91236c20', 'd4c81f485fc467769e975e574cca6a4e1c553af296009014267c977e2c013b2c'),
  account('AGT-04', 'agent', 'arun', 'arun.prasad@saaj.example', 'Arun Prasad', '9841011004', '120449668dea5d485d6f78dcdbd15f76', 'a44ad02dc799c53f2c19255efed3c478f8e753b7c7aad753dfe9fc0ea26f1841'),
  account('ADM-01', 'admin', 'admin', 'admin@saaj.example', 'SAAJ Administrator', '9841000001', '93200814a54727194c8feeca532bf3d4', '17887bcaa5ac4b51f9d8cb044dc4e649de71dde0cc76f5aeb8fe54a42b197097'),
]

export function authenticate(identifier, password) {
  const key = String(identifier ?? '').trim().toLocaleLowerCase('en-IN')
  const accountRecord = accounts.find((item) => item.username === key || item.email === key)
  if (!accountRecord || !passwordMatches(password, accountRecord)) return null
  return publicAccount(accountRecord)
}

export function publicAccount(accountRecord) {
  return {
    id: accountRecord.id,
    role: accountRecord.role,
    username: accountRecord.username,
    email: accountRecord.email,
    name: accountRecord.name,
    phone: accountRecord.phone,
  }
}

function account(id, role, username, email, name, phone, salt, hash) {
  return { id, role, username, email, name, phone, salt, hash }
}

function passwordMatches(password, accountRecord) {
  const candidate = scryptSync(String(password), accountRecord.salt, 32)
  const expected = Buffer.from(accountRecord.hash, 'hex')
  if (candidate.length !== expected.length) return false
  return timingSafeEqual(candidate, expected)
}
