import { readSession, tokenFromRequest } from '../auth/sessions.js'

export function requireRole(...roles) {
  return (req, res, next) => {
    const session = readSession(tokenFromRequest(req))
    if (!session) {
      const error = new Error('Sign in is required.')
      error.status = 401
      next(error)
      return
    }
    if (!roles.includes(session.role)) {
      const error = new Error('This account cannot perform that action.')
      error.status = 403
      next(error)
      return
    }
    req.auth = session
    next()
  }
}
