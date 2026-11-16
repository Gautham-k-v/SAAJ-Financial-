import { Router } from 'express'
import { authenticate } from '../auth/accounts.js'
import { clearSessionCookie, createSession, destroySession, sessionCookie, tokenFromRequest } from '../auth/sessions.js'
import { requireRole } from '../middleware/requireRole.js'

export const authRouter = Router()

authRouter.post('/auth/login', (req, res) => {
  const identifier = req.body?.identifier
  const password = req.body?.password
  if (!identifier || !password) {
    res.status(400).json({ error: { message: 'Enter the account and password.' } })
    return
  }

  const account = authenticate(identifier, password)
  if (!account) {
    res.status(401).json({ error: { message: 'Those sign-in details were not recognised.' } })
    return
  }

  const session = createSession(account)
  res.setHeader('Set-Cookie', sessionCookie(session.token))
  res.json({
    token: session.token,
    role: account.role,
    accountId: account.id,
    name: account.name,
    email: account.email,
    phone: account.phone,
  })
})

/**
 * Development recovery only. Production will let an administrator issue a new password.
 * This route never changes a password and never reveals whether the account exists.
 */
authRouter.post('/auth/forgot', (req, res) => {
  const identifier = String(req.body?.identifier ?? '').trim()
  if (!identifier) {
    res.status(400).json({ error: { message: 'Enter the agent email or username.' } })
    return
  }
  res.status(202).json({
    accepted: true,
    mode: 'development',
    message: 'Password reset email is not sent in development. An administrator issues the field password.',
  })
})

authRouter.post('/auth/logout', (req, res) => {
  destroySession(tokenFromRequest(req))
  res.setHeader('Set-Cookie', clearSessionCookie())
  res.json({ signedOut: true })
})

authRouter.get('/auth/me', requireRole('admin', 'agent'), (req, res) => {
  res.json({
    role: req.auth.role,
    accountId: req.auth.accountId,
    name: req.auth.name,
    email: req.auth.email,
    phone: req.auth.phone,
  })
})

authRouter.post('/admin/loans', requireRole('admin'), (_req, res) => {
  res.json({ allowed: true, action: 'loan.create' })
})

authRouter.post('/admin/agents', requireRole('admin'), (_req, res) => {
  res.json({ allowed: true, action: 'agent.manage' })
})

authRouter.get('/admin/reports', requireRole('admin'), (_req, res) => {
  res.json({ allowed: true, action: 'report.read' })
})

authRouter.delete('/admin/transactions/:paymentId', requireRole('admin'), (_req, res) => {
  res.json({ allowed: true, action: 'payment.delete' })
})
