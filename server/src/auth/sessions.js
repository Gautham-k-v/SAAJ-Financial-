import { randomBytes } from 'node:crypto'

const sessions = new Map()
const TWELVE_HOURS = 12 * 60 * 60 * 1000
const COOKIE = 'saaj.session'

export function createSession(account) {
  const token = randomBytes(32).toString('hex')
  const session = {
    token,
    role: account.role,
    accountId: account.id,
    name: account.name,
    email: account.email,
    phone: account.phone,
    expiresAt: Date.now() + TWELVE_HOURS,
  }
  sessions.set(token, session)
  return session
}

export function readSession(token) {
  if (!token) return null
  const session = sessions.get(token)
  if (!session) return null
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token)
    return null
  }
  return session
}

export function destroySession(token) {
  if (token) sessions.delete(token)
}

export function tokenFromRequest(req) {
  const header = req.get('authorization') || ''
  const bearer = header.match(/^Bearer\s+([a-f0-9]{64})$/i)
  if (bearer) return bearer[1]
  return readCookie(req.headers.cookie || '', COOKIE)
}

export function sessionCookie(token) {
  return `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${TWELVE_HOURS / 1000}`
}

export function clearSessionCookie() {
  return `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
}

function readCookie(header, name) {
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return ''
}
