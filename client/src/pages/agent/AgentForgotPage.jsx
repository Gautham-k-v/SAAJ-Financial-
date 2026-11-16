import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SaajWordmark } from '../../components/brand/SaajMark'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { apiClient } from '../../api/client'

export default function AgentForgotPage() {
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)
  useDocumentTitle('Forgot password')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!identifier.trim()) {
      setError('Enter the agent email or username.')
      return
    }
    setPending(true)
    setError('')
    try {
      await apiClient.post('/auth/forgot', { identifier })
      setSent(true)
    } catch {
      setError('The request could not be sent. The password was not changed.')
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-canvas px-5 py-10">
      <div className="w-full max-w-md">
        <SaajWordmark />
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Collection agent</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-900">Forgot password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Development sign-in does not send email and does not change a password. An administrator will issue a new one when agent management is connected.
        </p>
        {sent ? (
          <p className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700" role="status">
            The request was recorded. Your password is unchanged. Ask an administrator for the issued field password.
          </p>
        ) : (
          <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
            <TextField
              id="forgot-identifier"
              label="Email or username"
              name="username"
              autoComplete="username"
              value={identifier}
              error={error}
              onChange={(event) => setIdentifier(event.target.value)}
            />
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Sending request' : 'Request help'}
            </Button>
          </form>
        )}
        <p className="mt-6 text-sm text-slate-500">
          <Link to="/agent/login" className="font-semibold text-teal-800 hover:text-teal-900">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  )
}
