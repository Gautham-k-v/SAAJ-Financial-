import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SaajWordmark } from '../../components/brand/SaajMark'
import { Button } from '../../components/ui/Button'
import { IconButton } from '../../components/ui/IconButton'
import { TextField } from '../../components/ui/TextField'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { signInAgent } from '../../services/authService'

const desks = [
  ['Karthik Rajan', 'karthik.rajan@saaj.example', 'Fieldbook-01'],
  ['Divya Mohan', 'divya.mohan@saaj.example', 'Fieldbook-02'],
  ['Meena Krishnan', 'meena.krishnan@saaj.example', 'Fieldbook-03'],
  ['Arun Prasad', 'arun.prasad@saaj.example', 'Fieldbook-04'],
]

export default function AgentLoginPage() {
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  useDocumentTitle('Agent sign in')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!identifier.trim() || !password) {
      setError('Enter the agent account and password.')
      return
    }
    setPending(true)
    setError('')
    try {
      await signInAgent(identifier, password)
      navigate('/agent/dashboard', { replace: true })
    } catch (caught) {
      const message = caught?.response?.data?.error?.message
      setError(message || caught.message || 'Sign-in did not complete.')
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-canvas px-5 py-10">
      <div className="w-full max-w-md">
        <SaajWordmark />
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Collection agent</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-900">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Issued accounts are checked by the API. Agents added by an administrator use a separate development password stored in this browser. Production authentication is not connected. There is no public registration.
        </p>
        <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
          <TextField
            id="agent-identifier"
            label="Email or username"
            name="username"
            autoComplete="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />
          <TextField
            id="agent-password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            value={password}
            error={error}
            onChange={(event) => setPassword(event.target.value)}
            trailing={
              <IconButton label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((current) => !current)}>
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </IconButton>
            }
          />
          <div className="flex justify-end">
            <Link to="/agent/forgot" className="text-sm font-semibold text-teal-800 hover:text-teal-900">
              Forgot password
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Checking account' : 'Log in'}
          </Button>
        </form>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
          <p className="font-medium text-navy-900">Review accounts</p>
          <ul className="mt-2 space-y-1">
            {desks.map(([name, email, deskPassword]) => (
              <li key={email}>
                {name}: {email} · {deskPassword}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-6 text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-teal-800 hover:text-teal-900">
            Administrator sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
